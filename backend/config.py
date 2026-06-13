from pydantic_settings import BaseSettings
from backend.app.utils.logger import get_logger

class Settings(BaseSettings):
    MONGO_URI: str = "mongodb://localhost:27017"
    OLLAMA_URL: str = "http://localhost:11434"
    LOG_LEVEL: str = "INFO"
    CORS_ORIGINS: str = "*"
    class Config:
        env_file = ".env"
        case_sensitive = False

cfg = Settings()
LOGGER = get_logger("backend")
