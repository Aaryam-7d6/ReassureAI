from pathlib import Path

from pydantic_settings import BaseSettings
from backend.app.utils.logger import get_logger

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    MONGO_URI: str = "mongodb://host.docker.internal:27017/reassureai"
    MONGODB_URI: str = ""
    OLLAMA_URL: str = "http://host.docker.internal:11434"
    OLLAMA_BASE_URL: str = ""
    HUGGINGFACE_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    OPENBIO_MODEL_NAME: str = "aaditya/Llama3-OpenBioLLM-70B"
    OPENBIO_GROQ_MODEL: str = "llama-3-70b-versatile"
    LOG_LEVEL: str = "INFO"
    CORS_ORIGINS: str = "*"
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    JWT_SECRET: str = "dev-only-change-me"
    JWT_ALGORITHM: str = "HS256"
    UPLOAD_DIR: str = "data/uploads"
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024
    
    # Qdrant Cloud settings
    QDRANT_URL: str = ""
    QDRANT_API_KEY: str = ""
    QDRANT_COLLECTION_AYURVEDA: str = "ayurveda_kb"
    QDRANT_COLLECTION_MENTAL_HEALTH: str = "mental_health_kb"
    QDRANT_DENSE_VECTOR_NAME: str = ""
    QDRANT_SPARSE_VECTOR_NAME: str = "text-sparse"
    QDRANT_TEXT_PAYLOAD_KEY: str = "text"
    RAG_DEFAULT_COLLECTION: str = "ayurveda_kb"
    
    class Config:
        env_file = str(BASE_DIR / ".env")
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"

cfg = Settings()
LOGGER = get_logger("backend")

MONGO_URI = cfg.MONGODB_URI or cfg.MONGO_URI
MONGODB_URI = cfg.MONGODB_URI or cfg.MONGO_URI
OLLAMA_BASE_URL = cfg.OLLAMA_BASE_URL
OLLAMA_URL = cfg.OLLAMA_BASE_URL or cfg.OLLAMA_URL
UPLOAD_DIR = cfg.UPLOAD_DIR
MAX_UPLOAD_SIZE_BYTES = cfg.MAX_UPLOAD_SIZE_BYTES
HUGGINGFACE_API_KEY = cfg.HUGGINGFACE_API_KEY
GROQ_API_KEY = cfg.GROQ_API_KEY
OPENBIO_MODEL_NAME = cfg.OPENBIO_MODEL_NAME
OPENBIO_GROQ_MODEL = cfg.OPENBIO_GROQ_MODEL
QDRANT_URL = cfg.QDRANT_URL
QDRANT_API_KEY = cfg.QDRANT_API_KEY
QDRANT_COLLECTION_AYURVEDA = cfg.QDRANT_COLLECTION_AYURVEDA
QDRANT_COLLECTION_MENTAL_HEALTH = cfg.QDRANT_COLLECTION_MENTAL_HEALTH
QDRANT_DENSE_VECTOR_NAME = cfg.QDRANT_DENSE_VECTOR_NAME
QDRANT_SPARSE_VECTOR_NAME = cfg.QDRANT_SPARSE_VECTOR_NAME
QDRANT_TEXT_PAYLOAD_KEY = cfg.QDRANT_TEXT_PAYLOAD_KEY
RAG_DEFAULT_COLLECTION = cfg.RAG_DEFAULT_COLLECTION
JWT_SECRET = cfg.JWT_SECRET
JWT_ALGORITHM = cfg.JWT_ALGORITHM
