import asyncio
from dataclasses import dataclass

import pytest

from backend.app.core.pipeline.disigen import DisigenNode, ProcessingType
from backend.app.core.pipeline.router import RouteResult, Strategy


@dataclass
class FakeSemanticAnalysis:
    emotional_state: str = "neutral"
    distress_level: int = 0
    is_implicit_crisis: bool = False
    is_explicit_crisis: bool = False
    reasoning: str = "test"


@dataclass
class FakeQIL:
    intent: str = "physical_health"
    urgency: str = "low"
    biomedical_score: float = 0.7
    ayurvedic_score: float = 0.6
    reformatted_queries: dict = None

    def __post_init__(self):
        if self.reformatted_queries is None:
            self.reformatted_queries = {
                "for_chain1": "modern query",
                "for_chain2": "ayur query",
                "for_chain3": "general query",
            }


class FakeTextChain:
    def __init__(self, response):
        self.response = response
        self.calls = []

    async def generate(self, prompt):
        self.calls.append(prompt)
        await asyncio.sleep(0)
        return self.response


class FakeMistralChain:
    def __init__(self, response):
        self.response = response
        self.calls = []

    async def invoke(self, prompt):
        self.calls.append(prompt)
        await asyncio.sleep(0)
        return self.response


class FakeAyurParamChain:
    async def invoke(self, prompt):
        await asyncio.sleep(0)
        return {"response": "ayur response", "confidence": 0.8}


class FakeRetriever:
    async def retrieve(self, query, top_k=3):
        return [type("Hit", (), {"text": "retrieved context about vata and sleep"})()]


@pytest.mark.asyncio
async def test_mental_health_crisis_triggers_rule_based_path():
    triggered = []

    async def semantic(_query):
        return FakeSemanticAnalysis(
            emotional_state="hopeless",
            distress_level=9,
            is_implicit_crisis=True,
            reasoning="implicit crisis",
        )

    async def rule_trigger(user_id, guardian_email, dnode_result, query):
        triggered.append((user_id, guardian_email, dnode_result.level, query))

    node = DisigenNode(
        mistral_chain=FakeMistralChain("safe response"),
        semantic_analyzer=semantic,
        rule_trigger=rule_trigger,
    )

    result = await node.process_query(
        "nobody would notice if I was gone",
        user_id="user-1",
        guardian_email="guardian@example.com",
    )

    assert result.processing_type == ProcessingType.MENTAL_HEALTH
    assert result.is_crisis is True
    assert "rule_based" in result.sources
    assert triggered == [("user-1", "guardian@example.com", 9, "nobody would notice if I was gone")]


@pytest.mark.asyncio
async def test_mental_health_safe_uses_mistral():
    async def semantic(_query):
        return FakeSemanticAnalysis(emotional_state="anxious", distress_level=3)

    node = DisigenNode(
        mistral_chain=FakeMistralChain("grounding response"),
        semantic_analyzer=semantic,
    )

    result = await node.process_query("I feel anxious about exams")

    assert result.is_crisis is False
    assert result.response == "grounding response"
    assert result.sources == ["semantic_gate", "mistral"]


@pytest.mark.asyncio
async def test_physical_health_runs_three_chains_and_rag():
    def router(_query):
        return RouteResult(
            strategy=Strategy.DUAL_PARALLEL,
            active_chains=["modern", "ayurvedic"],
        )

    node = DisigenNode(
        mistral_chain=FakeMistralChain("general response"),
        openbiollm_chain=FakeTextChain("modern response"),
        ayurparam_chain=FakeAyurParamChain(),
        retriever=FakeRetriever(),
        qil_analyzer=lambda _query: FakeQIL(),
        router=router,
    )

    result = await node.process_query("I have sleep issues with vata dosha")

    assert result.processing_type == ProcessingType.PHYSICAL_HEALTH
    assert set(result.sources) == {"mistral", "openbiollm", "ayurparam", "rag"}
    assert "Modern Medical Perspective" in result.response
    assert "Ayurvedic Perspective" in result.response
    assert "Retrieved Context" in result.response


@pytest.mark.asyncio
async def test_report_processing_uses_openbiollm():
    node = DisigenNode(openbiollm_chain=FakeTextChain("simplified report"))

    result = await node.process_query(
        "simplify this report",
        file_content="HbA1c: 8.1 high",
    )

    assert result.processing_type == ProcessingType.REPORT_PROCESSING
    assert result.response == "simplified report"
    assert result.sources == ["openbiollm"]
