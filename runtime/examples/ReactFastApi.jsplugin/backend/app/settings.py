from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="GRAALY_",
        env_file=".env",
        extra="ignore",
    )

    database_url: str = "sqlite+aiosqlite:///./graaly-ui.db"
    api_key: str = "change-me-in-production"
    jwt_secret: str = Field(
        default="change-this-jwt-secret-in-production",
        min_length=32,
    )
    token_ttl_seconds: int = Field(default=300, ge=30, le=3600)
    admin_player_ids: str = ""
    auto_create_schema: bool = True

    @property
    def admin_ids(self) -> frozenset[str]:
        return frozenset(
            value.strip()
            for value in self.admin_player_ids.split(",")
            if value.strip()
        )
