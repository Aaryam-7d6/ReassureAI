from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os
import motor.motor_asyncio
import ollama

import backend.config as cfg
from backend.app.core import exceptions as exc
from backend.app.api.v1.endpoints.auth import router as auth_router
from backend.app.api.v1.endpoints.chat import router as chat_router
from backend.app.api.v1.endpoints.feedback import router as feedback_router
from backend.app.api.v1.endpoints.reports import router as reports_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # MongoDB
    try:
        client = motor.motor_asyncio.AsyncIOMotorClient(cfg.MONGO_URI)
        await client.admin.command('ping')
        app.state.mongo_client = client
        cfg.LOGGER.info("MongoDB connected")
    except Exception as e:
        cfg.LOGGER.error(f"MongoDB connection failed: {e}")
        raise
    # Ollama
    try:
        response = ollama.list()
        app.state.ollama = response
        cfg.LOGGER.info("Ollama connected")
    except Exception as e:
        cfg.LOGGER.error(f"Ollama connection failed: {e}")
        raise
    yield
    # cleanup
    client.close()
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

@app.get("/api/v1/health")
async def health():
    return JSONResponse({"status":"ok","ollama":"connected","mongodb":"connected"})

# global exception handler
@app.exception_handler(exc.AppException)
async def app_exception_handler(request: Request, exc_obj: exc.AppException):
    return JSONResponse({"detail":exc_obj.detail,"code":exc_obj.code}, status_code=exc_obj.status_code)

@app.exception_handler(500)
async def generic_exception_handler(request: Request, exc: Exception):
    cfg.LOGGER.exception("Unhandled exception")
    return JSONResponse({"detail":"Internal Server Error","code":500}, status_code=500)
