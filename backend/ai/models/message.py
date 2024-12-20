from enum import Enum
from typing import Optional, Dict, Any
from dataclasses import dataclass

class MessageType(str, Enum):
    USER_ANSWER = "user_answer"
    AGENT_TEACHING = "agent_teaching"
    AGENT_QUESTION = "agent_question"
    AGENT_EVALUATION = "agent_evaluation"
    AGENT_SUMMARY = "agent_summary"

@dataclass
class Message:
    id: str
    timestamp: int
    user_id: str
    type: MessageType
    content: str
    question_number: Optional[int] = None
    is_correct: Optional[bool] = None

@dataclass
class ChatResponse:
    message: Message
    metadata: Dict[str, Any]

@dataclass
class ErrorResponse:
    error: str
    code: str
    details: Optional[Dict[str, Any]] = None

@dataclass
class ChatHistoryResponse:
    messages: list['Message']
    metadata: Dict[str, Any]
