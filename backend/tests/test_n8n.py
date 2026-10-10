import asyncio
from datetime import datetime
from unittest.mock import AsyncMock, patch

import pytest

from backend.app.services import n8n
from backend.app.core.safety.rule_based import trigger_rule


@pytest.mark.asyncio
async def test_welcome_webhook_contains_workflow_registration_fields():
    user = {
        "_id": "user-1",
        "email": "abcd1@gmail.com",
        "full_name": "Test User",
        "guardian_email": None,
        "created_at": datetime(2026, 10, 9, 10, 0, 0),
    }

    with patch.object(n8n, "post_webhook", new=AsyncMock(return_value=True)) as post:
        await n8n.send_welcome_email_event(user)

    payload = post.await_args.args[1]
    assert payload["email"] == "abcd1@gmail.com"
    assert payload["full_name"] == "Test User"


@pytest.mark.asyncio
async def test_crisis_webhook_contains_required_payload_fields():
    scheduled = []

    def capture_task(coroutine):
        scheduled.append(coroutine)
        return object()

    with patch("backend.app.core.safety.rule_based.send_to_n8n", new=AsyncMock()) as send:
        with patch("asyncio.create_task", side_effect=capture_task):
            await trigger_rule(
                user_id="user-1",
                guardian_email="abcd1@gmail.com",
                crisis_level=9,
                timestamp="2026-10-09T10:00:00",
                query_snippet="test crisis snippet",
            )
        await scheduled[0]

    payload = send.await_args.args[0]
    assert payload == {
        "user_id": "user-1",
        "guardian_email": "abcd1@gmail.com",
        "crisis_level": 9,
        "timestamp": "2026-10-09T10:00:00",
        "query_snippet": "test crisis snippet",
    }
