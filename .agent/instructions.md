# ReassureAI — Agent Instructions

> **Read before writing a single line of code. These rules are absolute.**

---

## 0. Session Start Protocol

```
1. Read .agent/project.md
2. Read .agent/progress.md
3. Read .agent/errors.md
4. Read .agent/work.md
5. Read relevant .agent/codebase/*.md
6. ONLY THEN — write code
```

---

## ⭐ PRIORITY RULE — LOCAL DEV FIRST

> **ALWAYS prioritise getting a working local prototype over production-ready code.**
> A working demo that runs on localhost beats a perfectly architected system that
> doesn't run yet. Ship locally first. Harden later.

This means:

- Use `.env` for all config — don't worry about secret management services yet
- Use local Ollama (Windows) — don't worry about GPU cloud yet
- Use MongoDB on Windows — don't worry about Atlas yet
- Use FAISS locally — switch to Qdrant Cloud once local works
- Use Google Drive API for file storage — don't worry about S3 yet
- Hardcode the test user seed script — don't wait for full admin UI
- Get the 3 chains talking to each other before optimizing anything
- A response that works is worth more than an optimized response that doesn't

**Production hardening (rate limiting, Docker, cloud deploy) comes AFTER
the full pipeline works end-to-end on localhost.**

---

## 1. General Coding Principles

### Clarity over cleverness

```python
# BAD
result = [p(x) for x in d if x and v(x) and not x.get('s')]

# GOOD
valid_items = [x for x in data if x and validate(x)]
unskipped   = [x for x in valid_items if not x.get('skip')]
result      = [process(x) for x in unskipped]
```

### One function, one job

```python
# BAD
async def process_and_save_query(query, user_id): ...

# GOOD
async def process_query(query: str) -> dict: ...
async def save_query(result: dict, user_id: str) -> None: ...
```

### Fail loudly, fail early

```python
# BAD
try:
    result = await call_model(query)
except:
    pass

# GOOD
try:
    result = await call_model(query)
except ModelTimeoutError as e:
    logger.error(f"[MODEL TIMEOUT] {e}")
    raise HTTPException(status_code=503, detail="Model temporarily unavailable")
```

---

## 2. Python / FastAPI Standards

- **Python:** 3.11+
- **Framework:** FastAPI — async everywhere
- **Server:** Uvicorn
- **Formatter:** black
- **Linter:** ruff
- **Type hints:** required on all signatures

### All Routes Async

```python
@router.post("/chat", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
) -> ChatResponse:
    result = await pipeline.run(request.query, current_user.id)
    return ChatResponse(**result)
```

### Pydantic v2

```python
from pydantic import BaseModel, Field, ConfigDict

class ChatRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    query: str = Field(..., min_length=1, max_length=2000)
    mode: Literal["mental_health", "physical_health", "report", "general"]
    conversation_id: str | None = None
```

### Config — pydantic-settings

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongodb_uri: str            # Windows host IP:27017
    ollama_base_url: str        # Windows host IP:11434
    qdrant_url: str             # Qdrant Cloud URL
    qdrant_api_key: str
    google_drive_credentials: str  # path to credentials.json
    jwt_secret: str
    huggingface_api_key: str
    groq_api_key: str           # fallback when HF rate limits
    n8n_webhook_url: str

    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
```

---

## 3. Security Standards

### Password Validation — All 5 Rules + Email

```python
import re
from fastapi import HTTPException, status

def validate_password(password: str) -> None:
    errors = []
    if len(password) < 8:
        errors.append("at least 8 characters")
    if not re.search(r"[A-Z]", password):
        errors.append("at least one uppercase letter (A-Z)")
    if not re.search(r"[a-z]", password):
        errors.append("at least one lowercase letter (a-z)")
    if not re.search(r"\d", password):
        errors.append("at least one number (0-9)")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        errors.append("at least one special character")
    if errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "Hey! Your password needs a little more strength 💪",
                "requirements_missing": errors,
                "tip": "A strong password keeps your health data safe 🔒"
            }
        )

def validate_email_format(email: str) -> None:
    pattern = r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "Hmm, that email doesn't look right 🤔",
                "tip": "Check your email — something like you@example.com"
            }
        )
```

### JWT — httpOnly Cookie

```python
response.set_cookie(
    key="access_token", value=token,
    httponly=True, secure=True, samesite="lax", max_age=86400
)
```

### Input Sanitization

```python
import bleach
def sanitize_input(text: str) -> str:
    return bleach.clean(text, tags=[], strip=True).strip()
```

### File Deduplication — SHA-256

```python
import hashlib

def hash_file(file_bytes: bytes) -> str:
    return hashlib.sha256(file_bytes).hexdigest()

async def check_duplicate(file_hash: str, user_id: str, db) -> dict | None:
    return await db.reports.find_one({"file_hash": file_hash, "user_id": user_id})
```

---

## 4. Three Chain Concurrent Execution

All 3 chains run concurrently for physical health queries:

```python
import asyncio

async def run_chains_concurrently(qil_result, rag_context):
    results = await asyncio.gather(
        chain1_openbiollm.call(qil_result.for_openbiollm, rag_context),
        chain2_ayurparam.call_with_fallback(qil_result.for_ayurparam, rag_context),
        chain3_mistral.call(qil_result.for_mistral, rag_context),
        return_exceptions=True
    )
    return {
        "chain1": results[0],
        "chain2": results[1],
        "chain3": results[2]
    }
```

Mental health branch: only Chain 3 (Mistral) runs — Chains 1 and 2 are NOT called.

---

## 5. API Failover (HuggingFace → Groq)

```python
async def call_openbiollm_with_failover(prompt: str, context: str) -> str:
    try:
        return await openbiollm_hf.call(prompt, context)
    except (RateLimitError, ModelUnavailableError) as e:
        logger.warning(f"[HF FAILOVER] Switching to Groq: {e}")
        return await openbiollm_groq.call(prompt, context)
```

Add `GROQ_API_KEY` to `.env`. Groq free tier supports llama-3-70b.

---

## 6. Chat UX — Frontend Standards

Every AI response card MUST include:

```jsx
<ResponseCard>
  <MarkdownRenderer content={response.text} /> // react-markdown
  <Timestamp value={response.timestamp} /> // "Today at 2:34 PM"
  <ActionBar>
    <TTSButton text={response.text} /> // Web Speech API
    <CopyButton text={response.text} /> // navigator.clipboard
    <RegenerateButton onRegenerate={handleRegen} /> // re-runs pipeline
    <FeedbackButtons
      onLike={() => submitFeedback("like")}
      onDislike={() => submitFeedback("dislike")}
    />
  </ActionBar>
</ResponseCard>
```

Input box rules:

- Enter → send message
- Shift+Enter → new line (multiline support)
- Show "ReassureAI can make mistakes. Cross-verify important health information."
  below the input box at all times

Auto-scroll:

- Auto-scroll to latest message on new response
- Show floating ↓ arrow button when user has scrolled up
- Click arrow → smooth scroll to bottom

---

## 7. Safety Rules — Non-Negotiable

```
RULE S1: SEC1 = TWO steps. Always. Before any response LLM.
         Step 1 — semantic_gate.py: LLM understands true intent (NOT keywords)
         Step 2 — dnode.py: Crisis/safe decision from semantic output
         Fallback: crisis_lexicon.json keywords if Mistral unavailable
         If both fail → return crisis resources anyway

RULE S2: No diagnosis language ever.
         Banned: "you have", "you are diagnosed", "this confirms",
         "your condition is", "you suffer from"

RULE S3: Keywords are FALLBACK. Semantic gate is PRIMARY.

RULE S4: Chain 2 (AyurParam) has fallback logic — see DEC-004.
         Not a hard crash. Graceful degradation.

RULE S5: n8n guardian alert → asyncio.create_task() — fire and forget.
         Never await. User gets crisis response first.

RULE S6: Medical disclaimer ALWAYS injected by SEC2.
         Never skipped. Never optional.

RULE S7: File uploads → SHA-256 hash check first.
         If duplicate → return existing processed result immediately.
```

---

## 8. Markdown in Responses

All LLM responses must be rendered as markdown in the frontend:

```jsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

<ReactMarkdown remarkPlugins={[remarkGfm]}>{response.text}</ReactMarkdown>;
```

All model prompts should instruct the model to use markdown formatting:

- Use **bold** for important terms
- Use bullet points for lists
- Use `code blocks` for medical terms or herb names
- Use ## headers for sections (Modern Perspective, Ayurvedic Perspective, etc.)

---

## 9. RLHF Feedback Collection

```python
# POST /api/v1/feedback
class FeedbackRequest(BaseModel):
    conversation_id: str
    message_id: str
    feedback: Literal["like", "dislike"]
    comment: str | None = None

# Store in MongoDB feedback collection
# Used later for fine-tuning or evaluation
```

---

## 10. Git Workflow

```
main        → stable, working locally — Aarya merges only
dev         → integration branch
feature/xxx → individual features
fix/xxx     → bug fixes
```

Commit format:

```
feat(chat): add TTS and copy response buttons
feat(safety): implement LLM semantic gate
fix(chain2): handle empty RAG context with graceful fallback
feat(frontend): add RLHF like/dislike feedback buttons
```

Before every commit:

```bash
black .
ruff check .
pytest tests/ -v
git status | grep .env  # must be empty
```

---

## 11. What NOT To Do

```
✗ Flask — FastAPI only
✗ Sync routes — async def always
✗ localStorage for JWT — httpOnly cookies only
✗ Hardcoded secrets — .env only
✗ print() — use logger
✗ Hard crash on empty RAG for AyurParam — use fallback (DEC-004)
✗ Keywords as primary crisis detection — semantic gate is primary
✗ Skip SHA-256 hash check on file upload
✗ TODO comments — write task in work.md
✗ Push to main directly
✗ Commit .env
✗ Swallow exceptions silently
✗ Production optimization before local prototype works
```
