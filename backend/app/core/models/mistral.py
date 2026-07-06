"""Chain 3 Mistral model wrapper.

LangChain is used opportunistically when installed. The project should still run
without LangChain because the current environment does not include it.
"""

from __future__ import annotations

import inspect
from typing import Optional

import httpx

from backend.config import cfg


class MistralModel:
    """Async Ollama/Mistral wrapper used as the general safety chain."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        model: str = "mistral:7b",
        timeout: float = 60.0,
        temperature: float = 0.3,
    ):
        self.base_url = (
            base_url or cfg.OLLAMA_BASE_URL or cfg.OLLAMA_URL
        ).rstrip("/")
        self.model = model
        self.timeout = timeout
        self.temperature = temperature
        self._langchain_runnable = self._build_langchain_runnable()

    def _build_langchain_runnable(self):
        try:
            from langchain_core.runnables import RunnableLambda
        except ImportError:
            return None
        return RunnableLambda(self.generate)

    async def generate(self, prompt: str) -> str:
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": self.temperature},
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(f"{self.base_url}/api/generate", json=payload)
            response.raise_for_status()
            data = response.json()
        return str(data.get("response", "")).strip()

    async def invoke(self, prompt: str) -> str:
        if self._langchain_runnable is not None:
            result = self._langchain_runnable.ainvoke(prompt)
            if inspect.isawaitable(result):
                return await result
            return str(result)
        return await self.generate(prompt)
