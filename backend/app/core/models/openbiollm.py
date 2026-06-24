"""
OpenBioLLM Model with HuggingFace Inference API Primary & Groq Failover

Primary: HuggingFace Inference API (httpx async)
Failover: Groq API on 429/503 -> llama-3-70b-versatile
Retry with exponential backoff before failover
"""
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from groq import Groq
from typing import Optional
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class OpenBioLLMError(Exception):
    """Custom exception for OpenBioLLM errors"""
    pass


class OpenBioLLM:
    """
    Chain 1: OpenBioLLM for biomedical queries
    
    Uses HuggingFace Inference API as primary with Groq as failover.
    Implements exponential backoff retry before failover.
    """
    
    def __init__(self):
        self.hf_token = settings.HUGGINGFACE_TOKEN
        self.groq_api_key = settings.GROQ_API_KEY
        self.base_model = "microsoft/BioGPT-Large"  # OpenBioLLM model on HF
        self.fallback_model = "llama-3-70b-versatile"  # Groq fallback
        self.hf_base_url = "https://api-inference.huggingface.co/models"
        
        # Initialize clients
        self.hf_client = httpx.AsyncClient(
            base_url=self.hf_base_url,
            headers={"Authorization": f"Bearer {self.hf_token}"},
            timeout=30.0
        )
        self.groq_client = Groq(api_key=self.groq_api_key) if self.groq_api_key else None
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.HTTPStatusError))
    )
    async def _hf_inference(self, prompt: str) -> str:
        """
        Primary inference via HuggingFace Inference API.
        Retries 3 times with exponential backoff on timeout or 5xx errors.
        """
        url = f"/{self.base_model}"
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 512,
                "temperature": 0.7,
                "top_p": 0.9,
                "do_sample": True
            }
        }
        
        response = await self.hf_client.post(url, json=payload)
        
        if response.status_code == 429:
            # Rate limited - will trigger retry
            raise httpx.HTTPStatusError("Rate limited", request=response.request, response=response)
        elif response.status_code >= 500:
            # Server error - will trigger retry
            raise httpx.HTTPStatusError(f"Server error: {response.status_code}", 
                                        request=response.request, response=response)
        elif response.status_code != 200:
            # Other errors - don't retry, failover
            error_msg = response.json().get("error", "Unknown error")
            logger.warning(f"HuggingFace inference failed: {error_msg}")
            raise OpenBioLLMError(f"HF API error: {error_msg}")
        
        result = response.json()
        # Handle different response formats from HF
        if isinstance(result, list) and len(result) > 0:
            return result[0].get("generated_text", "")
        elif isinstance(result, dict):
            return result.get("generated_text", "")
        return ""
    
    async def _groq_fallback(self, prompt: str) -> str:
        """Execute prompt on Groq as fallback."""
        if not self.groq_client:
            raise OpenBioLLMError("Groq client not initialized - GROQ_API_KEY not set")
        
        try:
            chat_completion = self.groq_client.chat.completions.create(
                model=self.fallback_model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=512,
                temperature=0.7,
                top_p=0.9
            )
            return chat_completion.choices[0].message.content
        except Exception as e:
            logger.error(f"Groq fallback failed: {str(e)}")
            raise OpenBioLLMError(f"Groq fallback failed: {str(e)}")
    
    async def generate(self, prompt: str) -> str:
        """
        Generate response with automatic failover from HuggingFace to Groq.
        
        Args:
            prompt: The input prompt for the model
            
        Returns:
            Generated text response
            
        Raises:
            OpenBioLLMError: If both primary and fallback fail
        """
        # Try HuggingFace primary with retries
        try:
            logger.info("Attempting HuggingFace Inference API...")
            response = await self._hf_inference(prompt)
            if response:
                logger.info("HuggingFace inference successful")
                return response
        except (httpx.TimeoutException, httpx.HTTPStatusError) as e:
            logger.warning(f"HuggingFace inference failed after retries: {str(e)}")
        except OpenBioLLMError as e:
            logger.warning(f"HuggingFace inference error: {str(e)}")
        
        # Fallback to Groq
        logger.info("Falling back to Groq API...")
        try:
            response = await self._groq_fallback(prompt)
            logger.info("Groq fallback successful")
            return response
        except OpenBioLLMError as e:
            logger.error(f"Both HuggingFace and Groq failed: {str(e)}")
            raise
    
    async def close(self):
        """Close HTTP clients."""
        await self.hf_client.aclose()


# Singleton instance
_openbiollm_instance: Optional[OpenBioLLM] = None


def get_openbiollm() -> OpenBioLLM:
    """Get or create OpenBioLLM singleton instance."""
    global _openbiollm_instance
    if _openbiollm_instance is None:
        _openbiollm_instance = OpenBioLLM()
    return _openbiollm_instance