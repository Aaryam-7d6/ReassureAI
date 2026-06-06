import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()


def _split_origins(value: str) -> list[str]:
    return [origin.strip() for origin in value.split(",") if origin.strip()]


frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")

app = FastAPI(title="ReassureAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_split_origins(
        os.getenv(
            "CORS_ORIGINS",
            f"{frontend_url},{backend_url},http://localhost:8080,http://127.0.0.1:8080",
        )
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
@app.get("/api/v1/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "backend"}


@app.get("/api/v1/runtime")
async def runtime() -> dict[str, str]:
    mongo_uri = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI", "")
    return {
        "mongo_uri": mongo_uri.rsplit("@", 1)[-1] if mongo_uri else "",
        "ollama_base_url": os.getenv("OLLAMA_BASE_URL", ""),
        "environment": os.getenv("ENVIRONMENT", "development"),
    }
