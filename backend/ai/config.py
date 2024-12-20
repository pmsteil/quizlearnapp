from pydantic_settings import BaseSettings
from typing import Dict

class AIConfig(BaseSettings):
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4"
    MAX_TOKENS: int = 4000
    TEMPERATURE: float = 0.7

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

    class Config:
        env_file = ".env"
