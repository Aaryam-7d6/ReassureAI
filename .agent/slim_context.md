# ReassureAI — Slim Context (Agent Quick Reference)

> Compressed summary of project.md + instructions.md for token-constrained sessions.
> Full details in .agent/project.md and .agent/instructions.md

---

## What We Are Building

Hybrid AI healthcare assistant for India. Three pillars:

- Mental wellness support with LLM-based crisis detection
- Medical report simplification (PDF/image → plain language)
- Ayurvedic health guidance alongside modern medicine

NOT a diagnosis tool. Educational only.

---

## Three Chains — Tri-Model Pipeline

| Chain   | Model          | Runs Via                        | Role                                              |
| ------- | -------------- | ------------------------------- | ------------------------------------------------- |
| Chain 1 | OpenBioLLM-70B | HuggingFace API → Groq fallback | Biomedical reasoning                              |
| Chain 2 | AyurParam 3B   | Ollama (Windows)                | Ayurvedic reasoning                               |
| Chain 3 | Mistral-7B     | Ollama (Windows)                | QIL + semantic gate + fusion + mental health chat |

All 3 run concurrently via asyncio.gather() for physical health queries.
Mental health: Chain 3 only.

---

## Two Branches

**Mental Health:** User → Semantic Gate (Mistral LLM) → D-Node decision → safe: Mistral chat / crisis: n8n alert
**Physical Health:** User → QIL (Mistral) → Router → Chain 1+2+3 concurrent + RAG → SEC2 Fusion → Output

---

## Two Security Checkpoints

**SEC1:** semantic_gate.py (Mistral LLM understands implied meaning) → dnode.py (crisis/safe decision). Keywords in crisis_lexicon.json are FALLBACK only if Mistral is down.

**SEC2:** Post-inference. Contradiction check + herb-drug conflict + disclaimer injection. Always runs.

---

## Stack

- **Backend:** FastAPI + Python 3.11 + Motor (async MongoDB) + httpx
- **Frontend:** React 18 + Vite + Tailwind + react-markdown + Web Speech API
- **RAG:** FAISS (local) → Qdrant Cloud (when set up) + BM25 + RRF
- **DB:** MongoDB on Windows, accessed from WSL2 (see wsl_setup.md)
- **Ollama:** On Windows, accessed from WSL2 via 127.0.0.1:11434
- **Files:** SHA-256 dedup + local disk storage + pytesseract OCR
- **Automation:** n8n for guardian alert emails

---

## Absolute Rules (never break)

1. FastAPI only — no Flask
2. All routes async def
3. JWT in httpOnly cookie — never localStorage
4. Secrets in .env — never hardcoded, never committed
5. Semantic gate PRIMARY crisis detector — keywords are fallback only
6. Chain 2 has graduated fallback — no hard crash on empty RAG
7. SEC2 disclaimer always injected — never skipped
8. SHA-256 check before processing any uploaded file
9. LOCAL DEV FIRST — working prototype beats perfect architecture
10. Never push to main — always push to dev branch
11. Use best industry-stander practices while writing code, also use industry-stander practices for security, privacy and peformance.

---

## Code Standards

- Type hints on every function
- Pydantic v2 (model_config = ConfigDict, not class Config)
- black + ruff before every commit
- No version pinning in requirements.txt or package.json (use ^)
- One function one job
- Fail loudly — never silent except

---

## Password Rules (5 required)

min 8 chars + 1 uppercase + 1 lowercase + 1 number + 1 special char
Email format validation too. Both with friendly error messages.

---

## API Response Shape

```json
{ "success": true, "data": {}, "error": null, "timestamp": "..." }
```

---

## File Structure (key paths)

backend/app/core/safety/ → semantic_gate.py, dnode.py, rule_based.py
backend/app/core/pipeline/ → disigen.py, qil.py, router.py, fusion.py
backend/app/core/models/ → chain1_openbiollm.py, chain2_ayurparam.py, chain3_mistral.py
backend/app/core/rag/ → embedder.py, indexer.py, retriever.py
backend/app/core/files/ → extractor.py, dedup.py
backend/app/api/v1/endpoints/ → auth.py, chat.py, reports.py, feedback.py, health.py
frontend/src/components/ → ChatMessage, ResponseActionBar, ChatInput, CrisisCard
frontend/src/hooks/ → useChat, useAuth, useReport, useTTS, useAutoScroll

---

## Git Rule

```bash
git add -A && git commit -m "type(scope): description" && git push origin dev
```

Never push to main. Aarya merges dev → main via PR on GitHub.

---

## Test User

Email: test@reassureai.dev | Password: Test@1234! |Full Name: Test User | Guardian Email: guardian@reassureai.dev

---

## Current Task

Check .agent/work.md for the current unchecked task.
Check .agent/progress.md for what is already done.
Check .agent/errors.md for known pitfalls before implementing.
