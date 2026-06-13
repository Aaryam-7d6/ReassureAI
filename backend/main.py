"""
FastAPI application entry point.

Creates an app with CORS, lifespan handlers, a health endpoint, and global exception handling.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .app.core.exceptions import APIException, ValidationException
from .app.utils.logger import get_logger
from .config import Settings

logger = get_logger()
settings = Settings()


app = FastAPI(title="ReassureAI API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(APIException)
async def api_exception_handler(request, exc: APIException):
    logger.error("APIException", exc_info=exc)
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_response(),
    )

@app.exception_handler(ValidationException)
async def validation_exception_handler(request, exc: ValidationException):
    logger.error("ValidationException", exc_info=exc)
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_response(),
    )


@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok", "ollama": "unknown", "mongodb": "unknown"}


# Lifespan event handlers
@app.on_event("startup")
async def startup_event():
    from .app.utils.logger import async_log
    await async_log("Startup")
    # Connectivity checks will be added later

@app.on_event("shutdown")
async def shutdown_event():
    await async_log("Shutdown")
