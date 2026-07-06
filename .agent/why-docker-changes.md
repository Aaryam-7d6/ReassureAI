# Why these Docker changes were made

- The backend container must reach Ollama and MongoDB running on the Windows host, not the MongoDB container inside Compose, so the backend now uses the host-based URLs for Mongo and Ollama.
- The FastAPI app now exposes a /health endpoint that checks both dependencies so it is easy to verify from the browser, curl, or Docker logs.
- A dedicated initialization script creates and verifies the required MongoDB collections so they appear in Compass once the backend connects successfully.
- The sample environment file was cleaned up to remove duplicate Mongo and Ollama variable names and keep a single source of truth for the Docker host-based settings.
- The Compose setup was aligned with the current routing notes so the app is reachable through the Caddy reverse proxy at localhost:8080, while the backend API and docs remain available under /api and /docs.
- These changes were kept compatible with the current codebase by reusing the existing config flow and adding the new behavior without changing the rest of the application structure.
- The routing layout was also improved to keep the main app clean at the root, route the API and docs through the same reverse proxy, expose n8n through a dedicated host-style entry point, and publish n8n on its own host port for simpler access.
- The health endpoint now returns clearer dependency status for Ollama and MongoDB so you can verify whether the app is fully ready from the browser or curl.
