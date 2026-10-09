# n8n Email Workflows

This project runs the backend, MongoDB, and n8n inside Docker Compose.

## Current Docker URLs

Use different URLs depending on who is calling n8n:

- Browser/editor URL: `http://localhost:5678/workflow/`
- Backend-to-n8n Docker URL: `http://n8n:5678`
- Browser test webhook base: `http://localhost:5678/webhook`
- Backend Docker webhook base: `http://n8n:5678/webhook`

The backend should never call `http://localhost:5678` from inside Docker. Inside the backend container, `localhost` means the backend container itself. Docker Compose service names are used for container-to-container calls, so the n8n host is `n8n`.

## MongoDB URL

MongoDB is running in Docker Compose as the service named `mongo`.

For backend inside Docker Compose:

```env
MONGO_URI=mongodb://mongo:27017/reassureai
MONGODB_URI=mongodb://mongo:27017/reassureai
```

For backend running directly on your host while MongoDB is still exposed by Docker:

```env
MONGO_URI=mongodb://127.0.0.1:27017/reassureai
MONGODB_URI=mongodb://127.0.0.1:27017/reassureai
```

The current Compose MongoDB has no username/password configured, so do not use the authenticated `reassureai_app:...@host.docker.internal` URI for this Docker setup.

## n8n Persistence Check

n8n saves its local users and workflows in:

```text
data/n8n/database.sqlite
```

Current check result: `data/n8n/database.sqlite` exists.

If n8n shows the signup page every time, it usually means the n8n data folder is not being persisted or n8n has not successfully written its database yet. This Compose file runs n8n as root and mounts:

```yaml
./data/n8n:/root/.n8n
```

After you create the n8n owner account, check again:

```bash
ls -lh data/n8n/database.sqlite
```

## Backend Webhook Environment

The backend is configured to call these n8n webhooks:

```env
N8N_WELCOME_WEBHOOK_URL=http://n8n:5678/webhook/welcome-email
N8N_CRISIS_WEBHOOK_URL=http://n8n:5678/webhook/crisis
N8N_WEBHOOK_TIMEOUT_SECONDS=5
```

These are Docker-internal URLs. In the browser, the same webhook paths look like:

```text
http://localhost:5678/webhook/welcome-email
http://localhost:5678/webhook/crisis
```


## Workflow 1: Welcome Email

Create a new workflow in n8n.

Nodes:

1. `Webhook`
   - HTTP Method: `POST`
   - Path: `welcome-email`
   - Respond: `Immediately`

2. `Send Email`, `SMTP`, or `Gmail`
   - To: `{{$json.body.email}}`
   - Subject: `Welcome to ReassureAI`
   - Email body:

```text
Hi {{$json.body.full_name || "there"}},

Welcome to ReassureAI. Your account has been created successfully.

You can now sign in and start using the support chat.
```

3. Optional `Respond to Webhook`
   - Response Body:

```json
{
  "ok": true,
  "event": "welcome_email"
}
```

Expected backend payload:

```json
{
  "event": "user_registered",
  "user_id": "USER_ID",
  "email": "user@example.com",
  "full_name": "User Name",
  "guardian_email": "guardian@example.com",
  "created_at": "2026-10-09T10:00:00"
}
```

## Workflow 2: Crisis Guardian Email

Create another new workflow in n8n.

Nodes:

1. `Webhook`
   - HTTP Method: `POST`
   - Path: `crisis`
   - Respond: `Immediately`

2. `Send Email`, `SMTP`, or `Gmail`
   - To: `{{$json.body.guardian_email}}`
   - Subject: `ReassureAI Safety Alert`
   - Email body:

```text
A possible crisis message was detected for a user who listed you as their guardian contact.

Crisis level: {{$json.body.crisis_level}}
Time: {{$json.body.timestamp}}
Message snippet: {{$json.body.query_snippet}}

Please check in with them as soon as possible. If there is immediate danger, contact local emergency services.
```

3. Optional `Respond to Webhook`
   - Response Body:

```json
{
  "ok": true,
  "event": "crisis_email"
}
```

Expected backend payload:

```json
{
  "user_id": "USER_ID",
  "guardian_email": "guardian@example.com",
  "crisis_level": 9,
  "timestamp": "2026-10-09T10:00:00",
  "query_snippet": "message snippet..."
}
```

## Testing The Webhooks

From your host browser, use the n8n editor at:

```text
http://localhost:5678/workflow/
```

In n8n, open the workflow and click `Listen for test event`.

Test welcome webhook from your host:

```bash
curl -X POST http://localhost:5678/webhook-test/welcome-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","full_name":"Test User"}'
```

Test crisis webhook from your host:

```bash
curl -X POST http://localhost:5678/webhook-test/crisis \
  -H "Content-Type: application/json" \
  -d '{"guardian_email":"guardian@example.com","crisis_level":9,"timestamp":"2026-10-09T10:00:00","query_snippet":"test crisis snippet"}'
```

After activating the workflows, production webhook URLs use `/webhook/` instead of `/webhook-test/`.

## Should The Email Use An LLM?

Use prewritten templates.

For welcome email, a simple static template is enough.

For crisis email, do not use an LLM to generate the alert. The message should be predictable, short, and safety-focused. The backend can pass structured fields like `crisis_level`, `timestamp`, and `query_snippet`; n8n should put those fields into a fixed email template.

## What The Backend Now Does

Registration flow:

```text
User registers
  -> backend saves user in MongoDB
  -> backend POSTs to /webhook/welcome-email
  -> n8n sends welcome email
```

Crisis flow:

```text
User sends chat message
  -> backend detects crisis
  -> backend loads saved guardian_email from MongoDB
  -> backend POSTs to /webhook/crisis
  -> n8n sends guardian alert email
```

----


Fixed it. The issue was this:

Your `docker-compose.yml` had:

```yaml
user: "0:0"
volumes:
  - ./data/n8n:/home/node/.n8n
```

But because n8n is running as root, its real home is:

```text
/root/.n8n
```

So n8n was saving the database inside the container at `/root/.n8n/database.sqlite`, while your host folder `data/n8n` was mounted to the wrong place.

I did three things:

1. Copied the current n8n database from the running container into `data/n8n`.
2. Changed [docker-compose.yml](/home/aaryam/ReassureAI/docker-compose.yml:90) to:

```yaml
volumes:
  - ./data/n8n:/root/.n8n
```

3. Recreated n8n with:

```bash
docker compose up -d n8n
```

Now this exists:

```text
data/n8n/database.sqlite
```

and the running container sees it correctly at:

```text
/root/.n8n/database.sqlite
```

What you should do now:

1. Open n8n again:

```text
http://localhost:5678
```

2. You should still be logged in / owner setup should be preserved.

3. Now create your 2 workflows:
   - `welcome-email`
   - `crisis`

4. If you want to confirm persistence later, run:

```bash
ls -lh data/n8n/database.sqlite
```

This should no longer say “No such file or directory.”


-----

In n8n create two workflows:
1. Welcome email workflow
   - Trigger: Webhook
   - Method: POST
   - Path: welcome-email
   - Then add email node: SMTP / Gmail / Send Email
2. Crisis email workflow
   - Trigger: Webhook
   - Method: POST
   - Path: crisis
   - Then add email node and use fields like:
     - guardian_email
     - crisis_level
     - query_snippet
     - timestamp
For email content: use a prewritten template. For crisis alerts especially, do not use an LLM to generate the email. Keep it predictable, short, and safe.