# Docker runtime routes

This project uses a single main entry point for the web app and a separate entry point for n8n.

## Recommended local access

- Main application: http://localhost:8080
- API docs: http://localhost:8080/docs
- API base: http://localhost:8080/api/v1
- Health check: http://localhost:8080/health
- Login: http://localhost:8080/api/v1/auth/login
- Chat endpoint: http://localhost:8080/api/v1/chat
- n8n direct access: http://localhost:5678
- n8n via the proxy: http://localhost:8080/n8n/

## Verified test credentials

- Email: `test@reassureai.dev`
- Password: `Test@1234!`

## Dependency checks

- Ollama health check:
  - curl http://127.0.0.1:11434/api/version
- MongoDB ping check:
  - nc -vz 127.0.0.1 27017
  - or: mongosh "mongodb://127.0.0.1:27017/reassureai" --eval "db.adminCommand({ ping: 1 })"
- Application health endpoint:
  - curl http://localhost:8080/health
- API health endpoint:
  - curl http://localhost:8080/api/v1/health

## Why this layout is preferred

- The main app stays clean and easy to navigate at the root.
- The API and documentation are routed through the same reverse proxy.
- n8n is exposed directly on its own port and also through the proxy on port 8080.
- This setup keeps frontend and backend traffic on a single local entry point.

## Notes

- The main frontend and backend are served through Caddy on port 8080.
- The backend is available at `/api/v1` through the same proxy.
- n8n is exposed directly on port 5678 and via the proxy at http://localhost:8080/n8n/.
- If you want a custom hostname later, add it to your hosts file and route it to `127.0.0.1`.

