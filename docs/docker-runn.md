# ReassureAI Docker Run

## Start

Use this command from the repo root:

```bash
docker compose up --build
```

For background mode:

```bash
docker compose up --build -d
```

Stop:

```bash
docker compose down
```

## Open URLs

- App through Caddy: `http://localhost:8080`
- Frontend direct: `http://localhost:5173`
- Backend health: `http://localhost:8080/api/v1/health`
- n8n login: `http://localhost:8080/n8n/`
- n8n direct fallback: `http://localhost:5678`

Use the trailing slash for n8n: `http://localhost:8080/n8n/`.

## Host Services

MongoDB and Ollama run on the host, not inside Docker.

Docker containers reach them with:

```text
mongodb://host.docker.internal:27017/reassureai
http://host.docker.internal:11434
```

Make sure MongoDB and Ollama listen on `0.0.0.0`, and allow them through Windows Firewall if needed.

## Root `.env`

Keep local host values like this:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/reassureai
OLLAMA_BASE_URL=http://127.0.0.1:11434
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
N8N_WEBHOOK_URL=http://localhost:8080/n8n/webhook
```

`N8N_WEBHOOK_URL` is the base webhook URL through Caddy. When you create an n8n webhook workflow, append the workflow path after it, for example:

```env
N8N_WEBHOOK_URL=http://localhost:8080/n8n/webhook/guardian-alert
```

Inside Docker Compose, n8n itself uses:

```text
N8N_PATH=/n8n/
N8N_EDITOR_BASE_URL=http://localhost:8080/n8n/
WEBHOOK_URL=http://localhost:8080/n8n/
```

## If n8n Is Blank

Use `http://localhost:8080/n8n/`, not `http://localhost:8080/n8n`.

Then recreate the containers:

```bash
docker compose down
docker compose up --build
```
