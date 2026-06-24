#!/usr/bin/env python3

import os
import json
import httpx
from pydantic import BaseModel, Field, root_validator
from typing import Literal, Dict

class QILResult(BaseModel):
    intent: Literal["mental_health", "physical_health", "ayurveda", "report_processing"]
    urgency: Literal["low", "medium", "high"]
    biomedical_score: float = Field(..., ge=0.0, le=1.0)
    ayurvedic_score: float = Field(..., ge=0.0, le=1.0)
    reformatted_queries: Dict[str, str] = Field(default_factory=dict)

    @root_validator
    def validate_scores(cls, values):
        if not (0.0 <= values["biomedical_score"] <= 1.0):
            raise ValueError("Biomedical score must be between 0.0 and 1.0")
        if not (0.0 <= values["ayurvedic_score"] <= 1.0):
            raise ValueError("Ayurvedic score must be between 0.0 and 1.0")
        return values

QIL_PROMPT = """You are an AI assistant that analyses health related user queries.
Extract the following information and return ONLY a JSON with these fields:
intent: mental_health|physical_health|ayurveda|report_processing
urgency: low|medium|high (based on severity)
biomedical_score: 0.0-1.0 (relevance to modern medicine)
ayurvedic_score: 0.0-1.0 (relevance to Ayurveda)
reformatted_queries: {"for_chain1": "...", "for_chain2": "...", "for_chain3": "..."}
Provide concise reformulations for each chain.
Message: "{query}""""

async def call_ollama(query: str, timeout: int = 15) -> QILResult:
    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
    payload = {
        "model": "mistral",
        "prompt": QIL_PROMPT.format(query=query),
        "options": {"temperature": 0.0},
        "stream": False,
    }
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(f"{base_url}/api/generate", json=payload)
        resp.raise_for_status()
        data = resp.json()
        raw = data.get("response", "")
        parsed = json.loads(raw)
        return QILResult(**parsed)

def analyze_query(query: str) -> QILResult:
    import asyncio
    return asyncio.run(call_ollama(query))


from pydantic import BaseModel, Field, root_validator
from typing import Literal, Dict

class QILResult(BaseModel):
    intent: Literal["mental_health", "physical_health", "ayurveda", "report_processing"]
    urgency: Literal["low", "medium", "high"]
    biomedical_score: float = Field(geq=0.0, leq=1.0)
    ayurvedic_score: float = Field(geq=0.0, leq=1.0)
    reformatted_queries: Dict[str, str] = Field(default_factory=dict)

    @root_validator
    def validate_scores(cls, values):
        if values['biomedical_score'] < 0.0 or values['biomedical_score'] > 1.0:
            raise ValueError("Biomedical score must be between 0.0 and 1.0")
        if values['ayurvedic_score'] < 0.0 or values['ayurvedic_score'] > 1.0:
            raise ValueError("Ayurvedic score must be between 0.0 and 1.0")
        return values

async def analyze_query(query: str, timeout: int = 15) -> QILResult:
    # Implementation will go here
    pass

Analyzes user queries using Mistral-7B to extract:
- Intent (mental health, physical health, Ayurveda, etc.)
- Urgency level
- Biomedical relevance score
- Ayurvedic relevance score
- Query reformulations for different processing chains

Pydantic Model:
- QILResult
- Fields: intent, urgency, biomedical_score, ayurvedic_score, reformatted_queries

Example Prompt:
```
Analyze the following user query for mental health relevance:
"
{query}"

Return JSON with:
- intent: mental_health|physical_health|ayurveda|report_processing
- urgency: low|medium|high
- biomedical_score: 0.0-1.0
- ayurvedic_score: 0.0-1.0
- reformatted_queries: {{"for_chain1": "...", "for_chain2": "...", "for_chain3": "..."}}
```