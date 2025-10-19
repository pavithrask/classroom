"""Application configuration utilities."""

from functools import lru_cache

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration derived from environment variables."""

    app_name: str = "Primary Classes Manager"
    database_url: str = "sqlite:///./data.db"
    database_sslmode: str | None = None
    database_init_max_retries: int = 5
    database_init_retry_interval: float = 2.0
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 60 * 24
    smtp_host: str = "localhost"
    smtp_port: int = 25
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from: str = "teacher@example.com"
    timezone: str = "Asia/Colombo"
    file_upload_limit_mb: int = 10
    allowed_file_types: tuple[str, ...] = ("pdf", "docx", "jpg", "jpeg", "png", "mp4")
    backup_bucket: AnyHttpUrl | None = None

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    @field_validator("database_url", mode="before")
    def _normalize_database_url(cls, value: str) -> str:
        """Ensure SQLAlchemy can load the configured database dialect."""

        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+psycopg2://", 1)
        return value

    @field_validator("allowed_file_types", mode="before")
    def _split_allowed_file_types(cls, value: str | tuple[str, ...]) -> tuple[str, ...]:
        if isinstance(value, str):
            return tuple(ext.strip() for ext in value.split(",") if ext.strip())
        return value


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings."""

    return Settings()
