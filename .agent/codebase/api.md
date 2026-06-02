# ReassureAI — API Reference

> **Single source of truth for all endpoints.**
> Frontend and backend must stay in sync with this file.
> Update immediately when any endpoint changes.

---

## Base URL

```
Development:  http://localhost:8000/api/v1
Production:   https://your-domain.com/api/v1
```

## Standard Response Shape

Every endpoint returns this exact shape:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "timestamp": "2025-01-01T00:00:00Z"
}
```

On error:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-friendly message here",
    "details": {}
  },
  "timestamp": "2025-01-01T00:00:00Z"
}
```

---

## Auth Endpoints

### POST /auth/register

Create a new user account.

**Request:**

```json
{
  "full_name": "Aarya Thakar",
  "email": "aarya@example.com",
  "guardian_email": "parent@example.com",
  "password": "Test@1234!",
  "confirm_password": "Test@1234!"
}
```

**Response 201:**

```json
{
  "success": true,
  "data": {
    "user_id": "abc123",
    "email": "aarya@example.com",
    "full_name": "Aarya Thakar"
  },
  "error": null,
  "timestamp": "..."
}
```

**Error — password rule failure (422):**

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Hey! Your password needs a little more strength 💪",
    "details": {
      "requirements_missing": ["at least one uppercase letter (A-Z)"],
      "tip": "A strong password keeps your health data safe 🔒"
    }
  },
  "timestamp": "..."
}
```

**Error — invalid email (422):**

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Hmm, that email doesn't look right 🤔",
    "details": {
      "tip": "Check your email — something like you@example.com"
    }
  },
  "timestamp": "..."
}
```

---

### POST /auth/login

**Request:** `{ "email": "...", "password": "..." }`

**Response 200:** Sets `access_token` httpOnly cookie. Returns user object.

```json
{
  "success": true,
  "data": {
    "user_id": "abc123",
    "email": "aarya@example.com",
    "full_name": "Aarya Thakar"
  },
  "error": null,
  "timestamp": "..."
}
```

---

### POST /auth/logout

Clears the `access_token` cookie.

**Response 200:** `{ "success": true, "data": { "message": "Logged out" } }`

---

### GET /auth/me

**Protected.** Returns current user from JWT cookie.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "user_id": "abc123",
    "email": "aarya@example.com",
    "full_name": "Aarya Thakar",
    "guardian_email": "parent@example.com"
  },
  "error": null,
  "timestamp": "..."
}
```

---

## Chat Endpoints

### POST /chat

**Protected.** Main pipeline — runs through Disigen Node.

**Request:**

```json
{
  "query": "I have been feeling anxious for 2 weeks",
  "branch": "mental_health",
  "conversation_id": "optional — omit for new conversation"
}
```

**Response 200 — normal (physical health):**

```json
{
  "success": true,
  "data": {
    "conversation_id": "xyz789",
    "message_id": "msg_uuid_here",
    "crisis": false,
    "response": {
      "modern_perspective": "## Modern Medical View\n...",
      "ayurvedic_perspective": "## Ayurvedic View\n...",
      "common_ground": "## Where Both Agree\n...",
      "key_differences": "## Key Differences\n...",
      "disclaimer": "---\n*ReassureAI provides educational information only...*"
    },
    "chains_used": ["chain1", "chain2", "chain3"],
    "chain2_confidence": 0.85,
    "route_used": "DUAL_PARALLEL",
    "branch": "physical_health"
  },
  "error": null,
  "timestamp": "..."
}
```

**Response 200 — mental health (safe):**

```json
{
  "success": true,
  "data": {
    "conversation_id": "xyz789",
    "message_id": "msg_uuid_here",
    "crisis": false,
    "response": {
      "text": "## Mental Wellness Support\n...",
      "disclaimer": "---\n*ReassureAI provides educational information only...*"
    },
    "chains_used": ["chain3"],
    "route_used": "MENTAL_HEALTH",
    "branch": "mental_health"
  },
  "error": null,
  "timestamp": "..."
}
```

**Response 200 — crisis detected:**

```json
{
  "success": true,
  "data": {
    "crisis": true,
    "message": "I'm really concerned about what you're sharing. You're not alone — help is available.",
    "resources": [
      {
        "name": "iCall",
        "number": "9152987821",
        "available": "Mon-Sat, 8am-10pm"
      },
      {
        "name": "Vandrevala Foundation",
        "number": "1860-2662-345",
        "available": "24/7"
      }
    ],
    "guardian_alerted": true
  },
  "error": null,
  "timestamp": "..."
}
```

---

### GET /chat/history

**Protected.** Paginated list of user's conversations.

**Query params:** `?page=1&limit=20`

**Response 200:**

```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "xyz789",
        "title": "Feeling anxious for 2 weeks",
        "branch": "mental_health",
        "updated_at": "2025-01-01T14:30:00Z",
        "message_count": 6
      }
    ],
    "total": 12,
    "page": 1,
    "limit": 20
  }
}
```

---

### GET /chat/{conversation_id}

**Protected.** Full message history.

---

### DELETE /chat/{conversation_id}

**Protected.** Deletes a conversation.

---

## Feedback Endpoint

### POST /feedback

**Protected.** Like/dislike per AI response.

**Request:**

```json
{
  "conversation_id": "xyz789",
  "message_id": "msg_uuid_here",
  "feedback": "like",
  "comment": "Very helpful answer"
}
```

**Response 201:**

```json
{
  "success": true,
  "data": { "feedback_id": "fb_uuid" },
  "error": null,
  "timestamp": "..."
}
```

---

## Report Endpoints

### POST /reports/upload

**Protected.** Upload and simplify a medical report.
File deduplication via SHA-256 — if same file uploaded before, returns cached result.

**Request:** `multipart/form-data` with field `file` (PDF, PNG, JPG, JPEG — max 10MB)

**Response 201 — new file:**

```json
{
  "success": true,
  "data": {
    "report_id": "rep456",
    "original_filename": "blood_report.pdf",
    "file_type": "pdf",
    "simplified_report": "## Your Report Simplified\n\n**Haemoglobin:** 13.5 g/dL — this is within the normal range...",
    "is_duplicate": false,
    "created_at": "..."
  },
  "error": null,
  "timestamp": "..."
}
```

**Response 200 — duplicate file:**

```json
{
  "success": true,
  "data": {
    "report_id": "rep123",
    "original_filename": "blood_report.pdf",
    "simplified_report": "## Your Report Simplified\n...",
    "is_duplicate": true,
    "message": "We've processed this report before — showing your saved result."
  }
}
```

---

### GET /reports

**Protected.** List user's reports.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "rep456",
        "original_filename": "blood_report.pdf",
        "file_type": "pdf",
        "created_at": "..."
      }
    ]
  }
}
```

---

### GET /reports/{report_id}

**Protected.** Get full simplified report.

---

## Health Check

### GET /health

**Public.** No auth required. Check all service statuses.

**Response 200:**

```json
{
  "status": "ok",
  "services": {
    "mongodb": "connected",
    "ollama": "connected",
    "qdrant": "connected",
    "huggingface": "reachable"
  },
  "chains": {
    "chain1_openbiollm": "ready",
    "chain2_ayurparam": "ready",
    "chain3_mistral": "ready"
  },
  "timestamp": "..."
}
```

---

## Error Codes Reference

| Code                    | HTTP | Meaning                                                         |
| ----------------------- | ---- | --------------------------------------------------------------- |
| `INVALID_CREDENTIALS`   | 401  | Wrong email or password                                         |
| `TOKEN_EXPIRED`         | 401  | JWT has expired — re-login                                      |
| `TOKEN_MISSING`         | 401  | No auth cookie — must login                                     |
| `VALIDATION_ERROR`      | 422  | Request body invalid (see details)                              |
| `CRISIS_DETECTED`       | 200  | Crisis signal — emergency response returned                     |
| `MODEL_UNAVAILABLE`     | 503  | Ollama or HF API not responding                                 |
| `CHAIN1_FAILOVER`       | —    | HF rate limited, switched to Groq (logged, not shown to user)   |
| `CHAIN2_LOW_CONFIDENCE` | —    | AyurParam uncertain, Chain 1 featured prominently (logged)      |
| `RAG_EMPTY`             | —    | No relevant context found — models answer from weights (logged) |
| `FILE_TOO_LARGE`        | 413  | Upload exceeds 10MB                                             |
| `UNSUPPORTED_FORMAT`    | 415  | Only PDF, PNG, JPG, JPEG accepted                               |
| `DUPLICATE_FILE`        | 200  | Same file uploaded before — returning cached result             |
| `DRIVE_UPLOAD_FAILED`   | 500  | Google Drive upload failed — file not saved                     |

---

## Frontend Axios Setup

```js
// src/api/index.js — base axios config
import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1", // Vite proxy handles → localhost:8000
  withCredentials: true, // required for httpOnly JWT cookie
  headers: { "Content-Type": "application/json" },
});

// Auto redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = "/auth";
    }
    return Promise.reject(error);
  },
);

export default api;
```
