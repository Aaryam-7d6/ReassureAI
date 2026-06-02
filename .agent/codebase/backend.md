<!-- Which One Should You Choose?Choose PyJWT if your goal is standard token creation, verification (including decoding keys from external identity providers like Auth0 using PyJWKClient), and signing. It is the gold standard for fastapi and Django APIs.Only use python-jose if your specific use case absolutely requires JWE (JSON Web Encryption) to encrypt the payload's contents rather than just verifying its signature. Because of abandonment and unpatched dependencies, you must use it with extreme caution and ensure your security audits pass. -->

# ReassureAI — Backend Codebase

> **Updated every time backend code changes.**

---

## Status: Not started. Start with TASK-001.

---

## Entry Point

`backend/main.py` — FastAPI app with lifespan startup/shutdown.

Startup checks (in order):

1. Connect MongoDB (Windows → WSL2, see wsl_setup.md)
2. Create DB indexes
3. Check Ollama reachable (Windows → WSL2)
4. Load FAISS index OR connect Qdrant Cloud
5. Log health of all services

---

## Folder Structure

```
backend/
├── main.py                           # FastAPI entry + lifespan
├── config.py                         # pydantic-settings — all env vars
├── requirements.txt
│
├── scripts/
│   └── seed.py                       # Creates test user on first run
│
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── router.py             # Registers all endpoint routers
│   │       └── endpoints/
│   │           ├── auth.py           # /api/v1/auth/*
│   │           ├── chat.py           # /api/v1/chat/*
│   │           ├── reports.py        # /api/v1/reports/*
│   │           ├── feedback.py       # /api/v1/feedback
│   │           └── health.py         # /api/v1/health
│   │
│   ├── core/
│   │   ├── pipeline/
│   │   │   ├── disigen.py            # Main dispatcher — two branches
│   │   │   ├── qil.py                # Query Intelligence Layer (Mistral)
│   │   │   ├── router.py             # Physical health chain router
│   │   │   └── fusion.py             # SEC2 — merge 3 chains + post-safety
│   │   │
│   │   ├── safety/
│   │   │   ├── semantic_gate.py      # LLM semantic analysis (SEC1 Step 1)
│   │   │   ├── dnode.py              # Crisis decision (SEC1 Step 2)
│   │   │   ├── rule_based.py         # n8n trigger — guardian alert
│   │   │   └── crisis_lexicon.json   # Fallback keywords only
│   │   │
│   │   ├── models/
│   │   │   ├── base.py               # Abstract base — timeout, retry, confidence
│   │   │   ├── chain1_openbiollm.py  # OpenBioLLM-70B + Groq failover
│   │   │   ├── chain2_ayurparam.py   # AyurParam 3B + graduated fallback
│   │   │   └── chain3_mistral.py     # Mistral-7B — QIL, semantic, fusion, chat
│   │   │
│   │   ├── rag/
│   │   │   ├── embedder.py           # sentence-transformers wrapper
│   │   │   ├── indexer.py            # Chunk + embed + build indexes
│   │   │   ├── retriever.py          # FAISS + BM25 + RRF hybrid
│   │   │   └── qdrant_client.py      # Qdrant Cloud client (falls back to FAISS)
│   │   │
│   │   └── files/
│   │       ├── extractor.py          # PDF (PyPDF2) + image OCR (pytesseract)
│   │       ├── dedup.py              # SHA-256 hash check
│   │       └── drive_storage.py      # Google Drive upload/download
│   │
│   ├── db/
│   │   ├── connection.py             # Motor AsyncIOMotorClient
│   │   └── models/
│   │       ├── user.py
│   │       ├── conversation.py
│   │       ├── report.py
│   │       └── feedback.py
│   │
│   ├── schemas/                      # Pydantic request/response models
│   │   ├── auth.py
│   │   ├── chat.py
│   │   ├── report.py
│   │   └── feedback.py
│   │
│   └── utils/
│       ├── logger.py                 # Structured JSON logging
│       ├── validators.py             # Password (5 rules) + email validation
│       └── helpers.py
│
├── knowledge_base/
│   ├── ayurvedic/                    # Ayurvedic text files for RAG
│   │   ├── dosha_guide.txt
│   │   ├── herb_compendium.txt
│   │   └── prakriti_assessment.txt
│   └── biomedical/
│       ├── mental_health_guide.txt
│       ├── common_symptoms.txt
│       └── report_interpretation_guide.txt
│
└── tests/
    ├── test_semantic_gate.py
    ├── test_dnode.py
    ├── test_qil.py
    ├── test_chains.py
    ├── test_rag.py
    ├── test_auth.py
    ├── test_files.py
    └── test_chat.py
```

---

## Three Chain Pipeline (Physical Health)

```python
# disigen.py — physical health branch

async def run_physical_health(query: str, user: User, db) -> dict:
    # Step 1: QIL analysis
    qil = await chain3_mistral.analyze_query(query)

    # Step 2: Route decision
    route = router.decide(qil)

    # Step 3: RAG retrieval (shared context for all chains)
    rag_context = await retriever.retrieve(query)

    # Step 4: All 3 chains concurrent
    results = await asyncio.gather(
        chain1_openbiollm.call_with_failover(
            qil.reformulated.for_chain1, rag_context
        ),
        chain2_ayurparam.call_with_fallback(
            qil.reformulated.for_chain2, rag_context
        ),
        chain3_mistral.call(
            qil.reformulated.for_chain3, rag_context
        ),
        return_exceptions=True
    )

    # Step 5: SEC2 fusion
    return await fusion.synthesize(
        chain1=results[0],
        chain2=results[1],
        chain3=results[2],
        qil=qil
    )
```

---

## Mental Health Branch

```python
async def run_mental_health(query: str, user: User, db) -> dict:
    # Step 1: Semantic gate (Chain 3)
    semantic = await semantic_gate.analyze(query)

    # Step 2: D-Node decision
    dnode_result = dnode.decide(semantic)

    if dnode_result.is_crisis:
        # Fire guardian alert (non-blocking)
        asyncio.create_task(
            rule_based.alert_guardian(user, dnode_result)
        )
        return dnode_result.crisis_response

    # Step 3: Safe — Chain 3 (Mistral) handles conversation
    response = await chain3_mistral.chat(query)
    return fusion.wrap_single(response)
```

---

## Dependencies

Don't use version aka pinned version like `fastapi >= 0.111.0` or `fastapi == 0.111.1` because pinned versions cause conflicts as packages update.

```
fastapi
uvicorn[standard]
pydantic
pydantic-settings
motor
python-jose[cryptography]
bcrypt
python-multipart
httpx
slowapi
bleach
langchain
langchain-community
faiss-cpu
rank-bm25
sentence-transformers
qdrant-client
PyPDF2
pytesseract
Pillow
google-api-python-client
google-auth-httplib2
google-auth-oauthlib
python-dotenv
pytest
pytest-asyncio
black
ruff
```

---

## Environment Variables (.env)

```bash
# MongoDB (Windows host — see wsl_setup.md)
MONGODB_URI=mongodb://172.28.16.1:27017/reassureai

# JWT
JWT_SECRET=your_minimum_32_char_secret_here
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

# Ollama (Windows host)
OLLAMA_BASE_URL=http://172.28.16.1:11434

# AI APIs
HUGGINGFACE_API_KEY=hf_your_key_here
GROQ_API_KEY=gsk_your_groq_key_here

# Vector DB
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key

# File Storage
GOOGLE_DRIVE_CREDENTIALS=credentials.json
GOOGLE_DRIVE_FOLDER_ID=your_drive_folder_id

# Automation
N8N_WEBHOOK_URL=http://localhost:5678/webhook/crisis
```

---

## How to Run

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# First time only — verify WSL2 → Windows connection
# See codebase/wsl_setup.md

cp .env.example .env   # fill in values
python scripts/seed.py  # create test user

uvicorn main:app --reload --port 8000
```

Docs: `http://localhost:8000/docs`

---

## What Agent Updates Here

New file or route added:

1. Add to folder structure with one-line description
2. Update pipeline flow if orchestration changed
3. Add new deps to requirements.txt list
4. Add new env vars to .env section
