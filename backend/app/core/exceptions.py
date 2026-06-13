from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
import logging
from ..utils.logger import logger

def http_exception_handler(request: Request, exc: Exception):
    """Global exception handler translating exceptions to JSON responses.
    Returns a standardized error payload without leaking internal details.
    """
    # Log the exception with stack trace for debugging
    logger.error("Unhandled exception: %s", exc, exc_info=exc)
    # Default to 500 for unexpected errors
    status_code = getattr(exc, "status_code", 500)
    detail = getattr(exc, "detail", "Internal server error")
    # Avoid exposing raw exception messages in production
    if status_code >= 500:
        detail = "Internal server error"
    return JSONResponse(status_code=status_code, content={"error": detail})
