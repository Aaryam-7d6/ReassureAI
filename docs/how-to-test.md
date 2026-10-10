# How to Test ReassureAI

## 1. Start the Docker stack
- Run `docker compose up -d` in the project root.
- Confirm all containers are `Up` with `docker compose ps`.

## 2. Verify the main app through Caddy
- Open `http://localhost:8080` in a browser.
- The frontend should load successfully.
- Open `http://localhost:8080/docs` to confirm API docs are available.

## 3. Check health endpoints
- Run `curl http://localhost:8080/health`.
- Run `curl http://localhost:8080/api/v1/health`.
- Both should return `status: ok`.

## 4. Log in with the seeded test user
- Use email: `test@reassureai.dev`
- Password: `Test@1234!`
- Send a POST to `http://localhost:8080/api/v1/auth/login`.
- Confirm login returns HTTP 200, a token, and user details.

## 5. Test the chat endpoint
- Send a POST request to `http://localhost:8080/api/v1/chat`.
- Use JSON like:
  ```json
  {
    "query": "Hello, I need help with stress management."
  }
  ```
- Confirm the response is HTTP 200 and includes `conversation_id` and assistant text.

## 6. Confirm n8n access
- Visit `http://localhost:5678` to validate direct access.
- Optionally use `http://localhost:8080/n8n/` if the proxy route is configured.

## 7. Optional backend checks
- Verify Ollama health with `curl http://127.0.0.1:11434/api/version`.
- Verify MongoDB with `nc -vz 127.0.0.1 27017` or `mongosh "mongodb://127.0.0.1:27017/reassureai" --eval "db.adminCommand({ ping: 1 })"`.

## 8. Final validation
- Confirm the frontend page loads without critical errors.
- Confirm login and chat both work through `http://localhost:8080`.
- Confirm the app routes are stable and the Caddy proxy is serving both frontend and backend correctly.
