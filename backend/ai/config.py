from pydantic_settings import BaseSettings
from typing import Dict
import os
from pydantic import BaseModel

class AIConfig(BaseSettings):
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4-1106-preview")
    DATABASE_PATH: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "db", "quizlearn.db")
    MAX_TOKENS: int = 4000
    TEMPERATURE: float = 0.7
    JWT_SECRET: str = os.getenv("JWT_SECRET", "test_secret_key")

    # Agent-specific settings
    AGENT_CONFIGS: Dict[str, dict] = {
        "agent_lesson_teacher": {
            "model": None,  # Will use OPENAI_MODEL
            "temperature": 0.7,
            "streaming": True,
            "max_tokens": 4000
        },
        "agent_lesson_plan_creator": {
            "model": None,  # Will use OPENAI_MODEL
            "temperature": 0.4,
            "streaming": False,
            "max_tokens": 4000
        },
        "agent_lesson_evaluator": {
            "model": None,  # Will use OPENAI_MODEL
            "temperature": 0.3,
            "streaming": False,
            "max_tokens": 4000
        }
    }

    model_config = {
        "env_file": ".env"
    }
