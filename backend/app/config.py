import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    ResQNet Central Cloud & Triage API settings.

    Values are loaded (in priority order) from:
      1. Environment variables (process env, e.g. set in your shell or CI)
      2. A `.env` file in the working directory (auto-loaded by pydantic-settings)
      3. The defaults declared below
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    PROJECT_NAME: str = "ResQNet Central Cloud & Triage API"
    VERSION: str = "3.0.0-PROD"
    API_V1_STR: str = "/api/v1"

    # Database & Supabase Settings
    # Defaults to SQLite local fallback, or set PostgreSQL / Supabase URL in .env
    DATABASE_URL: str = "sqlite:///./resqnet_cloud_vault.db"
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # Security & JWT Configuration
    JWT_SECRET: str = "resqnet-super-secret-production-key-v3"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Gateway Identity
    GATEWAY_NODE_ID: str = "GATEWAY_FASTAPI_PROD_CLOUD_01"

    # MSG91 OTP Provider (free tier: 5,000 SMS on signup, then pay-as-you-go)
    # Set MSG91_ENABLED=true after configuring the keys below
    MSG91_ENABLED: bool = False
    MSG91_AUTH_KEY: str = ""
    MSG91_SENDER_ID: str = "ResQNet"
    MSG91_TEMPLATE_ID: str = ""
    MSG91_OTP_LENGTH: int = 4
    MSG91_OTP_EXPIRY_MINUTES: int = 5

    # Fast2SMS OTP Provider (50 free SMS on signup, then pay-as-you-go)
    # Set FAST2SMS_ENABLED=true after configuring the key below.
    # No KYC, no DLT template required for the free trial credits.
    FAST2SMS_ENABLED: bool = False
    FAST2SMS_API_KEY: str = ""
    FAST2SMS_SENDER_ID: str = "ResQNet"
    FAST2SMS_OTP_LENGTH: int = 6
    FAST2SMS_OTP_EXPIRY_MINUTES: int = 5

    # 100% Free Email (Gmail) OTP Provider
    # Uses standard Gmail SMTP (smtp.gmail.com:587) with App Password.
    # If SMTP_USER or SMTP_PASSWORD is not set, automatically falls back to Free Demo Mode.
    SMTP_ENABLED: bool = True
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "ResQNet Emergency Mesh"
    EMAIL_OTP_EXPIRY_MINUTES: int = 10


settings = Settings()
