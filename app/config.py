"""Application configuration utilities."""

from functools import lru_cache
from pydantic import BaseSettings, AnyHttpUrl, validator


class Settings(BaseSettings):
    """Runtime configuration derived from environment variables."""

    app_name: str = "Primary Classes Manager"
    database_url: str = "sqlite:///./data.db"
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

    class Config:
        env_file = ".env"
        case_sensitive = False

    @validator("allowed_file_types", pre=True)
    def _split_allowed_file_types(cls, value: str | tuple[str, ...]) -> tuple[str, ...]:
        if isinstance(value, str):
            return tuple(ext.strip() for ext in value.split(",") if ext.strip())
        return value


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings."""

    return Settings()
