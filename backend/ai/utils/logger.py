import logging
from datetime import datetime
from typing import Any, Dict, Optional
import json
import os

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

class AILogger:
    def __init__(self, name: str = "ai"):
        self.logger = logging.getLogger(name)
        
        # Ensure logs directory exists
        os.makedirs("logs", exist_ok=True)
        
        # Add file handler for errors
        error_handler = logging.FileHandler("logs/ai_errors.log")
        error_handler.setLevel(logging.ERROR)
        self.logger.addHandler(error_handler)
        
        # Add file handler for all AI interactions
        ai_handler = logging.FileHandler("logs/ai_interactions.log")
        ai_handler.setLevel(logging.INFO)
        self.logger.addHandler(ai_handler)
    
    def log_interaction(
        self,
        agent_id: str,
        user_id: str,
        message_type: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Log an AI interaction"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "agent_id": agent_id,
            "user_id": user_id,
            "type": message_type,
            "content": content,
            "metadata": metadata or {}
        }
        self.logger.info(json.dumps(log_entry))
    
    def log_error(
        self,
        error: Exception,
        agent_id: Optional[str] = None,
        user_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        """Log an error with context"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "error_type": type(error).__name__,
            "error_message": str(error),
            "agent_id": agent_id,
            "user_id": user_id,
            "context": context or {}
        }
        self.logger.error(json.dumps(log_entry))

# Global logger instance
ai_logger = AILogger()
