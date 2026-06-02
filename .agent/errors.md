# ReassureAI — Errors & Lessons Log

> **Read at session start. Real mistakes that cost time.**
> Add new entries immediately after fixing any bug.

---

## Active Errors

None. Project not started yet.

---

## Resolved Errors

None yet.

---

## Known Pitfalls — Read Before Implementing

### WSL2 → Windows: localhost does NOT work by default

Inside WSL2, `localhost` points to WSL2 itself, not Windows.
MongoDB and Ollama are on Windows. Use Windows host IP or enable
mirrored networking. See `codebase/wsl_setup.md` for full setup.

```bash
# Quick check — get Windows host IP from WSL2
cat /etc/resolv.conf | grep nameserver | awk '{print $2}'
```

---

### Ollama on Windows: must set OLLAMA_HOST=0.0.0.0

By default Ollama only listens on Windows loopback (127.0.0.1).
WSL2 cannot reach it. Must set environment variable on Windows:

```powershell
# PowerShell as Administrator
[System.Environment]::SetEnvironmentVariable("OLLAMA_HOST", "0.0.0.0", "Machine")
taskkill /IM ollama.exe /F
Start-Process ollama serve
```

---

### Semantic Gate: Mistral JSON output validation

`"format": "json"` in Ollama enforces JSON structure but NOT your exact keys.
Always validate with Pydantic. Handle ValidationError gracefully:

```python
try:
    return SemanticAnalysis(**json.loads(raw_output))
except (ValidationError, json.JSONDecodeError) as e:
    logger.error(f"[SEMANTIC GATE] Bad output: {e}")
    raise SemanticGateUnavailableError("Malformed Mistral response")
```

---

### Semantic Gate: never expose `reasoning` to user

`reasoning` is internal logging only.
Never include in API response. Strip before returning.

---

### asyncio.gather: always use return_exceptions=True

Without it, one chain failure kills all three:

```python
# WRONG — one failure crashes all
results = await asyncio.gather(chain1(), chain2(), chain3())

# CORRECT — individual failures handled
results = await asyncio.gather(
    chain1(), chain2(), chain3(),
    return_exceptions=True
)
for r in results:
    if isinstance(r, Exception):
        logger.error(f"Chain failed: {r}")
```

---

### AyurParam: do NOT hard crash on empty RAG

Old behaviour was AyurParamNoContextError. This is removed.
New behaviour: graduated fallback (DEC-004).

```python
# WRONG
if not context:
    raise AyurParamNoContextError()

# CORRECT
if not context:
    logger.warning("[CHAIN2] No RAG context — using model weights only")
    confidence = 0.4  # lower confidence without context
```

---

### Qdrant: use FAISS locally if QDRANT_URL not set

```python
def get_vector_store():
    if settings.qdrant_url:
        return QdrantRetriever(settings.qdrant_url, settings.qdrant_api_key)
    else:
        logger.warning("Qdrant not configured — using local FAISS")
        return FAISSRetriever()
```

Always check this pattern — never hard-require Qdrant in local dev.

---

### Google Drive: credentials.json must be downloaded manually

Google Drive API requires OAuth2 credentials from Google Cloud Console.
The agent cannot create this file. Human (Aarya) must:

1. Go to console.cloud.google.com
2. Enable Drive API
3. Create OAuth2 credentials
4. Download `credentials.json`
5. Place in `backend/` (add to .gitignore)

```
# .gitignore must include:
credentials.json
token.json
```

---

### SHA-256: hash BEFORE uploading to Drive

```python
# CORRECT order
file_bytes = await file.read()
file_hash = hashlib.sha256(file_bytes).hexdigest()

# Check duplicate FIRST
existing = await check_duplicate(file_hash, user_id, db)
if existing:
    return existing  # skip everything else

# Only upload if new
drive_id = await drive.upload(file_bytes, filename)
```

---

### HuggingFace 503: model is loading, not broken

HF free tier returns 503 when model is loading (cold start ~30s).
Retry before failing over to Groq:

```python
async def call_with_retry(self, prompt, retries=3):
    for i in range(retries):
        resp = await httpx_client.post(...)
        if resp.status_code == 200:
            return resp.json()
        if resp.status_code == 503:
            await asyncio.sleep(2 ** i)  # 1s, 2s, 4s
    # After retries exhausted → Groq failover
    return await self.groq_fallback(prompt)
```

---

### react-markdown: must install remark-gfm for tables/strikethrough

```bash
npm install react-markdown remark-gfm
```

```jsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

<ReactMarkdown remarkPlugins={[remarkGfm]}>{response.text}</ReactMarkdown>;
```

---

### Web Speech API: stop previous speech before starting new

```js
const speak = (text) => {
  window.speechSynthesis.cancel(); // stop any current speech
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-IN"; // Indian English accent
  window.speechSynthesis.speak(utterance);
};
```

---

### Motor: use AsyncIOMotorClient, not MongoClient

```python
# CORRECT — async
from motor.motor_asyncio import AsyncIOMotorClient

# WRONG — blocks event loop in async context
from pymongo import MongoClient
```

---

### Pydantic v2: no class Config, use model_config

```python
# CORRECT v2
from pydantic import BaseModel, ConfigDict

class MyModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

# WRONG — v1 style, breaks in v2
class MyModel(BaseModel):
    class Config:
        orm_mode = True
```

---

### CORS + cookies: both sides must match

```python
# backend
app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,   # ← required
)
```

```js
// frontend — every axios call
axios.defaults.withCredentials = true;
```

Miss either → 401 on every protected request.

---

### httpx not requests inside async FastAPI

```python
# CORRECT
import httpx
async with httpx.AsyncClient(timeout=30) as client:
    r = await client.post(url, json=payload)

# WRONG — sync, blocks event loop
import requests
r = requests.post(url, json=payload)
```

---

## How to Add an Error

```
## ERR-XXX — Short title
**Date:** YYYY-MM-DD
**File:** path/to/file.py
**What happened:** description
**Root cause:** why it happened
**Fix:** what solved it
**Prevention:** how to avoid next time
```

## How to Add an Error

When you hit and fix a bug, add it immediately in the format shown above.
Do not skip this step. Future sessions depend on this log.
