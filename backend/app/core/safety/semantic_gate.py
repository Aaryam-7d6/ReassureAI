import json
import os
import httpx
from pydantic import BaseModel, Field, ValidationError
from typing import Literal, List

class SemanticAnalysis(BaseModel):
    emotional_state: Literal["distressed", "neutral", "positive", "anxious", "hopeless", "angry", "frustrated"]
    distress_level: int = Field(..., ge=0, le=10)
    implied_intent: str
    crisis_indicators: List[str] = []
    is_implicit_crisis: bool
    is_explicit_crisis: bool
    reasoning: str

class SemanticGateUnavailableError(RuntimeError):
    """Raised when Ollama service cannot be reached or returns an error."""
    pass

SEMANTIC_GATE_PROMPT = """You are a mental health safety analyzer.
Analyze the following message for emotional distress and crisis signals.
Understand IMPLIED meaning — not just literal trigger words.

Implicit crisis (NO trigger word): \"I just want everything to stop\", \"Nobody would notice if I was gone\", \"There is no way out\"

NOT a crisis: \"I want to kill this exam\", \"This assignment is killing me\", \"Feeling a bit anxious about exams\"

Message: \"{query}\"

Return ONLY valid JSON:
{{
  "emotional_state": "distressed|neutral|positive|anxious|hopeless|angry|frustrated",
  "distress_level": 0,
  "implied_intent": "brief description of true meaning",
  "crisis_indicators": [],
  "is_implicit_crisis": false,
  "is_explicit_crisis": false,
  "reasoning": "one sentence explanation"
}}"""

async def call_ollama(query: str, timeout: int = 15) -> SemanticAnalysis:
    ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
    payload = {
        "model": "mistral",
        "prompt": SEMANTIC_GATE_PROMPT.format(query=query),
        "options": {"temperature": 0.0},
        "stream": False,
    }
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(f"{ollama_base_url}/api/generate", json=payload)
        resp.raise_for_status()
        data = resp.json()
        raw = data.get("response", "")
        parsed = json.loads(raw)
        return SemanticAnalysis(**parsed)
    except (httpx.RequestError, httpx.HTTPStatusError, json.JSONDecodeError, ValidationError) as exc:
        raise SemanticGateUnavailableError(str(exc))

def analyze_message(query: str) -> SemanticAnalysis:
    import asyncio
    return asyncio.run(call_ollama(query))
