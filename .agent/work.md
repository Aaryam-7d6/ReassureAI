# ReassureAI — Work Queue

> **Agent picks the FIRST unchecked task. Completes it fully. Checks it off.**
> Add new tasks at the bottom with date. Never reorder existing tasks.
> After completing → update progress.md immediately.

---

## Status Codes

```
[ ] not started   →  pick this next
[~] in progress   →  continue (only ONE at a time)
[x] completed     →  do not touch
[!] blocked       →  read the note, resolve first
```

---

## Phase 1 — Frontend

- [x] **TASK-F01** — Project scaffold
  - `npm create vite@latest frontend -- --template react`
  - Install: `tailwindcss framer-motion axios react-router-dom`
  - Install: `react-markdown remark-gfm`
  - Configure Tailwind
  - Set up Vite proxy → `http://localhost:8000`
  - Verify: `npm run dev` at `http://localhost:5173`

- [x] **TASK-F02** — Home page
  - 5 feature cards: Mental Health, Report Simplifier,
    Ayurvedic Guidance, Crisis Support, 24/7 Chat
  - Navbar: Sign In / Sign Up buttons
  - Responsive Tailwind layout

- [x] **TASK-F03** — Auth pages
  - Tabbed: Sign In + Sign Up
  - Sign Up fields: full name, email, guardian email, password, confirm password
  - Client-side validation: show which password rule is failing (specific message)
  - Email format validation with friendly message
  - Show error inline below each field

- [x] **TASK-F04** — Dashboard
  - Welcome message with username
  - Three stat counters: Conversations / Reports Analysed / Wellness Tips
  - Quick access cards: AI Health Chat, Report Simplifier, Ayurvedic Guidance, Crisis Support

- [x] **TASK-F05** — Chat interface (full modern chatbot UX)
  - Scrollable message list with auto-scroll to latest
  - Floating ↓ arrow button when user has scrolled up → click → smooth scroll to bottom
  - Mode selector dropdown: Mental Health | Physical Health | Ayurveda | Report
  - File drag-drop zone for report uploads
  - **Multiline input:** Shift+Enter = new line, Enter = send
  - "ReassureAI can make mistakes. Cross-verify important health information."
    shown below input at all times
  - Date and time stamp on every message (format: "Today at 2:34 PM")
  - **Markdown rendering:** all AI responses rendered via react-markdown + remark-gfm

- [x] **TASK-F06** — Response action bar (on every AI response)
  - 🔊 **TTS button:** reads response aloud via Web Speech API
  - 📋 **Copy button:** copies raw text to clipboard
  - 🔄 **Regenerate button:** re-sends last user query through pipeline
  - 👍 👎 **Feedback buttons:** like/dislike — calls `POST /api/v1/feedback`
  - Show subtle "Response saved" toast on feedback submission

- [x] **TASK-F07** — Crisis card component
  - Hidden by default, shown when user mentions crisis keywords
  - Empathetic opening message with support resources
  - Crisis hotlines: MANAS, iCall, Vandrevala Foundation
  - "Your life matters 💙" affirmation message
  - Stays visible until new conversation starts

- [x] **TASK-F08** — Report viewer component
  - Simplified reports rendered as markdown
  - Report history list on dashboard with file metadata
  - Clickable reports with upload date display

---

## Phase 2 — Backend Foundation

- [x] **TASK-001** — FastAPI app scaffold
  - Create `backend/main.py` — FastAPI + CORS + lifespan
  - Create `backend/config.py` — pydantic-settings (all env vars)
  - Create `backend/app/utils/logger.py` — structured JSON logging
  - Create `backend/app/core/exceptions.py` — custom exceptions
  - Global exception handler returning standard response shape
  - Lifespan startup: check Ollama + MongoDB connectivity
  - `GET /api/v1/health` → `{"status":"ok","ollama":"connected","mongodb":"connected"}`
  - See `codebase/wsl_setup.md` for Windows host connection

- [x] **TASK-002** — MongoDB connection + indexes + seed
  - Create `backend/app/db/connection.py` — Motor AsyncIOMotorClient
  - Create `backend/app/db/models/user.py`
  - Create `backend/app/db/models/conversation.py`
  - Create `backend/app/db/models/report.py`
  - Create `backend/app/db/models/feedback.py`
  - Create index setup function (see database.md)
  - Create `backend/scripts/seed.py` — creates test user
    ```
    Email:    test@reassureai.dev
    Password: Test@1234!
    ```
  - Write `backend/tests/test_db.py`

- [x] **TASK-003** — Auth endpoints
  - Create `backend/app/schemas/auth.py`
  - Create `backend/app/utils/validators.py`
    - `validate_password()` — all 5 rules with friendly messages
    - `validate_email_format()` — regex + friendly message
  - Create `backend/app/api/v1/endpoints/auth.py`
  - `POST /api/v1/auth/register` — validate email + password, bcrypt, JWT cookie
  - `POST /api/v1/auth/login` — verify, JWT cookie
  - `POST /api/v1/auth/logout` — clear cookie
  - `GET  /api/v1/auth/me` — protected
  - Write `backend/tests/test_auth.py`
    - Test all 5 password rules individually
    - Test invalid email format
    - Test friendly error message structure

---

## Phase 3 — Safety System (SEC1)

- [x] **TASK-004** — Semantic Understanding Layer + D-Node

  **Step 1 — `semantic_gate.py`**
  - Create `backend/app/core/safety/semantic_gate.py`
  - Calls Mistral-7B with `"format": "json"` via Ollama
  - Returns SemanticAnalysis Pydantic model
  - Prompt examples must include implicit crisis cases
  - On Ollama failure → raise SemanticGateUnavailableError
  - Prompt:

    ```python
    SEMANTIC_GATE_PROMPT = """You are a mental health safety analyzer.
    Analyze the following message for emotional distress and crisis signals.
    Understand IMPLIED meaning — not just literal trigger words.

    Implicit crisis (NO trigger word): "I just want everything to stop",
    "nobody would notice if I was gone", "there is no way out"

    NOT a crisis: "I want to kill this exam", "this assignment is killing me",
    "feeling a bit anxious about exams"

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

  **Step 2 — `dnode.py`**
  - Create `backend/app/core/safety/dnode.py`
  - Crisis if: distress_level >= 7 OR is_implicit_crisis OR is_explicit_crisis
  - On SemanticGateUnavailableError → fallback to keyword check
  - Returns DNodeResult(is_crisis, level, reasoning, response)
  - Crisis response: empathetic message + iCall + Vandrevala

  **`crisis_lexicon.json` — fallback only**

  ```json
  {
    "_note": "FALLBACK ONLY. Primary = semantic_gate.py LLM call.",
    "high_risk": [
      "suicide",
      "kill myself",
      "end my life",
      "want to die",
      "hurt myself",
      "self harm",
      "overdose",
      "can't go on",
      "no point living",
      "better off dead"
    ],
    "medium_risk": [
      "feeling hopeless",
      "no reason to live",
      "nobody cares",
      "everyone would be better without me"
    ],
    "emergency_medical": [
      "chest pain",
      "can't breathe",
      "heart attack",
      "stroke",
      "unconscious",
      "severe bleeding"
    ]
  }
  ```

  **Tests — write all:**
  - "I want to hurt myself" → explicit crisis
  - "I just want everything to stop" → implicit crisis (no keyword)
  - "nobody would notice if I was gone" → implicit crisis
  - "I want to kill this exam" → NOT crisis
  - "I have a headache" → safe
  - SemanticGateUnavailableError → keyword fallback fires

- [x] **TASK-005** — n8n Rule-Based trigger
  - `backend/app/core/safety/rule_based.py`
  - asyncio.create_task() — fire and forget
  - Payload: user_id, guardian_email, crisis_level, timestamp, query_snippet (50 chars)
  - Graceful on n8n unavailable
  - Write `backend/tests/test_rule_based.py`

---

## Phase 4 — Three-Chain Pipeline

- [x] **TASK-006** — QIL (Query Intelligence Layer)
  - `backend/app/core/pipeline/qil.py`
  - Mistral-7B JSON output via Ollama
  - Extracts: intent, urgency, biomedical_score, ayurvedic_score,
    reformulated.for_chain1, reformulated.for_chain2, reformulated.for_chain3
  - Pydantic QILResult model
  - Write `backend/tests/test_qil.py`

- [x] **TASK-007** — Physical health router
  - `backend/app/core/pipeline/router.py`
  - DUAL_PARALLEL / MODERN_HEAVY / AYUR_HEAVY / MODERN_ONLY
  - Returns RouteResult(strategy, active_chains, weights)
  - Write `backend/tests/test_router.py`

- [x] **TASK-008: Implemented user authentication service, including login logic, JWT token generation, and password hashing.** — Model base class + Chain 3 Mistral
  - `backend/app/core/models/base.py` — abstract, timeout, retry, confidence
  - `backend/app/core/models/mistral.py` — Ollama, 15s timeout, 3 retries
  - Write `backend/tests/test_mistral.py`

- [x] **TASK-009** — Chain 1 OpenBioLLM + Groq failover
  - `backend/app/core/models/openbiollm.py`
  - Primary: HuggingFace Inference API (httpx async)
  - Failover: Groq API on 429/503 → llama-3-70b-versatile
  - Retry with exponential backoff before failover
  - Write `backend/tests/test_openbiollm.py`

- [x] **TASK-010** — Chain 2 AyurParam with graduated fallback (completed) — 2026-07-04
  - Ollama Mistral integration implemented
  - Graduated fallback logic (DEC-004) fully implemented
  - Confidence scoring (0.0-1.0) added
  - Placeholder for RAG integration
  - `backend/app/core/models/ayurparam.py`
  - Ollama local (Windows)
  - Fallback logic (DEC-004):
    1. RAG found → answer with context
    2. RAG empty → allow model to answer from weights + log low confidence
    3. Both uncertain → return None (redirect to Chain 1 in fusion)
  - Mistral assists query breakdown for AyurParam
  - confidence score (0.0–1.0) in response
  - Write `backend/tests/test_ayurparam.py`

- [ ] **TASK-011** — RAG pipeline (FAISS local → Qdrant Cloud)
  - `backend/app/core/rag/embedder.py` — sentence-transformers
  - `backend/app/core/rag/indexer.py` — chunk, embed, build FAISS + BM25 locally
  - `backend/app/core/rag/retriever.py` — hybrid FAISS + BM25 + RRF
  - `backend/app/core/rag/qdrant_client.py` — Qdrant Cloud connection
    (use FAISS if QDRANT_URL not set, for local dev)
  - Create initial knowledge base text files
  - Write `backend/tests/test_rag.py`

- [ ] **TASK-012** — Concurrent 3-chain execution + Disigen Node
  - `backend/app/core/pipeline/disigen.py`
  - Mental health: semantic_gate → dnode → Mistral (safe) / rule_based (crisis)
  - Physical health: QIL → router → asyncio.gather(chain1, chain2, chain3) → RAG → fusion
  - Report: file text → chain1 simplification
  - Write `backend/tests/test_disigen.py`

- [ ] **TASK-013** — SEC2 Query Fusion + Post-safety
  - `backend/app/core/pipeline/fusion.py`
  - Uses chain2_confidence to weight Ayurvedic perspective
  - If chain2 returned None → feature chain1 and chain3 only
  - Structure: modern_perspective, ayurvedic_perspective, common_ground,
    key_differences, disclaimer
  - Contradiction check, herb-drug interaction flag
  - Disclaimer ALWAYS injected
  - Write `backend/tests/test_fusion.py`

---

## Phase 5 — File Processing

- [ ] **TASK-014** — OCR + file upload + SHA-256 dedup
  - `backend/app/core/files/extractor.py`
    - PDF → PyPDF2
    - Images (PNG/JPG/JPEG) → pytesseract
    - Handwritten docs → pytesseract with preprocessing
  - `backend/app/core/files/dedup.py` — SHA-256 hash check
  - `backend/app/core/files/drive_storage.py` — Google Drive upload/download
  - Accepted formats: PDF, PNG, JPG, JPEG
  - Max size: 10MB
  - Write `backend/tests/test_files.py`

---

## Phase 6 — API Endpoints

- [ ] **TASK-015** — Chat endpoint
  - `POST /api/v1/chat` — full pipeline via Disigen Node
  - `GET  /api/v1/chat/history` — paginated
  - `GET  /api/v1/chat/{id}` — full conversation
  - `DELETE /api/v1/chat/{id}`
  - Save to MongoDB after each response
  - Integration test: full query → response end-to-end

- [ ] **TASK-016** — Feedback endpoint
  - `POST /api/v1/feedback` — like/dislike per message
  - Validate message_id exists in conversation
  - Write `backend/tests/test_feedback.py`

- [ ] **TASK-017** — Report upload endpoint
  - `POST /api/v1/reports/upload`
    - Check SHA-256 → return existing if duplicate
    - Extract text (OCR/PDF)
    - Upload to Google Drive → store file_id
    - Run through Chain 1 simplification
    - Store simplified report
  - `GET  /api/v1/reports` — list user reports
  - `GET  /api/v1/reports/{id}`

---

## Phase 7 — Frontend ↔ Backend

- [ ] **TASK-018** — Wire auth
  - `frontend/src/api/authApi.js`
  - axios withCredentials: true on all calls
  - Show specific field-level error messages from backend

- [ ] **TASK-019** — Wire chat
  - `frontend/src/api/chatApi.js`
  - Handle crisis=true response → show crisis card
  - Handle normal response → render markdown + action bar
  - Loading state during inference (show typing indicator)

- [ ] **TASK-020** — Wire feedback
  - `frontend/src/api/feedbackApi.js`
  - POST on like/dislike click
  - Optimistic UI — button highlights immediately

- [ ] **TASK-021** — Wire report upload
  - `frontend/src/api/reportApi.js`
  - Show simplified report in ReportViewer (markdown)
  - "Already processed — showing saved result" toast on duplicate

---

## Backlog

- [ ] **TASK-B01** — Rate limiting (slowapi) — after prototype works
- [ ] **TASK-B02** — Docker compose — after prototype works
- [ ] **TASK-B03** — Hindi/Gujarati phrases in crisis lexicon fallback
- [ ] **TASK-B04** — Streaming response (SSE) — after basic chat works
- [ ] **TASK-B05** — Prakriti assessment questionnaire

---

## Completed

- [x] TASK-F01 — Project scaffold — 2026-05 (scaffolded frontend with Vite, Tailwind, react-markdown)
- [x] TASK-F02 — Home page — 2026-05 (feature cards + responsive layout)
- [x] TASK-F03 — Auth pages — 2026-05 (Tabbed Sign In / Sign Up with validation)
- [x] UI polish: cleaned duplicate pages, Tailwind theme and color guidance — 2026-06-04
- [x] TASK-F04 — Dashboard — 2026-06-04 (welcome msg, stat counters, quick access cards)
- [x] TASK-F05 — Chat interface — 2026-06-04 (modern chatbot UX with markdown, multiline input, mode selector, file drop)
- [x] TASK-F06 — Response action bar — 2026-06-04 (TTS, copy, regenerate, feedback buttons with toast)
- [x] TASK-F07 — Crisis card component — 2026-06-04 (empathetic crisis support with hotlines, keyword detection)
- [x] TASK-F08 — Report viewer component — 2026-06-04 (report history, markdown summaries, metadata display)

<!-- Move tasks here with [x] and date when done -->
