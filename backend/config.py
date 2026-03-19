from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = ""
    jwt_secret: str = "habit-dev-secret-change-in-production"
    jwt_expire_days: int = 7
    # Google OAuth (one-time setup: see OAUTH_SETUP.md)
    google_client_id: str = ""
    google_client_secret: str = ""
    frontend_url: str = "http://localhost:3000"  # no trailing slash; where to redirect after OAuth

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
