# ReassureAI — Decisions Log

> **Why things are built the way they are.**
> Read before questioning or changing any decision.
> Disagree? Add a note. Do not silently change things.

---

## DEC-001 — FastAPI over Flask

**Date:** May 2026
**Decision:** FastAPI only. No Flask anywhere.
**Why:** Async-native for asyncio.gather() on 3 concurrent chains. Pydantic built-in.
Auto OpenAPI docs. Better performance.
**Consequences:** All routes async def. Motor for MongoDB. httpx for HTTP.

---

## DEC-002 — FAISS (local) + Qdrant Cloud (primary VDB)

**Date:** May 2026
**Decision:** Qdrant Cloud as primary vector database for RAG.
FAISS kept as local fallback during initial dev before Qdrant is connected.
BM25 for keyword search. RRF to merge both.
**Why:** Qdrant Cloud has a free tier, is managed (no self-hosting), supports
filtering, and is production-ready. FAISS is fine locally but not for scale.
**Alternatives considered:** Pinecone — paid; ChromaDB — semantic only;
pure FAISS — not production-ready.
**Consequences:** Need QDRANT_URL and QDRANT_API_KEY in .env.
Start with FAISS locally, migrate to Qdrant once pipeline works.

---

## DEC-003 — Mistral-7B as Chain 3 (multi-role)

**Date:** May 2026
**Decision:** Mistral-7B (Ollama on Windows) handles:

1. Semantic Understanding Layer (mental health branch)
2. QIL — Query Intelligence Layer (physical health branch)
3. Mental health conversation (safe path after D-Node)
4. Response Fusion synthesis (SEC2)
5. Chain 3 in concurrent physical health pipeline
   **Why:** One model, multiple roles, zero API cost. Runs locally. Strong JSON output.
   **Consequences:** Ollama on Windows must be accessible from WSL2. See wsl_setup.md.

---

## DEC-004 — AyurParam (Chain 2) fallback logic — NOT a hard crash

**Date:** May 2026
**Decision:** AyurParam (3B) has graduated fallback, not a hard requirement on RAG.

Fallback order:

1. RAG found context → AyurParam answers using retrieved context (best case)
2. RAG empty, but model has knowledge → allow AyurParam to answer from weights
   (Mistral assists with query breakdown for better AyurParam output)
3. Both RAG and model uncertain → redirect query to Chain 1 (OpenBioLLM)
4. All chains fail → return honest "insufficient information" response

**Why:** A hard crash (AyurParamNoContextError) is too brittle for a 3B model
with limited but real training data. The model knows SOMETHING — we should use
what it knows. Mistral (Chain 3) can assist AyurParam to better parse the query.
Concurrent execution means we get all three answers and pick the best.

**Why concurrent matters:** If we ran sequentially and RAG failed, we'd have
no answer. Concurrently, if Chain 2 is uncertain, Chain 1 and Chain 3 still
respond — user always gets something useful.

**Consequences:** Remove AyurParamNoContextError hard crash. Replace with
confidence scoring. Chain 2 logs confidence. SEC2 uses confidence to decide
how prominently to feature the Ayurvedic perspective.

---

## DEC-005 — JWT in httpOnly cookie

**Date:** May 2026
**Decision:** JWT in httpOnly cookies. Never localStorage.
**Why:** XSS protection. Healthcare data demands session security.
**Consequences:** CORS allow_credentials=True. Axios withCredentials: true.

---

## DEC-006 — MIT License

**Date:** May 2026
**Decision:** MIT License.
**Why:** Maximum portfolio visibility. Can switch to commercial later.

---

## DEC-007 — Semantic LLM gate as PRIMARY crisis detector

**Date:** May 2026
**Decision:** SEC1 Step 1 uses Mistral-7B LLM to understand TRUE implied meaning.
Keywords in crisis_lexicon.json are FALLBACK only (Mistral unavailable).

**Why:** Keywords miss implicit crisis ("I just want everything to stop") and
false-positive on non-crisis ("I want to kill this exam").
LLM semantic understanding is the only reliable approach.

**Fallback chain:**

1. semantic_gate.py (Mistral LLM) → primary
2. crisis_lexicon.json keywords → fallback if Mistral down
3. Return crisis resources anyway if both fail → safety never skips

**Consequences:** +1-2s latency on mental health queries. Acceptable.

---

## DEC-008 — Password AND Email validation with friendly messages

**Date:** May 2026
**Decision:** Enforce all 5 password rules + valid email format explicitly.
Friendly, specific error messages per failing rule.

**Password rules:** min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.
**Email rules:** must match valid email pattern (user@domain.tld).

**Why:** Non-technical healthcare users need specific, kind guidance.
Generic "invalid" errors reduce trust and increase friction.
Security and UX are not in conflict — we enforce both gracefully.

---

## DEC-009 — Three concurrent chains, not two

**Date:** May 2026
**Decision:** ReassureAI uses THREE chains running concurrently:

- Chain 1: OpenBioLLM-70B (biomedical)
- Chain 2: AyurParam 3B (ayurvedic)
- Chain 3: Mistral-7B (general + QIL + fusion + mental health)

This is a TRI-MODEL PIPELINE. Do not call it "dual-model".
Mental health branch uses Chain 3 only.
Physical health branch uses all 3 chains concurrently.

**Why:** More parallel = faster results. Each model specializes.
Fusion (SEC2) picks the best from all three.

---

## DEC-010 — Qdrant Cloud for vector DB, local disk for file storage

**Date:** May 2026
**Updated:** 2026-07-05
**Decision:** Qdrant Cloud (free tier) as vector DB. Uploaded files are stored on local disk under `UPLOAD_DIR`.
**Why local dev:** Local disk storage removes Google API credentials and keeps upload processing simple for the prototype.
Qdrant Cloud requires zero infrastructure management.
**Migration path:** Local disk → S3 or GCS later. Qdrant free → Qdrant paid later.
**Consequences:** Need QDRANT_URL, QDRANT_API_KEY, UPLOAD_DIR, MAX_UPLOAD_SIZE_BYTES in .env.

---

## DEC-011 — SHA-256 file deduplication

**Date:** May 2026
**Decision:** Hash every uploaded file with SHA-256 before processing.
If hash exists in DB for same user → return existing result, skip re-processing.
**Why:** Saves compute, storage, and API costs. Users often re-upload the same report.
**Consequences:** Store file_hash field in documents collection. Index on (user_id, file_hash).

---

## DEC-012 — RLHF feedback collection

**Date:** May 2026
**Decision:** Collect like/dislike per AI response via POST /api/v1/feedback.
Store in MongoDB feedback collection. Do not use for training yet — collect data now.
**Why:** Building a feedback dataset from real users is valuable for future fine-tuning.
Even without a training loop now, the data is worth collecting.
**Consequences:** Minimal overhead. Frontend adds thumbs up/down to every response card.

---

## DEC-013 — API failover HuggingFace → Groq

**Date:** May 2026
**Decision:** When HuggingFace Inference API returns 429 (rate limit) or 503,
automatically retry using Groq free tier API with equivalent model.
**Why:** HF free tier is slow and rate-limited. Groq is much faster and has
a generous free tier. User should never see a rate limit error.
**Model mapping:** OpenBioLLM-70B (HF) → llama-3-70b-versatile (Groq).
**Consequences:** Need GROQ_API_KEY in .env. Wrap all HF calls in failover decorator.

---

## DEC-014 — MongoDB on Windows, Ollama on Windows, accessed from WSL2

**Date:** May 2026
**Decision:** MongoDB and Ollama both installed on Windows.
FastAPI backend runs in WSL2 and connects to them via Windows host IP.
**Why:** Already installed on Windows. Simpler for local dev than running in WSL2.
**How:** See codebase/wsl_setup.md for exact steps.
**Consequences:** MONGODB_URI and OLLAMA_BASE_URL in .env use Windows host IP,
not localhost. Dynamic IP changes on WSL restart — use mirrored networking or
get IP dynamically via `cat /etc/resolv.conf`.

---

## DEC-015 — Local dev first, production hardening later

**Date:** May 2026
**Decision:** Priority is a working local prototype first.
Production concerns (Docker, cloud deploy, rate limiting, secret management)
come only after the full pipeline works end-to-end on localhost.
**Why:** Final year project with time constraints. Working demo > perfect architecture.
**Consequences:** Some production shortcuts are intentional and temporary.
Mark them with `# TODO: production — [description]` comment.
