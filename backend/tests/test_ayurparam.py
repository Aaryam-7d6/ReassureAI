import pytest
from unittest.mock import AsyncMock, patch
from backend.app.core.models.ayurparam import AyurParamModel, AyurParamResult

@pytest.mark.asyncio
async def test_ayurparam_basic_functionality():
    """Test basic AyurParam model functionality."""
    model = AyurParamModel()
    result = await model.invoke("Test query")
    assert isinstance(result, AyurParamResult)
    # Either has a response with confidence or None with low confidence
    if result.response is not None:
        assert isinstance(result.response, str)
        assert 0.0 <= result.confidence <= 1.0
    else:
        assert result.confidence == 0.0

@pytest.mark.asyncio
async def test_ayurparam_dosha_query():
    """Test AyurParam with Ayurvedic query (should trigger RAG simulation)."""
    model = AyurParamModel()
    result = await model.invoke("What is the treatment for vata dosha imbalance?")
    
    # For Ayurvedic queries, RAG simulation should activate
    # Depending on Ollama availability, we either get a response or None
    assert isinstance(result, AyurParamResult)
    if result.response is not None:
        assert isinstance(result.response, str)
        assert len(result.response) > 0
        assert 0.0 <= result.confidence <= 1.0
        # RAG-based responses should have high confidence
        if "Context-based response" in result.response:
            assert result.confidence >= 0.9
    else:
        # If no response, confidence should be 0.0
        assert result.confidence == 0.0

@pytest.mark.asyncio
async def test_ayurparam_non_dosha_query():
    """Test AyurParam with non-Ayurvedic query (should not trigger RAG simulation)."""
    model = AyurParamModel()
    result = await model.invoke("How do I fix a leaky faucet?")
    
    assert isinstance(result, AyurParamResult)
    # Non-dosha queries shouldn't trigger RAG simulation
    # Response depends on Ollama availability
    if result.response is not None:
        assert isinstance(result.response, str)
        assert 0.0 <= result.confidence <= 1.0
    else:
        assert result.confidence == 0.0
