from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str
    redis_url: str = "redis://localhost:6379"
    embedder_url: str = "http://localhost:8080"
    anthropic_api_key: str | None = None
    supabase_url: str | None = None
    supabase_service_role_key: str | None = None
    storage_bucket: str = "documents"

    chunk_target_tokens: int = 600
    chunk_min_tokens: int = 200
    chunk_max_tokens: int = 1000
    chunk_overlap_tokens: int = 100

    embedding_batch_size: int = 32

    log_level: str = "info"


settings = Settings()  # type: ignore[call-arg]
