"""
Configuration using Pydantic Settings. Exposes environment variables used by the backend.
"""
import os
from pydantic import BaseSettings, Field

class Settings(BaseSettings):
    # General
    API_TITLE: str = Field("ReassureAI API", env="API_TITLE")
    API_VERSION: str = Field("1.0.0", env="API_VERSION")
    # MongoDB
    MONGODB_URI: str = Field("mongodb://localhost:27017", env="MONGODB_URI")
    # Ollama
    OLLOMA_URL: str = Field("http://localhost:11434", env="OLLOMA_URL")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
