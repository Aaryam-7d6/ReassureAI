from contextlib import asynccontextmanager

import httpx
import motor.motor_asyncio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import backend.config as cfg
from backend.app.api.v1.endpoints.auth import router as auth_router
from backend.app.api.v1.endpoints.chat import router as chat_router
from backend.app.api.v1.endpoints.feedback import router as feedback_router
from backend.app.api.v1.endpoints.reports import router as reports_router
from backend.app.core import exceptions as exc
from backend.app.db.init import ensure_required_collections


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.mongo_client = None
    app.state.ollama = None

    yield

    # cleanup
    if app.state.mongo_client is not None:
        app.state.mongo_client.close()
        cfg.LOGGER.info("App shutdown, connections closed")

app = FastAPI(lifespan=lifespan)
app.include_router(auth_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")
app.include_router(feedback_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
# CORS policy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    mongo_status = "disconnected"
    ollama_status = "disconnected"

    try:
        client = motor.motor_asyncio.AsyncIOMotorClient(cfg.MONGO_URI)
        await client.admin.command("ping")
        mongo_status = "connected"
        app.state.mongo_client = client
        await ensure_required_collections(cfg.MONGO_URI)
    except Exception as exc:
        cfg.LOGGER.warning(f"Health check MongoDB failed: {exc}")
        if getattr(app.state, "mongo_client", None) is not None:
            app.state.mongo_client.close()
            app.state.mongo_client = None
    finally:
        if getattr(app.state, "mongo_client", None) is not None and mongo_status != "connected":
            app.state.mongo_client.close()

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{cfg.OLLAMA_URL}/api/version")
            response.raise_for_status()
        ollama_status = "connected"
        app.state.ollama = {"status": "ok"}
    except Exception as exc:
        cfg.LOGGER.warning(f"Health check Ollama failed: {exc}")

    return JSONResponse({
        "status": "ok" if mongo_status == "connected" and ollama_status == "connected" else "degraded",
        "services": {
            "ollama": {
                "status": ollama_status,
                "url": cfg.OLLAMA_URL,
            },
            "mongodb": {
                "status": mongo_status,
                "uri": cfg.MONGO_URI,
            },
        },
        "checks": {
            "ollama": ollama_status,
            "mongodb": mongo_status,
        },
    })

@app.get("/api/v1/health")
async def health_v1():
    return await health()

# global exception handler
@app.exception_handler(exc.AppException)
async def app_exception_handler(request: Request, exc_obj: exc.AppException):
    return JSONResponse({"detail":exc_obj.detail,"code":exc_obj.code}, status_code=exc_obj.status_code)

@app.exception_handler(500)
async def generic_exception_handler(request: Request, exc: Exception):
    cfg.LOGGER.exception("Unhandled exception")
    return JSONResponse({"detail":"Internal Server Error","code":500}, status_code=500)
