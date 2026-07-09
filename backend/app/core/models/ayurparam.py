import json
import os
from typing import Any, Dict, Optional
import logging

from backend.config import cfg

# Import Ollama client
try:
    from ollama import Client
    OLLAMA_CLIENT = Client(host=cfg.OLLAMA_BASE_URL or cfg.OLLAMA_URL)
except ImportError:
    OLLAMA_CLIENT = None

MISTRAL_MODEL = "mistral:7b"
AYURAPARAM_MODELS = [
    "hf.co/A-Aryam/AyurParam-GGUF:q4_k_m",
    "hf.co/A-Aryam/AyurParam-GGUF:F16",
]

logger = logging.getLogger(__name__)

# Placeholder implementation for AyurParam model (Chain 2)
# This module implements a graduated fallback system with:
# 1. RAG context lookup (placeholder for TASK-011)
# 2. Ollama Mistral query breakdown and response
# 3. Confidence scoring (0.0-1.0)
# 4. Graduated fallback logic per DEC-004:
#    - RAG found → answer with context
#    - RAG empty → model inference with confidence
#    - Both uncertain → return None (Chain 1 takeover)

class AyurParamResult:
    def __init__(self, response: Optional[str], confidence: float):
        self.response = response
        self.confidence = confidence

    def dict(self) -> Dict[str, Any]:
        return {"response": self.response, "confidence": self.confidence}

class AyurParamModel:
    def __init__(self):
        self.ollama_client = OLLAMA_CLIENT
        self.ollama_available = OLLAMA_CLIENT is not None
        self.ollama_models = AYURAPARAM_MODELS
        self.ollama_model = MISTRAL_MODEL
        
        # Configuration
        self.rag_threshold = 0.7  # Minimum confidence to trust RAG context
        self.min_model_confidence = 0.3  # Minimum confidence for model response
        
        # RAG retriever (lazy-initialized)
        self._retriever = None

    @property
    def retriever(self):
        """Lazy-initialize the HybridRetriever for Ayurveda knowledge base."""
        if self._retriever is None:
            from backend.app.core.rag.retriever import HybridRetriever
            self._retriever = HybridRetriever(
                collection=cfg.QDRANT_COLLECTION_AYURVEDA or "ayurveda_kb",
            )
        return self._retriever

    async def _retrieve_rag_context(self, query: str) -> tuple[bool, str]:
        """Retrieve relevant Ayurvedic context from Qdrant via HybridRetriever.

        Returns:
            tuple[bool, str]: (rag_found, context_text)
        """
        try:
            results = await self.retriever.retrieve(query, top_k=3)
            if not results:
                logger.info("RAG retrieval returned no results for AyurParam query")
                return False, ""

            context_parts = []
            for result in results:
                text = getattr(result, "text", "")
                if text:
                    context_parts.append(text)

            if context_parts:
                context = "\n\n".join(context_parts)
                logger.info("RAG retrieved %d context chunks for AyurParam query", len(context_parts))
                return True, context
            return False, ""
        except Exception as exc:
            logger.warning("AyurParam RAG retrieval failed: %s", exc)
            return False, ""

    async def invoke(self, query: str) -> AyurParamResult:
        """Process a query using the AyurParam chain with graduated fallback.

        Implementation Steps:
        1. Retrieve context from Qdrant knowledge base via HybridRetriever
        2. If RAG found and confidence high → return context-enriched response
        3. If RAG empty or confidence low → use Ollama Mistral for query breakdown
           and generate response with confidence scoring
        4. If Ollama unavailable or both uncertain → return None (fallback to Chain 1)

        Returns:
            AyurParamResult: Response and confidence score (0.0-1.0)
        """
        # Step 1: Retrieve context from Qdrant knowledge base
        rag_found, rag_context = await self._retrieve_rag_context(query)
            
        # Step 2: Use Ollama Mistral for query breakdown and response
        if self.ollama_available:
            try:
                # Use Mistral to break down and analyze the query
                breakdown = await self._breakdown_query(query)
                
                # Generate response based on breakdown + RAG context
                response = await self._generate_ayurvedic_response(breakdown, rag_context)
                
                # Calculate confidence based on response quality
                confidence = self._calculate_confidence(breakdown, response)
                
                # Boost confidence when RAG context was available
                if rag_found and confidence > 0.0:
                    confidence = min(1.0, confidence + 0.1)
                
                # Log low confidence if needed
                if confidence < self.min_model_confidence:
                    logger.info(f"Low confidence response generated: {confidence:.2f}")
                
                return AyurParamResult(
                    response=response,
                    confidence=confidence
                )
            except Exception as e:
                logger.error(f"Ollama processing failed: {str(e)}")
                # Continue to fallback logic
        
        # Step 3: If RAG found but Ollama unavailable, return context directly
        if rag_found and rag_context:
            logger.info("Ollama unavailable, returning RAG context directly")
            return AyurParamResult(
                response=f"Based on Ayurvedic knowledge:\n\n{rag_context[:1000]}",
                confidence=0.7
            )

        # Step 4: Both RAG and Ollama unavailable - return None for Chain 1 fallback
        logger.info("Both RAG and Ollama unavailable - returning None for Chain 1 fallback")
        return AyurParamResult(
            response=None,
            confidence=0.0
        )

    async def _call_ollama_model(self, prompt: str, temperature: float, max_tokens: int) -> str:
        if not self.ollama_available:
            raise RuntimeError("Ollama client not available")

        last_error = None
        for model_name in self.ollama_models:
            try:
                response = await self.ollama_client.generate(
                    model=model_name,
                    prompt=prompt,
                    options={"temperature": temperature, "max_tokens": max_tokens},
                    stream=False,
                )
                if hasattr(response, "response"):
                    return str(response.response).strip()
                return str(response).strip()
            except Exception as e:
                logger.warning("AyurParam model %s failed: %s", model_name, e)
                last_error = e

        raise RuntimeError(f"All AyurParam Ollama models failed: {last_error}")

    async def _breakdown_query(self, query: str) -> str:
        """Use Ollama to break down and analyze the query."""
        if not self.ollama_available:
            return "Error: Ollama not available"

        try:
            prompt = f"""You are a medical AI assistant specialized in Ayurvedic medicine.
Analyze the following query and break it down into key components for proper Ayurvedic assessment.
Query: {query}

Break down into:
1. Primary dosha(s) involved
2. Recommended lifestyle/dietary changes
3. Suggested herbs or formulations
4. Precautions or warnings

Generate a concise structured summary.
"""
            return await self._call_ollama_model(prompt, temperature=0.3, max_tokens=512)
        except Exception as e:
            logger.error(f"Ollama query breakdown failed: {str(e)}")
            return "Error in query breakdown"

    async def _generate_ayurvedic_response(self, breakdown: str, rag_context: str = "") -> str:
        """Generate Ayurvedic response based on query breakdown and RAG context."""
        if not self.ollama_available:
            return "Error: Ollama not available"

        try:
            prompt = f"""Based on the query breakdown: {breakdown}

"""
            if rag_context:
                prompt += f"""Use the following retrieved Ayurvedic knowledge to inform your response:
{rag_context}

"""
            prompt += """Generate a comprehensive Ayurvedic recommendation in 2-3 paragraphs.
Include:
- Assessment of dosha imbalance
- Dietary recommendations
- Herbal suggestions
- Lifestyle advice
- Precautions

Use traditional Ayurvedic knowledge but keep it practical and evidence-informed.
"""
            return await self._call_ollama_model(prompt, temperature=0.7, max_tokens=1024)
        except Exception as e:
            logger.error(f"Ollama Ayurvedic response generation failed: {str(e)}")
            return "Could not generate response"

    def _calculate_confidence(self, breakdown: str, response: str) -> float:
        """Calculate confidence score (0.0-1.0) based on response quality."""
        if not response or len(response.strip()) < 50:
            return 0.0
            
        # Basic confidence scoring - in real implementation this would be more sophisticated
        if len(response) > 500:
            return 0.9
        elif len(response) > 200:
            return 0.8
        elif len(response) > 100:
            return 0.6
        else:
            return 0.3

    def _is_confident(self) -> bool:
        """Check if confidence is above threshold."""
        # This is a placeholder - in real implementation would consider multiple factors
        return True  # Always return True for now to demonstrate fallback logic
