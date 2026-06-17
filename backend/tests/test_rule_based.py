import pytest
from backend.app.core.safety.rule_based import trigger_rule

@pytest.mark.asyncio
async def test_rule_based_trigger_success(mocker):
    # Mock the async task creation to avoid side effects
    mock_create = mocker.patch('asyncio.create_task')
    await trigger_rule(user_id='test_user', guardian_email='guardian@example.com', crisis_level=5, timestamp='2023-01-01T00:00:00Z', query_snippet='test query')
    mock_create.assert_called_once()
