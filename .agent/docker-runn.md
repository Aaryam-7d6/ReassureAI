# ReassureAI Docker Runtime

This setup gives the project a shared runtime for WSL Ubuntu, Windows, and other machines. The app containers run the frontend, backend, n8n, and Caddy together, while MongoDB and Ollama stay on the host machine where you already installed them.

## What Was Added

- `docker-compose.yml` starts `frontend`, `backend`, `n8n`, and `caddy`.
- `Caddyfile` gives one clean entrypoint at `http://localhost:8080`.
- `frontend/Dockerfile` runs Vite on `0.0.0.0:5173`.
- The frontend container publishes `5173:5173`, so Docker Desktop shows a clickable frontend port.
- `backend/Dockerfile` runs FastAPI on `0.0.0.0:8000`.
- `backend/.env` points containers to host MongoDB and Ollama through `host.docker.internal`.
- `frontend/.env` keeps non-Docker frontend dev pointed at the backend on port `8000`.
- `.dockerignore` keeps local dependencies, virtualenvs, build output, and data out of Docker builds.
- `backend/main.py` and `backend/requirements.txt` were added because the repo scripts expected `backend/main.py`, but it was not present.
- n8n runs as root in this local dev compose file so it can write to the bind-mounted `./data/n8n` folder on WSL/Windows filesystems.

## Clean Routes

- Frontend through Caddy, recommended: `http://localhost:8080`
- Frontend direct Vite port: `http://localhost:5173`
- Backend health: `http://localhost:8080/api/v1/health`
- n8n: `http://localhost:8080/n8n`
- Direct backend, if needed: `http://localhost:8000`
- Direct n8n, if needed: `http://localhost:5678`

Inside containers:

- MongoDB host service: `mongodb://host.docker.internal:27017/reassureai`
- Ollama host service: `http://host.docker.internal:11434`
- Backend service: `http://backend:8000`
- Frontend service: `http://frontend:5173`
- n8n service: `http://n8n:5678`

## Host Requirements

MongoDB and Ollama must listen on all interfaces, not only `127.0.0.1`.

MongoDB should be reachable from the host at:

```text
mongodb://localhost:27017/reassureai
```

Ollama should be reachable from the host at:

```text
http://localhost:11434
```

For Ollama on Windows, use a host setting like:

```text
OLLAMA_HOST=0.0.0.0:11434
```

Also allow MongoDB and Ollama through Windows Firewall for local/private network access if containers cannot connect.

## Start

From the repo root:

```bash
docker compose up --build
```

Then open:

```text
http://localhost:8080
```

You can also open the direct frontend container port:

```text
http://localhost:5173
```

In Docker Desktop, the `frontend` row should show `5173:5173`. The `caddy` row should show `8080:80`. Use `8080` when you want the clean routed app (`/`, `/api/*`, `/n8n`), and use `5173` when you specifically want the Vite frontend container.

Run in the background:

```bash
docker compose up --build -d
```

View logs:

```bash
docker compose logs -f
```

Stop:

```bash
docker compose down
```

Stop and remove Docker named volumes used by Caddy/frontend dependencies:

```bash
docker compose down -v
```

This does not remove `./data/n8n`, because that is stored as a local bind-mounted folder.

If n8n cannot write to `./data/n8n`, check the folder permissions. On WSL/Linux you can usually fix that with:

```bash
sudo chown -R "$USER:$USER" data
```

The compose file also runs n8n as root for local development to avoid the common WSL/Windows bind-mount permission issue.

## Environment Notes

Root `.env` currently still has local direct-development values:

```text
MONGODB_URI=mongodb://127.0.0.1:27017/reassureai
OLLAMA_BASE_URL=http://127.0.0.1:11434
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
```

That is fine for direct local development from WSL when those addresses work. Docker Compose uses explicit service env values for the container runtime:

```text
MONGO_URI=mongodb://host.docker.internal:27017/reassureai
MONGODB_URI=mongodb://host.docker.internal:27017/reassureai
OLLAMA_BASE_URL=http://host.docker.internal:11434
FRONTEND_URL=http://localhost:8080
BACKEND_URL=http://localhost:8080
```

If you want root `.env` to be Docker-first, change it to:

```text
MONGODB_URI=mongodb://host.docker.internal:27017/reassureai
OLLAMA_BASE_URL=http://host.docker.internal:11434
FRONTEND_URL=http://localhost:8080
BACKEND_URL=http://localhost:8080
```

Frontend `.env`:

```text
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

This is for running `cd frontend && npm run dev` outside Docker. In Docker, Compose sets:

```text
VITE_API_BASE_URL=/api/v1
```

so browser API calls go through Caddy at `http://localhost:8080/api/v1`.

Backend `.env`:

```text
MONGO_URI=mongodb://host.docker.internal:27017/reassureai
MONGODB_URI=mongodb://host.docker.internal:27017/reassureai
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

Both `MONGO_URI` and `MONGODB_URI` are present because different code often chooses one name.

Root `.env` is not loaded into Docker Compose automatically. This avoids putting unrelated local secrets into the container config. If the full backend later needs values such as `JWT_SECRET`, copy only the needed values into `backend/.env`.

## Code Changes

- `backend/app/core/safety/semantic_gate.py` now reads `OLLAMA_BASE_URL` instead of hardcoding localhost.
- `backend/app/core/safety/dnode.py` now reads `crisis_lexicon.json` relative to the Python file instead of using an absolute machine path.
- `frontend/src/api/axios.js` now reads `VITE_API_BASE_URL` instead of hardcoding `http://localhost:5000/api/v1`.

## Important Current Limitation

The backend in this repo was incomplete when this Docker setup was added. The new `backend/main.py` is a small bootable FastAPI app so the runtime starts and health checks work. When the full backend routes are added, keep the same port and env variables and Docker will continue to work.
