# ReassureAI — WSL2 Setup Guide

> **How to connect WSL2 (backend) to MongoDB and Ollama on Windows.**
> Read this before running the backend for the first time.

---

## The Problem

MongoDB and Ollama are installed on **Windows**.
Your FastAPI backend runs in **WSL2 Ubuntu**.
WSL2 uses a virtual network — `localhost` inside WSL2 is NOT the same as
`localhost` on Windows. You need the Windows host IP.

---

## Step 1 — Get Your Windows Host IP from WSL2

Run this inside WSL2:

```bash
cat /etc/resolv.conf | grep nameserver | awk '{print $2}'
```

This gives you something like `172.28.16.1` — this is your Windows host IP
as seen from WSL2. **This IP changes every time WSL2 restarts.**

To avoid updating `.env` every restart, use mirrored networking (Step 2).

---

## Step 2 — Enable Mirrored Networking (Windows 11, recommended)

This makes `localhost` in WSL2 map directly to Windows localhost.
After this, you can use `localhost` instead of the dynamic IP.

On Windows, create or edit `C:\Users\<YourUsername>\.wslconfig`:

```ini
[wsl2]
networkingMode=mirrored
```

Then restart WSL2 from PowerShell:

```powershell
wsl --shutdown
```

Open a new WSL2 terminal. Now `localhost` works from WSL2 for Windows services.

> **Windows 10 users:** Mirrored mode not supported. Use the dynamic IP method below.

---

## Step 3 — Configure Ollama on Windows

Ollama by default binds to `127.0.0.1` only (Windows loopback).
You need it to listen on all interfaces so WSL2 can reach it.

**Option A — Environment variable (recommended):**

Open Windows PowerShell as Administrator:

```powershell
# Set environment variable permanently
[System.Environment]::SetEnvironmentVariable("OLLAMA_HOST", "0.0.0.0", "Machine")

# Restart Ollama
taskkill /IM ollama.exe /F
Start-Process ollama serve
```

**Option B — Windows Firewall rule (required either way):**

Run in PowerShell as Administrator:

```powershell
netsh advfirewall firewall add rule `
  name="Ollama WSL Access" `
  dir=in action=allow protocol=TCP `
  localport=11434 profile=any
```

**Verify from WSL2:**

```bash
curl http://localhost:11434
# Should print: "Ollama is running"

# Or with dynamic IP:
curl http://$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}'):11434
```

---

## Step 4 — Configure MongoDB on Windows

MongoDB by default binds to `127.0.0.1`.
You need it to accept connections from WSL2.

**Edit MongoDB config:**
Open `C:\Program Files\MongoDB\Server\<version>\bin\mongod.cfg` in Notepad as Administrator.

Find the `net` section and change:

```yaml
net:
  port: 27017
  bindIp: 0.0.0.0 # was 127.0.0.1 — change to this
```

**Restart MongoDB service:**

```powershell
# In PowerShell as Administrator
Restart-Service -Name MongoDB
```

**Add Windows Firewall rule for MongoDB:**

```powershell
netsh advfirewall firewall add rule `
  name="MongoDB WSL Access" `
  dir=in action=allow protocol=TCP `
  localport=27017 profile=any
```

**Verify from WSL2:**

```bash
# With mirrored networking:
mongosh mongodb://localhost:27017

# With dynamic IP:
mongosh mongodb://$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}'):27017
```

---

## Step 5 — Configure .env in WSL2

**With mirrored networking (Windows 11):**

```env
MONGODB_URI=mongodb://localhost:27017/reassureai
OLLAMA_BASE_URL=http://localhost:11434
```

**With dynamic IP (Windows 10 or fallback):**

```env
# Replace with your actual Windows IP from Step 1
MONGODB_URI=mongodb://172.28.16.1:27017/reassureai
OLLAMA_BASE_URL=http://172.28.16.1:11434
```

**Helper script for dynamic IP (add to your WSL2 ~/.bashrc):**

```bash
# Auto-get Windows host IP
export WINDOWS_HOST=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}')
```

Then in `.env`:

```env
MONGODB_URI=mongodb://${WINDOWS_HOST}:27017/reassureai
OLLAMA_BASE_URL=http://${WINDOWS_HOST}:11434
```

---

## Step 6 — Verify Everything Works

Run these from WSL2 before starting the backend:

```bash
# 1. Check Ollama
curl http://localhost:11434/api/tags
# Should return JSON with your installed models

# 2. Check Mistral is pulled
ollama list
# Should show mistral in the list
# If not: from Windows PowerShell → ollama pull mistral

# 3. Check MongoDB (install mongosh in WSL2 if needed)
sudo apt install -y mongodb-mongosh
mongosh mongodb://localhost:27017 --eval "db.runCommand({ping:1})"
# Should return: { ok: 1 }

# 4. Start backend
cd backend
uvicorn main:app --reload --port 8000
# GET http://localhost:8000/api/v1/health should return {"status":"ok","ollama":"connected","mongodb":"connected"}
```

---

## Startup Health Check (backend/main.py)

```python
from contextlib import asynccontextmanager
import httpx
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    app.state.db = AsyncIOMotorClient(settings.mongodb_uri)["reassureai"]
    await create_indexes(app.state.db)

    # Check Ollama
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            r = await client.get(f"{settings.ollama_base_url}/api/tags")
            if r.status_code == 200:
                logger.info("✓ Ollama connected")
            else:
                logger.warning("⚠ Ollama responded but not healthy")
    except Exception:
        logger.warning("⚠ Ollama not reachable — Chain 2 and 3 unavailable")

    # Check MongoDB
    try:
        await app.state.db.command("ping")
        logger.info("✓ MongoDB connected")
    except Exception:
        logger.error("✗ MongoDB connection failed — check wsl_setup.md")

    yield  # App runs here

    # Shutdown
    app.state.db.client.close()
```

---

## Common Issues

| Problem                                      | Fix                                                                           |
| -------------------------------------------- | ----------------------------------------------------------------------------- |
| `Connection refused` on port 11434           | Ollama not running or OLLAMA_HOST not set to 0.0.0.0                          |
| `Connection refused` on port 27017           | MongoDB bindIp not set to 0.0.0.0 or firewall blocking                        |
| Works once, breaks after WSL restart         | Dynamic IP changed — use mirrored networking or re-run `cat /etc/resolv.conf` |
| `bind: address already in use` for Ollama    | Both Windows and WSL2 Ollama running — pick one, kill the other               |
| Models not showing in `ollama list` from WSL | Models are on Windows Ollama — run `ollama list` from Windows PowerShell      |
