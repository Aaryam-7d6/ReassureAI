from __future__ import annotations

from typing import Any

import httpx

from backend.config import cfg
from backend.app.utils.logger import get_logger

logger = get_logger(__name__)


async def post_webhook(url: str, payload: dict[str, Any], event_name: str) -> bool:
    if not url:
        logger.info("Skipping %s n8n webhook because no URL is configured", event_name)
        return False

    try:
        async with httpx.AsyncClient(timeout=cfg.N8N_WEBHOOK_TIMEOUT_SECONDS) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
        logger.info("Sent %s payload to n8n", event_name)
        return True
    except Exception as exc:
        logger.error("Failed to send %s payload to n8n: %s", event_name, exc)
        return False


async def send_welcome_email_event(user: dict[str, Any]) -> bool:
    return await post_webhook(
        cfg.N8N_WELCOME_WEBHOOK_URL,
        {
            "event": "user_registered",
            "user_id": str(user.get("_id")),
            "email": user.get("email"),
            "full_name": user.get("full_name"),
            "guardian_email": user.get("guardian_email"),
            "created_at": _stringify_datetime(user.get("created_at")),
        },
        "welcome_email",
    )


async def send_crisis_email_event(payload: dict[str, Any]) -> bool:
    return await post_webhook(cfg.N8N_CRISIS_WEBHOOK_URL, payload, "crisis_email")


def _stringify_datetime(value: Any) -> Any:
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value
