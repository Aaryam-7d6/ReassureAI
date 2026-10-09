import asyncio
import json
from pathlib import Path
from datetime import datetime
from typing import Any, Dict

from .dnode import DNodeResult, evaluate_message
from backend.app.services.n8n import send_crisis_email_event
from backend.app.utils.logger import get_logger

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
    await send_crisis_email_event(payload)

async def trigger_rule(user_id: str, guardian_email: str, crisis_level: int, timestamp: str, query_snippet: str) -> None:
    """Trigger n8n workflow for a crisis detection.
    This function should be scheduled with ``asyncio.create_task`` by the caller.
    """
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

async def process_message(user_id: str, guardian_email: str, message: str) -> DNodeResult:
    """Analyze a user message and trigger rule‑based workflow if crisis.

    Returns the ``DNodeResult`` which contains crisis detection info.
    """
    result: DNodeResult = evaluate_message(message)
    if result.is_crisis:
        # Prepare data for payload
        timestamp = datetime.utcnow().isoformat()
        query_snippet = (message[:47] + "...") if len(message) > 50 else message
        # Schedule background n8n trigger without awaiting
        asyncio.create_task(trigger_rule(user_id, guardian_email, result.level, timestamp, query_snippet))
    return result
