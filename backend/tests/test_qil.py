import asyncio
import os
import pytest
from backend.app.core.pipeline.qil import analyze_query, QILResult

os.environ["OLLAMA_BASE_URL"] = "http://localhost:11434"

@pytest.mark.asyncio
async def test_analyze_query_structure():
    query = "I have a headache and feel anxious about my health."
    result = await asyncio.wait_for(asyncio.to_thread(analyze_query, query), timeout=20)
    assert isinstance(result, QILResult)
    assert result.intent in {"mental_health", "physical_health", "ayurveda", "report_processing"}
    assert result.urgency in {"low", "medium", "high"}
    assert 0.0 <= result.biomedical_score <= 1.0
    assert 0.0 <= result.ayurvedic_score <= 1.0
    assert isinstance(result.reformatted_queries, dict)
    assert set(result.reformatted_queries.keys()) >= {"for_chain1", "for_chain2", "for_chain3"}
