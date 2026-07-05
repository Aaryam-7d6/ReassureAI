# ReassureAI — Why This Stack?

> **Why we chose each technology, what we gain, what we give up.**
> Read this to understand the reasoning. Use it to defend choices in viva.

---

## Why FastAPI (not Flask, not Django)?

**We chose FastAPI because:**

- Async-native — runs all 3 chains concurrently via asyncio.gather() without hacks
- Auto-generates OpenAPI docs at /docs — instant API testing without Postman
- Pydantic validation built-in — request/response validation is zero extra work
- Type hints enforced — catches bugs at development time, not runtime
- Faster than Flask in benchmarks (Starlette underneath is ASGI, not WSGI)

**What we give up:**

- Smaller ecosystem than Flask (fewer tutorials, older StackOverflow answers)
- No built-in ORM (we use Motor directly for MongoDB)
- Slight learning curve on async/await patterns for beginners

**Verdict:** For an AI pipeline with parallel model calls, async is not optional.
FastAPI is the only sensible choice at this scale.

---

## Why Python 3.11+ (not Node, not Go)?

**We chose Python because:**

- All AI/ML libraries (LangChain, FAISS, sentence-transformers, HuggingFace) are Python-first
- asyncio is mature and well-documented
- Team already knows Python
- Motor, PyPDF2, pytesseract, bcrypt — all excellent Python libraries

**What we give up:**

- Raw performance vs Go or Rust (irrelevant — bottleneck is LLM inference, not Python)
- JavaScript ecosystem integration requires API layer (which we have anyway)

---

## Why React + Vite (not Next.js, not Vue)?

**We chose React + Vite because:**

- Team already knows React
- Vite is faster than CRA — hot reload in milliseconds
- No SSR needed — this is a SPA with API backend
- Framer Motion, react-markdown, and Tailwind all integrate cleanly
- Next.js adds complexity (SSR, routing conventions) we don't need

**What we give up:**

- SSR/SEO (not needed — this is a logged-in app)
- Next.js file-based routing (React Router v6 handles our needs)

---

## Why MongoDB (not PostgreSQL, not MySQL)?

**We chose MongoDB because:**

- Conversation history is naturally a document (nested messages array)
- Schema-less means we can add metadata fields without migrations
- Motor (async driver) is excellent and well-maintained
- Free to use locally, Atlas has a generous free tier for later
- JSON-native — no ORM needed, direct Python dict ↔ document mapping

**What we give up:**

- ACID transactions (we don't need multi-collection transactions currently)
- Relational joins (our data model doesn't require them)
- SQL familiarity (team needs to learn MongoDB query syntax)

**When we'd reconsider:** If we needed complex relational queries across users,
conversations, and medical records — PostgreSQL would be better.

---

## Why Ollama (not HuggingFace local, not llama.cpp directly)?

**We chose Ollama because:**

- Simplest way to run Mistral-7B and AyurParam locally
- Clean REST API — identical to calling any other service
- Model management built-in (ollama pull, ollama list)
- GPU acceleration automatic on Windows with NVIDIA
- No Python dependency hell — runs as a separate service

**What we give up:**

- Less fine-grained control over inference parameters vs llama.cpp
- Windows-only setup (our constraint — Ollama works on Linux too)

---

## Why Mistral-7B as Chain 3 (multi-role)?

**We chose Mistral-7B because:**

- Strong instruction following — critical for JSON output in QIL
- Good reasoning — suitable for semantic analysis in safety gate
- Runs fast locally — 7B is manageable on consumer GPU
- Open source Apache 2.0 — no usage restrictions
- One model handles 4 roles: reduces infrastructure complexity

**What we give up:**

- Specialized models might be better at each individual role
- 7B can miss nuanced clinical reasoning (OpenBioLLM-70B is much better for that)

**Why not GPT-4 for these roles?** Cost. Every QIL call + semantic gate call + fusion
call adds up fast. Mistral local = zero API cost.

---

## Why OpenBioLLM-70B (not Med-PaLM, not GPT-4)?

**We chose OpenBioLLM-70B because:**

- Open source — free via HuggingFace Inference API (free tier)
- 86.06% average across 9 biomedical benchmarks — better than GPT-4 on several
- Built on Llama-3-70B — well-supported base model
- Domain-specific fine-tuning on 3000+ medical topics

**What we give up:**

- HuggingFace free tier is slow and rate-limited (mitigated by Groq fallback)
- 70B is too large to run locally on consumer hardware

**Groq fallback:** llama-3-70b-versatile on Groq free tier is our safety net.

---

## Why AyurParam (Aayupahar) 3B?

**We chose AyurParam because:**

- Only purpose-built Ayurvedic LLM we found
- Trained on Ayurvedic texts and pharmacopoeia
- 3B is small enough to run on local Ollama

**What we give up:**

- 3B is small — limited parametric knowledge, hallucinates on rare terms
- Quality gap vs larger models is real

**How we mitigate:** RAG provides factual grounding. Mistral assists with query
breakdown. Confidence scoring. Fallback to OpenBioLLM if AyurParam is uncertain.

---

## Why Qdrant Cloud (not Pinecone, not Weaviate, not plain FAISS)?

**We chose Qdrant Cloud because:**

- Free tier: 1GB storage, unlimited requests — enough for our knowledge base
- Managed service — no self-hosting, no infrastructure
- Supports filtering (by document type, domain) — better than plain FAISS
- Python client is clean and well-documented
- Hybrid search support built-in (dense + sparse)
- Production-ready when we scale later

**FAISS role:** Used locally before Qdrant is set up. FAISS → Qdrant is a simple swap.

**What we give up vs Pinecone:** Nothing meaningful at our scale. Pinecone is paid.
**What we give up vs self-hosted Qdrant:** Management overhead we don't need now.

---

## Why FAISS + BM25 Hybrid RAG (not pure semantic)?

**We chose hybrid because:**

- Pure semantic (FAISS only) misses exact matches:
  "Ashwagandha" → needs keyword match, not semantic approximation
  "metformin 500mg" → exact drug name matters
- Pure keyword (BM25 only) misses meaning:
  "chest feels tight" → should find "chest pain" documents
- Hybrid with Reciprocal Rank Fusion gives us both
- Medical and Ayurvedic domains NEED both types of retrieval

**What we give up:** Slightly more code. Worth it entirely.

---

## Why local disk for file storage (not S3 yet)?

**We chose local disk for local dev because:**

- No OAuth credentials or Google API setup
- Works offline during localhost development
- Simple Docker volume mapping
- Easy to inspect uploads manually under `UPLOAD_DIR`

**Migration path:** local disk → AWS S3 or GCP Storage when going to production.
The upload metadata model keeps stored paths isolated from report simplification logic.

**What we give up:** Not production-grade across multiple backend instances.
Acceptable for a student project demo.

---

## Why n8n for workflow automation (not custom code)?

**We chose n8n because:**

- Visual workflow builder — guardian alert email is configured, not coded
- Self-hosted free version
- Built-in email, HTTP webhook, and notification nodes
- Crisis alert workflow can be updated without touching Python code
- Separates infrastructure (alerting) from application logic (pipeline)

**What we give up:** One more service to run locally. Acceptable.

---

## Why SHA-256 for file deduplication?

**We chose SHA-256 because:**

- Deterministic — same file always produces same hash
- Fast — hashing a 10MB file takes milliseconds
- Collision-resistant — two different files will not produce the same hash
- Standard library — hashlib in Python, no dependency

**What we give up:** Nothing. This is a pure win.

---

## Why collect RLHF feedback now if we won't train yet?

**We collect now because:**

- Training data is the hardest thing to get in ML
- Real user feedback (like/dislike) from actual health queries is gold
- Once we have enough data, we can fine-tune AyurParam or Mistral
- Collecting retroactively is impossible
- Adding thumbs up/down to the UI is 30 minutes of work

**What we give up:** Nothing. Zero cost to collect. Future benefit is potentially huge.

---

## Why MIT License?

- Maximum openness for portfolio and hiring visibility
- Attribution preserved (our names stay on derivatives)
- Can switch to commercial license if the project becomes a product
- Simplest license — no viral clauses, no patent traps

**When we'd switch:** If a company wants to use our code commercially and we
want something in return → move to BSL or a custom commercial license.
