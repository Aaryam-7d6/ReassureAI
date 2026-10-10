# iter-0

- Fixed Docker backend MongoDB routing to use the Compose `mongo` service.
- Added startup seeding/repair for `test@reassureai.dev` / `Test@1234!`.
- Made CORS explicit so credentialed login works from local frontend/proxy origins.
- Switched AyurParam from sync Ollama client to async Ollama client.
- Prevented placeholder model failures like `Could not generate response` from being returned as valid chat answers.
- Added a useful mental-health fallback when Mistral/Ollama is temporarily unavailable.
