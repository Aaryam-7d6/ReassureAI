# ReassureAI — Progress Tracker

> **Updated after every completed task.**
> Agent reads this at session start to know exactly where to pick up.

---

## Overall Status

```
Phase 1 — Frontend UI         ████████████████████    100%  (TASK-F01..F03 + polish + F04 + F05..F08)
Phase 2 — Backend Foundation  ████████████████████    100%  (TASK-001, TASK-002, TASK-003)
Phase 3 — Safety (SEC1)       ████████████████████    100% (TASK-004 and TASK-005)
Phase 4 — Three-Chain Pipeline████████████████████    100% (TASK-006, TASK-007, TASK-008, TASK-009, TASK-010, TASK-011, TASK-012, TASK-013)
Phase 5 — File Processing     ████████████████████    100% (TASK-014)
Phase 6 — API Endpoints       ████████████████████    100% (TASK-015, TASK-016, TASK-017)
Phase 7 — Integration         ████████████████████    100% (TASK-018, TASK-019, TASK-020, TASK-021)
```

---

## Completed ✓

- Frontend UI — scaffold, Home page, Auth pages, Dashboard (TASK-F01, TASK-F02, TASK-F03, TASK-F04) — May–June 2026
- Backend Foundation — FastAPI scaffold, MongoDB + indexes + seed, Auth endpoints (TASK-001, TASK-002, TASK-003) — June 2026
- Frontend ↔ Backend integration — auth, chat, feedback, and report upload wiring completed and verified (TASK-018..TASK-021) — 2026-07-05

---

## In Progress 🔄

- TASK-005 — n8n Rule-Based trigger (completed)
- TASK-007 — Physical health router (completed)
- TASK-008 — Model base class + Chain 3 Mistral (USER AUTH: base.py + mistral.py) — June 2026
- TASK-009 — Chain 1 OpenBioLLM + Groq failover — June 2026
- TASK-010 — Chain 2 AyurParam with graduated fallback (completed) — 2026-07-04
- TASK-011 — RAG retrieval only (completed) — 2026-07-04
- TASK-012 — Concurrent 3-chain execution + Disigen Node (completed) — 2026-07-04
- TASK-013 — SEC2 Query Fusion + Post-safety (completed) — 2026-07-05
- TASK-014 — OCR + local file upload + SHA-256 dedup (completed) — 2026-07-05
- TASK-015 — Chat endpoints + MongoDB conversation persistence (completed) — 2026-07-05
- TASK-016 — Embedded message feedback endpoint (completed) — 2026-07-05
- TASK-017 — Report upload/list/detail endpoint with simplification (completed) — 2026-07-05

---

## Architecture Decisions Locked In

| Decision                                      | File    |
| --------------------------------------------- | ------- |
| FastAPI only                                  | DEC-001 |
| Tri-model pipeline (3 chains concurrent)      | DEC-009 |
| Semantic LLM gate as primary SEC1 detector    | DEC-007 |
| AyurParam graduated fallback (not hard crash) | DEC-004 |
| Qdrant Cloud VDB + FAISS local fallback       | DEC-002 |
| Local disk file storage (UPLOAD_DIR)          | DEC-010 |
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

| Date       | Who            | What                                                                                                                                              |
| ---------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| May 2026   | Aarya          | Fresh start, full .agent system built                                                                                                             |
| May 2026   | Aarya          | Added semantic LLM gate, 3-chain concurrent, TTS/copy/feedback UX                                                                                 |
| May 2026   | Aarya          | Added Qdrant, Google Drive, SHA-256 dedup, API failover, wsl_setup.md, why.md                                                                     |
| 2026-06-04 | GitHub Copilot | Frontend polish: cleaned duplicate pages, added Tailwind theme colors, and frontend color guidance                                                |
| 2026-06-04 | GitHub Copilot | Dashboard (TASK-F04): welcome message, stat counters (conversations/reports/tips), quick access cards                                             |
| 2026-06-04 | GitHub Copilot | Chat interface (TASK-F05): modern chatbot UX, markdown rendering, multiline input, mode selector, file drag-drop                                  |
| 2026-06-04 | GitHub Copilot | Response action bar (TASK-F06): TTS, copy, regenerate, like/dislike feedback with toast notifications                                             |
| 2026-06-04 | GitHub Copilot | Crisis card (TASK-F07): empathetic UI with crisis hotlines, keyword detection, always-visible design                                              |
| 2026-06-04 | GitHub Copilot | Report viewer (TASK-F08): report history list, markdown summaries, file metadata display on dashboard                                             |
| 2026-07-04 | Codex          | TASK-011: implemented hybrid dense + keyword/sparse retrieval. Chunking, embedding, and Qdrant upload stay in Google Colab.                       |
| 2026-07-04 | Codex          | TASK-012: implemented Disigen orchestration for mental, physical, and report flows with concurrent model-chain execution.                         |
| 2026-07-05 | Codex          | TASK-014: implemented OCR/PDF extraction fallback, local report uploads, SHA-256 document deduplication, and upload metadata records.             |
| 2026-07-05 | Codex          | TASK-015: implemented chat API endpoints with Disigen processing, paginated history, detail, delete, and MongoDB persistence.                     |
| 2026-07-05 | Codex          | TASK-016: implemented message feedback endpoint with ownership checks and overwrite-on-double-vote behavior.                                      |
| 2026-07-05 | Codex          | TASK-017: completed report upload endpoint with OCR extraction, Chain 1 simplification, duplicate reuse, list, and detail routes.                 |
| 2026-07-05 | GitHub Copilot | TASK-018..TASK-021: wired auth, chat, feedback, and report upload between frontend and backend, and verified the flow with build and pytest runs. |

---

<!--
## Next Session Starting Point

**Start with TASK-004** — Safety System (SEC1): Semantic Understanding Layer + D-Node.
Backend foundation (TASK-001–003) is complete.
Read wsl_setup.md before starting backend tasks. -->
