import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ResQNet Central Cloud & Triage API"
    VERSION: str = "3.0.0-PROD"
    API_V1_STR: str = "/api/v1"
    
    # Database Settings - Defaults to SQLite fallback for rapid local developmental testing if PostgreSQL URL is not set
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./resqnet_cloud_vault.db")
    
    # Security & JWT Configuration
    JWT_SECRET: str = os.getenv("JWT_SECRET", "resqnet-super-secret-production-key-v3")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Gateway Identity
    GATEWAY_NODE_ID: str = "GATEWAY_FASTAPI_PROD_CLOUD_01"

    class Config:
        case_sensitive = True

settings = Settings()
