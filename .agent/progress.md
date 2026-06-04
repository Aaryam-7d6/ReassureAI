# ReassureAI — Progress Tracker

> **Updated after every completed task.**
> Agent reads this at session start to know exactly where to pick up.

---

## Overall Status

```
Phase 1 — Frontend UI         ████████████████████    100%
Phase 2 — Backend Foundation  ░░░░░░░░░░░░░░░░░░░░    0%
Phase 3 — Safety (SEC1)       ░░░░░░░░░░░░░░░░░░░░    0%
Phase 4 — Three-Chain Pipeline░░░░░░░░░░░░░░░░░░░░    0%
Phase 5 — File Processing     ░░░░░░░░░░░░░░░░░░░░    0%
Phase 6 — API Endpoints       ░░░░░░░░░░░░░░░░░░░░    0%
Phase 7 — Integration         ░░░░░░░░░░░░░░░░░░░░    0%
```

---

## Completed ✓

- Frontend UI — scaffold, Home page, Auth pages (TASK-F01, TASK-F02, TASK-F03) — May 2026

---

## In Progress 🔄

- Nothing currently in progress. Next: Backend foundation (TASK-001)

---

## Architecture Decisions Locked In

| Decision                                      | File    |
| --------------------------------------------- | ------- |
| FastAPI only                                  | DEC-001 |
| Tri-model pipeline (3 chains concurrent)      | DEC-009 |
| Semantic LLM gate as primary SEC1 detector    | DEC-007 |
| AyurParam graduated fallback (not hard crash) | DEC-004 |
| Qdrant Cloud VDB + FAISS local fallback       | DEC-002 |
| Google Drive file storage (local dev)         | DEC-010 |
| SHA-256 file deduplication                    | DEC-011 |
| HuggingFace → Groq failover                   | DEC-013 |
| MongoDB + Ollama on Windows, WSL2 connects    | DEC-014 |
| Local prototype first, production later       | DEC-015 |
| RLHF feedback collection                      | DEC-012 |
| JWT in httpOnly cookie                        | DEC-005 |

---

## Known Constraints Going In

| Constraint                                | Affects         | Mitigation                             |
| ----------------------------------------- | --------------- | -------------------------------------- |
| AyurParam 3B hallucinates without context | TASK-010        | Graduated fallback, confidence scoring |
| HuggingFace free tier rate limits         | TASK-009        | Groq failover                          |
| Ollama on Windows, accessed from WSL2     | All model tasks | See wsl_setup.md                       |
| MongoDB on Windows, accessed from WSL2    | TASK-002        | See wsl_setup.md                       |
| Semantic gate adds ~1-2s latency          | TASK-004        | Acceptable — safety > speed            |
| Qdrant Cloud needs setup                  | TASK-011        | FAISS locally first, swap later        |

---

## Session Log

| Date       | Who            | What                                                                                               |
| ---------- | -------------- | -------------------------------------------------------------------------------------------------- |
| May 2026   | Aarya          | Fresh start, full .agent system built                                                              |
| May 2026   | Aarya          | Added semantic LLM gate, 3-chain concurrent, TTS/copy/feedback UX                                  |
| May 2026   | Aarya          | Added Qdrant, Google Drive, SHA-256 dedup, API failover, wsl_setup.md, why.md                      |
| 2026-06-04 | GitHub Copilot | Frontend polish: cleaned duplicate pages, added Tailwind theme colors, and frontend color guidance |

---

## Next Session Starting Point

**Start with TASK-F01** — frontend scaffold.
Nothing is pre-built. Everything from zero.
Read wsl_setup.md before starting backend tasks.
