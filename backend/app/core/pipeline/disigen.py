"""Disigen node for TASK-012.

The node coordinates the health pipeline:
- mental health: semantic gate -> D-Node -> Mistral or rule trigger
- physical health: QIL -> router -> concurrent chains -> RAG -> lightweight fusion
- reports: extracted file text -> OpenBioLLM simplification
"""

from __future__ import annotations

import asyncio
import inspect
import logging
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Awaitable, Callable, Dict, List, Optional

from pydantic import BaseModel, Field

from backend.app.core.pipeline.router import RouteResult, Strategy, route_physical_query
from backend.app.core.safety.dnode import DNodeResult, keyword_fallback
from backend.config import cfg

logger = logging.getLogger(__name__)


class ProcessingType(str, Enum):
    MENTAL_HEALTH = "mental_health"
    PHYSICAL_HEALTH = "physical_health"
    REPORT_PROCESSING = "report_processing"


class ChainStatus(str, Enum):
    OK = "ok"
    SKIPPED = "skipped"
    ERROR = "error"


class ChainRun(BaseModel):
    name: str
    status: ChainStatus
    response: Optional[str] = None
    confidence: float = 0.0
    error: Optional[str] = None


class DisigenResult(BaseModel):
    processing_type: ProcessingType
    response: str
    confidence: float = Field(ge=0.0, le=1.0)
    sources: List[str] = Field(default_factory=list)
    is_crisis: bool = False
    crisis_message: Optional[str] = None
    chain_runs: List[ChainRun] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


@dataclass
class FallbackQILResult:
    intent: str
    urgency: str
    biomedical_score: float
    ayurvedic_score: float
    reformatted_queries: Dict[str, str]


MaybeAsync = Callable[..., Any]


class DisigenNode:
    """Orchestrates ReassureAI's three-chain backend pipeline."""

    def __init__(
        self,
        mistral_chain: Any = None,
        openbiollm_chain: Any = None,
        ayurparam_chain: Any = None,
        retriever: Any = None,
        qil_analyzer: Optional[MaybeAsync] = None,
        router: Callable[[str], RouteResult] = route_physical_query,
        semantic_analyzer: Optional[MaybeAsync] = None,
        rule_trigger: Optional[MaybeAsync] = None,
    ):
        self._mistral_chain = mistral_chain
        self._openbiollm_chain = openbiollm_chain
        self._ayurparam_chain = ayurparam_chain
        self._retriever = retriever
        self.qil_analyzer = qil_analyzer or self._default_qil_analyzer
        self.router = router
        self.semantic_analyzer = semantic_analyzer or self._default_semantic_analyzer
        self.rule_trigger = rule_trigger or self._default_rule_trigger

    async def process_query(
        self,
        query: str,
        user_id: Optional[str] = None,
        guardian_email: Optional[str] = None,
        file_content: Optional[str] = None,
        processing_type: Optional[str] = None,
        selected_model: Optional[str] = None,
    ) -> DisigenResult:
        query = (query or "").strip()
        if not query and not file_content:
            return DisigenResult(
                processing_type=ProcessingType.MENTAL_HEALTH,
                response="Please share a question or upload a report so I can help.",
                confidence=0.0,
                sources=[],
            )

        processing_type_enum = self._determine_type(query, file_content, processing_type)
        if processing_type_enum == ProcessingType.REPORT_PROCESSING:
            return await self._process_report(file_content or query)
        if processing_type_enum == ProcessingType.PHYSICAL_HEALTH:
            return await self._process_physical_health(query, selected_model=selected_model)
        return await self._process_mental_health(query, user_id=user_id, guardian_email=guardian_email)

    def _determine_type(
        self,
        query: str,
        file_content: Optional[str],
        explicit_type: Optional[str] = None,
    ) -> ProcessingType:
        if file_content:
            return ProcessingType.REPORT_PROCESSING

        if explicit_type:
            try:
                return ProcessingType(explicit_type)
            except ValueError:
                pass

        lowered = query.lower()
        mental_terms = {
            "anxiety",
            "depression",
            "panic",
            "stress",
            "hopeless",
            "lonely",
            "worthless",
            "suicide",
            "kill myself",
            "hurt myself",
            "mental health",
        }
        physical_terms = {
            "pain",
            "fever",
            "headache",
            "symptom",
            "medicine",
            "medication",
            "blood pressure",
            "diabetes",
            "cholesterol",
            "diet",
            "sleep",
            "dosha",
            "ayurveda",
            "vata",
            "pitta",
            "kapha",
        }

        if any(term in lowered for term in mental_terms):
            return ProcessingType.MENTAL_HEALTH
        if any(term in lowered for term in physical_terms):
            return ProcessingType.PHYSICAL_HEALTH
        return ProcessingType.MENTAL_HEALTH

    async def _process_mental_health(
        self,
        query: str,
        user_id: Optional[str],
        guardian_email: Optional[str],
    ) -> DisigenResult:
        try:
            analysis = await self._call(self.semantic_analyzer, query)
            dnode_result = self._evaluate_semantic_analysis(analysis)
        except Exception as exc:
            logger.warning("Semantic gate unavailable, using keyword fallback: %s", exc)
            analysis = None
            dnode_result = keyword_fallback(query)

        if dnode_result.is_crisis:
            await self._trigger_crisis_rule(user_id, guardian_email, dnode_result, query)
            return DisigenResult(
                processing_type=ProcessingType.MENTAL_HEALTH,
                response=dnode_result.response,
                confidence=1.0,
                sources=["semantic_gate" if analysis else "keyword_fallback", "dnode", "rule_based"],
                is_crisis=True,
                crisis_message=dnode_result.response,
                metadata={
                    "distress_level": dnode_result.level,
                    "reasoning": dnode_result.reasoning,
                },
            )

        # Retrieve RAG results for mental health
        rag_results = []
        try:
            rag_results = await self.retriever.retrieve(
                query, top_k=3,
                collection=cfg.QDRANT_COLLECTION_MENTAL_HEALTH or "mental_health_kb",
            )
        except Exception as exc:
            logger.warning("Mental health RAG retrieval failed: %s", exc)

        rag_context = "\n".join([getattr(r, "text", "") for r in rag_results if getattr(r, "text", "")])

        prompt = (
            "You are ReassureAI, a supportive mental health assistant. "
            "Respond with warmth, validation, and practical next steps. "
            "Do not diagnose. Encourage professional help when appropriate.\n\n"
        )
        if rag_context:
            prompt += f"Use the following retrieved mental health guidelines and context to inform your response:\n{rag_context}\n\n"
        
        prompt += f"User message: {query}"
        try:
            response = await self._run_mistral(prompt)
            chain_runs = [ChainRun(name="mistral", status=ChainStatus.OK, response=response, confidence=0.85)]
        except Exception as exc:
            logger.warning("Mental health Mistral chain failed, falling back: %s", exc)
            response = (
                "I’m sorry, I’m having trouble accessing the assistant right now. "
                "Please try again shortly."
            )
            chain_runs = [ChainRun(name="mistral", status=ChainStatus.ERROR, error=str(exc), confidence=0.0)]

        sources = ["semantic_gate" if analysis else "keyword_fallback", "mistral"]
        if rag_results:
            sources.append("rag")

        return DisigenResult(
            processing_type=ProcessingType.MENTAL_HEALTH,
            response=response,
            confidence=0.35 if chain_runs[0].status == ChainStatus.ERROR else 0.85,
            sources=sources,
            chain_runs=chain_runs,
            metadata={
                "emotional_state": getattr(analysis, "emotional_state", None),
                "distress_level": getattr(analysis, "distress_level", None),
                "rag_results_count": len(rag_results),
            },
        )

    async def _process_physical_health(self, query: str, selected_model: Optional[str] = None) -> DisigenResult:
        # 1. Retrieve RAG context first
        rag_results = []
        try:
            rag_results = await self.retriever.retrieve(
                query, top_k=3,
                collection=cfg.QDRANT_COLLECTION_AYURVEDA or "ayurveda_kb",
            )
        except Exception as exc:
            logger.warning("RAG retrieval failed: %s", exc)

        rag_context = "\n".join([getattr(r, "text", "") for r in rag_results if getattr(r, "text", "")])

        # 2. Run QIL and Router for metadata/compatibility
        qil_result = None
        route_result = None
        try:
            qil_result = await self._call(self.qil_analyzer, query)
            route_result = self.router(query)
        except Exception as exc:
            logger.warning("QIL/Router lookup failed: %s", exc)

        # 3. Process query using Mistral (pre-processing / refinement)
        try:
            pre_process_prompt = (
                "You are a medical query pre-processor. Rewrite and expand the following health-related query "
                "to make it clear, precise, and optimized for clinical and Ayurvedic retrieval. "
                "Do not answer the query. Just return the optimized query.\n\n"
                f"Query: {query}"
            )
            refined_query = await self._run_mistral(pre_process_prompt)
        except Exception as exc:
            logger.warning("Mistral pre-processing failed, using original query: %s", exc)
            refined_query = query

        # 4. Determine models to run based on selected_model
        run_modern = selected_model in (None, "all", "openbiollm")
        run_ayurvedic = selected_model in (None, "all", "ayurparam")

        tasks: Dict[str, Awaitable[ChainRun]] = {}

        if run_modern:
            openbiollm_prompt = (
                "You are a modern clinical medical AI assistant. Answer the query based on modern medical science, "
                "providing clear, clinical explanations and evidence-based guidance.\n\n"
            )
            if rag_context:
                openbiollm_prompt += f"Use the following retrieved clinical context to inform your response:\n{rag_context}\n\n"
            openbiollm_prompt += f"Query: {refined_query}"
            tasks["openbiollm"] = self._run_chain("openbiollm", self._run_openbiollm, openbiollm_prompt)

        if run_ayurvedic:
            ayur_prompt = (
                "You are an expert Ayurvedic practitioner AI. Answer the query based on Ayurvedic principles, "
                "dosha balancing (Vata, Pitta, Kapha), dietary and herbal remedies, and traditional medicine.\n"
            )
            if rag_context:
                ayur_prompt += f"Use the following retrieved Ayurvedic clinical context to inform your response:\n{rag_context}\n\n"
            ayur_prompt += f"Query: {refined_query}"
            tasks["ayurparam"] = self._run_chain("ayurparam", self._run_ayurparam, ayur_prompt)

        # Execute selected chains concurrently
        chain_runs = []
        if tasks:
            chain_runs = list(await asyncio.gather(*tasks.values()))

        # 5. Merge the responses using the response fusion layer (via Mistral)
        by_name = {run.name: run for run in chain_runs if run.status == ChainStatus.OK and run.response}

        if "openbiollm" in by_name and "ayurparam" in by_name:
            # Both successfully returned, merge using Mistral
            try:
                fusion_prompt = (
                    "You are a medical response fusion layer. Merge the following two health perspectives "
                    "(Modern Medical and Ayurvedic) into a unified, coherent, and patient-friendly response. "
                    "Identify common ground, explain how they complement each other, and highlight any key differences "
                    "or precautions. Use the retrieved context if relevant. Maintain a professional, empathetic tone.\n\n"
                    f"Retrieved Context:\n{rag_context}\n\n"
                    f"Modern Medical Response:\n{by_name['openbiollm'].response}\n\n"
                    f"Ayurvedic Response:\n{by_name['ayurparam'].response}\n\n"
                    "Fused Response:"
                )
                response = await self._run_mistral(fusion_prompt)
            except Exception as exc:
                logger.warning("Mistral response fusion failed, falling back to concatenated perspectives: %s", exc)
                response = f"## Modern Medical Perspective\n\n{by_name['openbiollm'].response}\n\n## Ayurvedic Perspective\n\n{by_name['ayurparam'].response}"
        elif "openbiollm" in by_name:
            response = by_name["openbiollm"].response
        elif "ayurparam" in by_name:
            response = by_name["ayurparam"].response
        else:
            response = "I could not generate a reliable answer right now. Please try again or consult a qualified clinician."

        # Add mandatory medical disclaimer
        disclaimer = (
            "\n\n## Safety Disclaimer\n\n"
            "ReassureAI can make mistakes. Cross-verify important health information "
            "with a qualified healthcare professional. This information is for educational "
            "purposes only and not a substitute for professional medical advice."
        )
        response += disclaimer

        # Calculate final confidence and sources
        ok_runs = [run for run in chain_runs if run.status == ChainStatus.OK]
        confidence = self._average_confidence(ok_runs) if ok_runs else 0.5
        
        sources = [run.name for run in ok_runs]
        if len(by_name) > 1:
            sources.append("mistral_fusion")
        else:
            sources.append("mistral_pre_process")
        if rag_results:
            sources.append("rag")

        return DisigenResult(
            processing_type=ProcessingType.PHYSICAL_HEALTH,
            response=response,
            confidence=confidence,
            sources=sources,
            chain_runs=chain_runs,
            metadata={
                "qil_intent": getattr(qil_result, "intent", None) if qil_result else None,
                "qil_urgency": getattr(qil_result, "urgency", None) if qil_result else None,
                "biomedical_score": getattr(qil_result, "biomedical_score", None) if qil_result else None,
                "ayurvedic_score": getattr(qil_result, "ayurvedic_score", None) if qil_result else None,
                "route_strategy": (
                    route_result.strategy.value if route_result and hasattr(route_result.strategy, "value")
                    else str(route_result.strategy) if route_result else "default"
                ),
                "active_chains": route_result.active_chains if route_result else ["modern", "ayurvedic"],
                "rag_results_count": len(rag_results),
                "selected_model": selected_model or "all",
            },
        )

    async def _process_report(self, file_content: str) -> DisigenResult:
        prompt = (
            "Simplify this medical report into patient-friendly markdown. "
            "Preserve abnormal values, explain what they may mean, and include a doctor-follow-up note.\n\n"
            f"Report text:\n{file_content}"
        )
        response = await self._run_openbiollm(prompt)
        return DisigenResult(
            processing_type=ProcessingType.REPORT_PROCESSING,
            response=response,
            confidence=0.9,
            sources=["openbiollm"],
            chain_runs=[ChainRun(name="openbiollm", status=ChainStatus.OK, response=response, confidence=0.9)],
            metadata={"original_length": len(file_content), "simplified_length": len(response)},
        )

    async def _run_chain(self, name: str, func: Callable[[str], Awaitable[str]], prompt: str) -> ChainRun:
        try:
            result = await func(prompt)
            response = self._extract_response(result)
            confidence = self._extract_confidence(result, default=0.75)
            if not response:
                return ChainRun(name=name, status=ChainStatus.SKIPPED, confidence=0.0)
            return ChainRun(name=name, status=ChainStatus.OK, response=response, confidence=confidence)
        except Exception as exc:
            logger.warning("%s chain failed: %s", name, exc)
            return ChainRun(name=name, status=ChainStatus.ERROR, error=str(exc), confidence=0.0)

    async def _run_mistral(self, prompt: str) -> str:
        chain = self.mistral_chain
        if hasattr(chain, "invoke"):
            return self._extract_response(await self._call(chain.invoke, prompt))
        if hasattr(chain, "generate"):
            return self._extract_response(await self._call(chain.generate, prompt))
        return self._extract_response(await self._call(chain, prompt))

    async def _run_openbiollm(self, prompt: str) -> str:
        chain = self.openbiollm_chain
        if hasattr(chain, "generate"):
            return self._extract_response(await self._call(chain.generate, prompt))
        if hasattr(chain, "invoke"):
            return self._extract_response(await self._call(chain.invoke, prompt))
        return self._extract_response(await self._call(chain, prompt))

    async def _run_ayurparam(self, prompt: str) -> Any:
        chain = self.ayurparam_chain
        if hasattr(chain, "invoke"):
            return await self._call(chain.invoke, prompt)
        return await self._call(chain, prompt)

    @property
    def mistral_chain(self):
        if self._mistral_chain is None:
            from backend.app.core.models.mistral import MistralModel

            self._mistral_chain = MistralModel()
        return self._mistral_chain

    @property
    def openbiollm_chain(self):
        if self._openbiollm_chain is None:
            from backend.app.core.models.openbiollm import get_openbiollm

            self._openbiollm_chain = get_openbiollm()
        return self._openbiollm_chain

    @property
    def ayurparam_chain(self):
        if self._ayurparam_chain is None:
            from backend.app.core.models.ayurparam import AyurParamModel

            self._ayurparam_chain = AyurParamModel()
        return self._ayurparam_chain

    @property
    def retriever(self):
        if self._retriever is None:
            from backend.app.core.rag.retriever import HybridRetriever

            self._retriever = HybridRetriever()
        return self._retriever

    async def _default_semantic_analyzer(self, query: str):
        from backend.app.core.safety.semantic_gate import call_ollama

        return await call_ollama(query)

    async def _default_qil_analyzer(self, query: str):
        try:
            from backend.app.core.pipeline.qil import call_ollama

            return await call_ollama(query)
        except Exception as exc:
            logger.warning("QIL unavailable, using heuristic fallback: %s", exc)
            lowered = query.lower()
            ayurvedic = any(term in lowered for term in ("ayurveda", "dosha", "vata", "pitta", "kapha", "herb"))
            return FallbackQILResult(
                intent="ayurveda" if ayurvedic else "physical_health",
                urgency="medium" if any(term in lowered for term in ("severe", "chest pain", "can't breathe")) else "low",
                biomedical_score=0.6 if not ayurvedic else 0.4,
                ayurvedic_score=0.8 if ayurvedic else 0.3,
                reformatted_queries={
                    "for_chain1": query,
                    "for_chain2": query,
                    "for_chain3": query,
                },
            )

    async def _default_rule_trigger(
        self,
        user_id: Optional[str],
        guardian_email: Optional[str],
        dnode_result: DNodeResult,
        query: str,
    ) -> None:
        if not user_id or not guardian_email:
            return
        try:
            from backend.app.core.safety.rule_based import trigger_rule

            timestamp = datetime.utcnow().isoformat()
            snippet = (query[:47] + "...") if len(query) > 50 else query
            asyncio.create_task(trigger_rule(user_id, guardian_email, dnode_result.level, timestamp, snippet))
        except Exception as exc:
            logger.warning("Rule trigger unavailable: %s", exc)

    async def _trigger_crisis_rule(
        self,
        user_id: Optional[str],
        guardian_email: Optional[str],
        dnode_result: DNodeResult,
        query: str,
    ) -> None:
        await self._call(self.rule_trigger, user_id, guardian_email, dnode_result, query)

    def _evaluate_semantic_analysis(self, analysis: Any) -> DNodeResult:
        is_crisis = (
            getattr(analysis, "distress_level", 0) >= 7
            or bool(getattr(analysis, "is_implicit_crisis", False))
            or bool(getattr(analysis, "is_explicit_crisis", False))
        )
        if not is_crisis:
            return DNodeResult(False, 0, getattr(analysis, "reasoning", "No crisis indicators."), "")

        response = (
            "I am really concerned about your safety. Please contact emergency services now "
            "if you might hurt yourself, or reach out to iCall at 9152988222 or the "
            "Vandrevala Foundation at 8421837141. If you can, stay near someone you trust."
        )
        return DNodeResult(True, int(getattr(analysis, "distress_level", 9)), getattr(analysis, "reasoning", "Crisis indicators detected."), response)

    def _fuse_physical_response(self, chain_runs: List[ChainRun], rag_results: List[Any]) -> str:
        sections = []
        by_name = {run.name: run for run in chain_runs if run.status == ChainStatus.OK and run.response}

        if "openbiollm" in by_name:
            sections.append(f"## Modern Medical Perspective\n\n{by_name['openbiollm'].response}")
        if "ayurparam" in by_name:
            sections.append(f"## Ayurvedic Perspective\n\n{by_name['ayurparam'].response}")
        if "mistral" in by_name:
            sections.append(f"## General Guidance\n\n{by_name['mistral'].response}")

        context_lines = []
        for result in rag_results[:3]:
            text = getattr(result, "text", "")
            if text:
                context_lines.append(f"- {text[:260]}")
        if context_lines:
            sections.append("## Retrieved Context\n\n" + "\n".join(context_lines))

        if rag_results:
            citation_lines = []
            for result in rag_results[:3]:
                text = getattr(result, "text", "") or ""
                metadata = getattr(result, "metadata", {}) or {}
                source = metadata.get("source") or metadata.get("title") or metadata.get("name") or metadata.get("document_id") or "qdrant"
                citation_lines.append(f"- [{source}] {text[:220].strip()}...")
            sections.append("## Citations\n\n" + "\n".join(citation_lines))

        if not sections:
            sections.append("I could not generate a reliable answer right now. Please try again or consult a qualified clinician.")

        sections.append(
            "## Safety Note\n\n"
            "ReassureAI can make mistakes. Cross-verify important health information with a qualified healthcare professional."
        )
        return "\n\n".join(sections)

    def _extract_response(self, result: Any) -> str:
        if result is None:
            return ""
        if isinstance(result, str):
            return result
        if hasattr(result, "response"):
            return str(getattr(result, "response") or "")
        if isinstance(result, dict):
            return str(result.get("response") or result.get("text") or "")
        return str(result)

    def _extract_confidence(self, result: Any, default: float) -> float:
        value = None
        if hasattr(result, "confidence"):
            value = getattr(result, "confidence")
        elif isinstance(result, dict):
            value = result.get("confidence")
        try:
            return max(0.0, min(1.0, float(value if value is not None else default)))
        except (TypeError, ValueError):
            return default

    def _average_confidence(self, runs: List[ChainRun]) -> float:
        if not runs:
            return 0.0
        return sum(run.confidence for run in runs) / len(runs)

    async def _call(self, func: MaybeAsync, *args: Any, **kwargs: Any) -> Any:
        result = func(*args, **kwargs)
        if inspect.isawaitable(result):
            return await result
        return result


async def process_health_query(
    query: str,
    user_id: Optional[str] = None,
    guardian_email: Optional[str] = None,
    file_content: Optional[str] = None,
    selected_model: Optional[str] = None,
) -> DisigenResult:
    node = DisigenNode()
    return await node.process_query(
        query,
        user_id=user_id,
        guardian_email=guardian_email,
        file_content=file_content,
        selected_model=selected_model,
    )


__all__ = [
    "ChainRun",
    "ChainStatus",
    "DisigenNode",
    "DisigenResult",
    "ProcessingType",
    "process_health_query",
]
