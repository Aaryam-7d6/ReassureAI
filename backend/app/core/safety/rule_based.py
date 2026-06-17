import asyncio
import json
import httpx
from pathlib import Path
from datetime import datetime
from typing import Any, Dict

from .dnode import DNodeResult, dnode_process
from ..utils.logger import get_logger

logger = get_logger(__name__)

# Load crisis lexicon for payload (reuse existing)
LEXICON_PATH = Path(__file__).with_name("crisis_lexicon.json")
if LEXICON_PATH.exists():
    with LEXICON_PATH.open() as f:
        CRISIS_LEXICON = json.load(f)
else:
    CRISIS_LEXICON = {}

async def send_to_n8n(payload: Dict[str, Any]) -> None:
    """Fire‑and‑forget POST to n8n webhook.
    Errors are logged; the function never raises.
    """
    webhook_url = "http://localhost:5678/webhook/crisis"  # placeholder; configure as needed
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.post(webhook_url, json=payload)
            resp.raise_for_status()
            logger.info("Sent crisis payload to n8n: %s", payload)
    except Exception as exc:  # pragma: no cover – best‑effort logging only
        logger.error("Failed to send crisis payload to n8n: %s", exc)

async def trigger_rule(user_id: str, guardian_email: str, crisis_level: int, timestamp: str, query_snippet: str) -> None:
    """Evaluate a user query and, if a crisis is detected, trigger the n8n workflow.
    This runs as a background task; callers should not await the result.
    """
    # Perform D‑Node analysis (semantic + fallback)
    result: DNodeResult = dnode_process(query)
    if not result.is_crisis:
        logger.debug("No crisis detected for user %s", user_id)
        return

    # Build concise payload
    payload = {
        "user_id": user_id,
        "guardian_email": guardian_email,
        "crisis_level": crisis_level,
        "timestamp": timestamp,
        "query_snippet": query_snippet,
    }
    # Fire‑and‑forget the webhook
    asyncio.create_task(send_to_n8n(payload))

# Example of how this could be used within an endpoint (not exported)
async def handle_user_message(user_id: str, guardian_email: str, message: str) -> DNodeResult:
    """Process a message, trigger rule‑based if needed, and return the analysis result.
    The caller can use the returned DNodeResult to decide on a response.
    """
    result = dnode_process(message)
    if result.is_crisis:
        # Schedule the external trigger without blocking the response flow
        asyncio.create_task(rule_based_trigger(user_id, guardian_email, message))
    return result
