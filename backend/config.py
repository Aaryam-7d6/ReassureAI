from pydantic_settings import BaseSettings
from backend.app.utils.logger import get_logger

class Settings(BaseSettings):
    MONGO_URI: str = "mongodb://localhost:27017"
    OLLAMA_URL: str = "http://localhost:11434"
    LOG_LEVEL: str = "INFO"
    CORS_ORIGINS: str = "*"
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    
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
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"

cfg = Settings()
LOGGER = get_logger("backend")
