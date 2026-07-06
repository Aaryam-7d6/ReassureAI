import pytest
from backend.app.core.models.openbiollm import OpenBioLLM, get_openbiollm
from backend.config import cfg

@pytest.mark.asyncio
async def test_openbiollm_initialization():
    model = OpenBioLLM()
    assert isinstance(model, OpenBioLLM)
    assert model.base_model == cfg.OPENBIO_MODEL_NAME
    await model.close()

@pytest.mark.asyncio
async def test_openbiollm_singleton():
    instance1 = get_openbiollm()
    instance2 = get_openbiollm()
    assert instance1 is instance2
    await instance1.close()
