# ReassureAI — Models & RAG Pipeline

> **Critical reading before touching core/models/ or core/rag/**

---

## Three Chains Overview

| Chain    | Model                    | Primary Role                              | Via                   | Fallback           |
| -------- | ------------------------ | ----------------------------------------- | --------------------- | ------------------ |
| Chain 1  | OpenBioLLM-70B           | Biomedical reasoning                      | HuggingFace API       | Groq (llama-3-70b) |
| Chain 2  | AyurParam (Aayupahar 3B) | Ayurvedic reasoning                       | Ollama (Windows)      | Chain 1 redirect   |
| Chain 3  | Mistral-7B               | Semantic gate, QIL, mental health, fusion | Ollama (Windows)      | Groq (mistral-7b)  |
| Embedder | all-MiniLM-L6-v2         | RAG document embedding                    | sentence-transformers | —                  |

All 3 chains run **concurrently** via asyncio.gather() for physical health.
Mental health uses Chain 3 only.

---

## OpenRouter / Qwen3 for Coding Agent

> This section is for the **coding agent** (OpenHands, Cline, etc.) — NOT for ReassureAI's pipeline.

**Which Qwen3 model on OpenRouter to use:**

`qwen/qwen3-coder` — this is the correct model ID. You already selected it.
It's the Qwen3 235B model specialized for code generation.

For your use case (OpenHands or Cline doing code tasks):

- `qwen/qwen3-coder` — best for complex code generation (235B MoE)
- Free tier available on OpenRouter with rate limits

**If you hit rate limits on qwen/qwen3-coder:**

- `qwen/qwen3-30b-a3b` — smaller, faster, still very capable, better free limits
- `qwen/qwen3-8b` — lightweight, fast responses, good for simple tasks

**Recommendation:** Keep `qwen/qwen3-coder` as primary. If it's slow or rate-limited
during a session, switch to `qwen/qwen3-30b-a3b` for that session.

These models are for the **development agent** (the tool helping you write code),
NOT for ReassureAI's runtime chains.

---

## Chain 3 — Mistral-7B (Multi-Role)

Mistral handles four distinct roles in ReassureAI:

### Role 1: Semantic Understanding Gate

```python
SEMANTIC_GATE_PROMPT = """You are a mental health safety analyzer.
Analyze the following message for emotional distress and crisis signals.
Understand IMPLIED meaning — not just literal trigger words.

Implicit crisis (NO trigger word present):
- "I just want everything to stop" → potential crisis
- "nobody would notice if I was gone" → potential crisis
- "there is no way out" → potential crisis

NOT a crisis:
- "I want to kill this exam" → frustration, safe
- "feeling anxious about exams" → normal stress, safe
- "I have a headache" → physical, safe

Message: "{query}"

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
```

### Role 2: QIL — Query Intelligence Layer

```python
QIL_PROMPT = """Analyze this health query. Return ONLY valid JSON.

Query: "{query}"

{{
  "intent": "mental_wellness|symptom_inquiry|diet_lifestyle|medication|prevention|general",
  "urgency": "HIGH|MEDIUM|LOW",
  "branch": "mental_health|physical_health",
  "biomedical_score": 0.0,
  "ayurvedic_score": 0.0,
  "reformulated": {{
    "for_chain1": "clinical terminology for OpenBioLLM",
    "for_chain2": "dosha and Sanskrit terminology for AyurParam",
    "for_chain3": "general reasoning framing for Mistral"
  }},
  "entities": {{
    "symptoms": [],
    "body_system": "",
    "duration": ""
  }}
}}"""
```

### Role 3: Mental Health Conversation

Empathetic, supportive conversation. Non-clinical tone.
Instructs to use markdown in response.

### Role 4: Response Fusion (SEC2)

```python
FUSION_PROMPT = """You are a balanced health information synthesizer.
Structure the following expert perspectives clearly using markdown.
Use ## for section headers, **bold** for key terms, bullet points for lists.

Chain 1 (Modern Medical): {chain1}
Chain 2 (Ayurvedic): {chain2}
Chain 3 (General): {chain3}
Chain 2 confidence: {chain2_confidence}

Return JSON:
{{
  "modern_perspective": "## Modern Medical View\\n...",
  "ayurvedic_perspective": "## Ayurvedic View\\n...",
  "common_ground": "## Where Both Agree\\n...",
  "key_differences": "## Key Differences\\n...",
  "disclaimer": "---\\n*ReassureAI provides educational information only. Please consult a licensed healthcare professional.*"
}}"""
```

**Calling Mistral via Ollama:**

```python
async def call_mistral_json(prompt: str) -> dict:
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(
            f"{settings.ollama_base_url}/api/generate",
            json={"model": "mistral", "prompt": prompt, "stream": False, "format": "json"}
        )
        r.raise_for_status()
        return json.loads(r.json()['response'])
```

---

## Chain 1 — OpenBioLLM-70B

**With HuggingFace → Groq failover:**

```python
class Chain1OpenBioLLM(BaseModel):
    name = "chain1_openbiollm"

    HF_URL = "https://api-inference.huggingface.co/models/aaditya/Llama3-OpenBioLLM-70B"
    GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
    GROQ_MODEL = "llama-3-70b-versatile"

    PROMPT = """You are a biomedical clinical AI assistant.
Answer using ONLY the provided context. Do not diagnose.
Provide educational information. Use markdown formatting.

Context:
{context}

Clinical Question: {query}

## Modern Medical Perspective
"""

    async def call_with_failover(self, prompt: str, context: str) -> str:
        try:
            return await self._call_hf(prompt, context)
        except (RateLimitError, ModelUnavailableError) as e:
            logger.warning(f"[CHAIN1] HF failed ({e}) → Groq fallback")
            return await self._call_groq(prompt, context)

    async def _call_hf(self, prompt: str, context: str) -> str:
        full = self.PROMPT.format(context=context, query=prompt)
        for attempt in range(3):
            async with httpx.AsyncClient(timeout=45) as client:
                r = await client.post(
                    self.HF_URL,
                    headers={"Authorization": f"Bearer {settings.huggingface_api_key}"},
                    json={"inputs": full, "parameters": {"max_new_tokens": 512}}
                )
                if r.status_code == 200:
                    return r.json()[0]['generated_text']
                if r.status_code == 503:
                    await asyncio.sleep(2 ** attempt)
                elif r.status_code == 429:
                    raise RateLimitError("HuggingFace rate limit")
        raise ModelUnavailableError("HF unavailable after retries")

    async def _call_groq(self, prompt: str, context: str) -> str:
        full = self.PROMPT.format(context=context, query=prompt)
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                self.GROQ_URL,
                headers={"Authorization": f"Bearer {settings.groq_api_key}"},
                json={
                    "model": self.GROQ_MODEL,
                    "messages": [{"role": "user", "content": full}],
                    "max_tokens": 512
                }
            )
            r.raise_for_status()
            return r.json()['choices'][0]['message']['content']
```

---

## Chain 2 — AyurParam (Graduated Fallback)

**No hard crash. Graduated fallback per DEC-004:**

```python
class Chain2AyurParam(BaseModel):
    name = "chain2_ayurparam"

    PROMPT_WITH_CONTEXT = """You are an Ayurvedic wellness advisor (Vaidya).
Answer using the context below AND your training knowledge.
Format response with markdown. Do not recommend specific dosages without advising to consult a Vaidya.

Context from Ayurvedic knowledge base:
{context}

Question: {query}

## Ayurvedic Perspective
"""

    PROMPT_WITHOUT_CONTEXT = """You are an Ayurvedic wellness advisor (Vaidya).
Answer from your Ayurvedic training knowledge.
If you are uncertain, clearly state "I have limited information on this."
Format response with markdown.

Question: {query}

## Ayurvedic Perspective
"""

    async def call_with_fallback(self, query: str, context: str) -> dict:
        if context and context.strip():
            prompt = self.PROMPT_WITH_CONTEXT.format(context=context, query=query)
            confidence = 0.85
        else:
            logger.warning("[CHAIN2] No RAG context — using model weights")
            prompt = self.PROMPT_WITHOUT_CONTEXT.format(query=query)
            confidence = 0.40  # lower confidence without grounding

        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(
                f"{settings.ollama_base_url}/api/generate",
                json={"model": "aayupahar", "prompt": prompt, "stream": False}
            )
            r.raise_for_status()
            response_text = r.json()['response']

            # If model says it doesn't know → return None (redirect to Chain 1)
            uncertainty_phrases = [
                "i have limited information",
                "i don't have information",
                "i cannot provide",
                "insufficient information"
            ]
            if any(p in response_text.lower() for p in uncertainty_phrases):
                logger.info("[CHAIN2] Model uncertain → will redirect to Chain 1")
                return {"text": None, "confidence": 0.0, "redirected": True}

            return {"text": response_text, "confidence": confidence, "redirected": False}
```

---

## RAG Pipeline

### Architecture

```
Startup (once):
  knowledge_base/ text files
      ↓ chunk (500 tokens, 50 overlap)
      ↓ embed (all-MiniLM-L6-v2)
      ↓ store → Qdrant Cloud (or FAISS locally)
      ↓ store → BM25 corpus (in memory)

Per Query:
  query
      ↓ embed query
      ↓ Qdrant/FAISS dense search → top 10
      ↓ BM25 keyword search → top 10
      ↓ Reciprocal Rank Fusion → top 5
      ↓ return context string to all 3 chains
```

### Qdrant vs FAISS selection

```python
def get_retriever():
    if settings.qdrant_url and settings.qdrant_api_key:
        logger.info("Using Qdrant Cloud for vector retrieval")
        return QdrantRetriever(settings.qdrant_url, settings.qdrant_api_key)
    else:
        logger.warning("Qdrant not configured — using local FAISS (dev only)")
        return FAISSRetriever()
```

### RRF

```python
def reciprocal_rank_fusion(dense_ids, sparse_ids, k=60, top_n=5):
    scores = {}
    for rank, idx in enumerate(dense_ids):
        scores[idx] = scores.get(idx, 0) + 1 / (rank + k)
    for rank, idx in enumerate(sparse_ids):
        scores[idx] = scores.get(idx, 0) + 1 / (rank + k)
    return sorted(scores, key=scores.get, reverse=True)[:top_n]
```

---

## What Agent Updates Here

When changing a model prompt, adding a model, or modifying RAG:

1. Update the relevant section
2. Note date of change inline
3. Keep old prompt commented out if significantly changed
