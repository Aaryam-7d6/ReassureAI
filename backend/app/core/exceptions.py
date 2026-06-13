from fastapi import Request
from fastapi.responses import JSONResponse
from ..utils.logger import get_logger

logger = get_logger("exceptions")

class AppException(Exception):
    def __init__(self, detail: str, status_code: int = 400, code: str = "BAD_REQUEST"):
        self.detail = detail
        self.status_code = status_code
        self.code = code
        super().__init__(detail)

def http_exception_handler(request: Request, exc: Exception):
    """Global exception handler translating exceptions to JSON responses."""
    logger.error("Unhandled exception: %s", exc, exc_info=exc)
    status_code = getattr(exc, "status_code", 500)
    detail = getattr(exc, "detail", "Internal server error")
    if status_code >= 500:
        detail = "Internal server error"
    return JSONResponse(status_code=status_code, content={"error": detail})
