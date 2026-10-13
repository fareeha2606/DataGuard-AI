from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    app_name: str = "DataGuard AI API"
    version: str = "1.0.0"

    mongo_uri: str = ""
    mongo_db: str = "dataguard"

    cors_origins: str = (
        "http://localhost:8080,"
        "http://127.0.0.1:8080,"
        "http://localhost:5173,"
        "http://127.0.0.1:5173"
    )

    max_upload_mb: int = 500
    anomaly_sample_rows: int = 100000

    mlflow_tracking_uri: str = ""

    model_dir: str = str(BASE_DIR / "models")

    # DataGuard folders
    uploads_dir: str = str(BASE_DIR / "uploads")
    processed_dir: str = str(BASE_DIR / "processed")
    reports_dir: str = str(BASE_DIR / "reports")

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        extra="ignore"
    )

    @property
    def cors_list(self):
        return [
            x.strip()
            for x in self.cors_origins.split(",")
            if x.strip()
        ]


settings = Settings()

# Make sure required folders exist
for p in [
    Path(settings.uploads_dir),
    Path(settings.processed_dir),
    Path(settings.reports_dir),
    BASE_DIR / "mlruns",
    Path(settings.model_dir),
]:
    p.mkdir(parents=True, exist_ok=True)