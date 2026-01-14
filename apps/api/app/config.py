from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    GEMINI_API_KEY: str
    MANIM_QUALITY: str = "medium_quality"  # low, medium, high
    MAX_SCENE_DURATION: float = 10.0
    MAX_TOTAL_DURATION: float = 60.0
    TEMP_DIR: str = "/tmp/animations"
    
    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()