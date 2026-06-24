import pytest
from backend.app.core.models.ayurparam import AyurParamModel

@pytest.mark.asyncio
async def test_ayurparam_placeholder():
    model = AyurParamModel()
    result = await model.invoke("Test query")
    assert result.response is None
    assert result.confidence == 0.0
