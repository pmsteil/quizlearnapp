from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, model_validator, field_validator

class MessageType(str, Enum):
    USER_ANSWER = "user_answer"
    AGENT_TEACHING = "agent_teaching"
    AGENT_QUESTION = "agent_question"
    AGENT_EVALUATION = "agent_evaluation"
    AGENT_SUMMARY = "agent_summary"

class Message(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        extra='forbid',
        from_attributes=True,
        arbitrary_types_allowed=True
    )

    id: str = Field(alias='message_id')
    timestamp: int = Field(alias='message_timestamp')
    user_id: str = Field(alias='message_user_id')
    type: MessageType = Field(alias='message_type')
    content: str = Field(alias='message_content')
    question_number: Optional[int] = Field(default=None, alias='message_question_number')
    is_correct: Optional[bool] = Field(default=None, alias='message_is_correct')

    @field_validator('id', 'timestamp', 'user_id', 'type', 'content', 'question_number', 'is_correct', mode='before')
    @classmethod
    def remove_leading_underscore(cls, v):
        # Remove any leading underscores from keys
        if isinstance(v, dict):
            return {k.lstrip('_'): val for k, val in v.items()}
        return v

class ChatResponse(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        extra='forbid',
        from_attributes=True,
        arbitrary_types_allowed=True
    )

    message: Message
    metadata: Dict[str, Any]

class ErrorResponse(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        extra='forbid',
        from_attributes=True,
        arbitrary_types_allowed=True
    )

    error: str
    code: str
    details: Optional[Dict[str, Any]] = None

class ChatHistoryResponse(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        extra='forbid',
        from_attributes=True,
        arbitrary_types_allowed=True
    )

    messages: list[Message]
    metadata: Dict[str, Any]
