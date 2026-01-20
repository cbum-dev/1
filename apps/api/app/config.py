from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):

    GEMINI_API_KEY: str
    

    MANIM_QUALITY: str = "medium_quality"
    MAX_SCENE_DURATION: float = 10.0
    MAX_TOTAL_DURATION: float = 60.0
    TEMP_DIR: str = "/tmp/animations"
    

    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 60 * 24 * 7  
    

    DATABASE_URL: str = "postgresql://localhost/animation_studio"
    DEBUG: bool = False
    

    STRIPE_SECRET_KEY: str = "sk_test_..."
    STRIPE_PUBLISHABLE_KEY: str = "pk_test_..."
    STRIPE_WEBHOOK_SECRET: str = "whsec_..."
    

    RATE_LIMIT_PER_MINUTE: int = 20
    RATE_LIMIT_PER_DAY: int = 100
    

    ENABLE_AUTH: bool = True
    ENABLE_TEMPLATES: bool = True
    ENABLE_JOB_QUEUE: bool = True
    ENABLE_ANALYTICS: bool = True
    ENABLE_MARKETPLACE: bool = True
    

    FRONTEND_URL: str = "http://localhost:3000"
    
    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()