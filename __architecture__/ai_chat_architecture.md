# AI Chat System Architecture

## Overview

The AI chat system is built on top of Langchain to provide a flexible, model-agnostic framework for managing AI agents in our learning platform. All AI processing happens on the server side, with the frontend being responsible only for displaying chat messages and sending user inputs.

## Python Implementation

### 1. Directory Structure
```
backend/
  ├── ai/
  │   ├── __init__.py
  │   ├── agents/
  │   │   ├── __init__.py
  │   │   ├── base.py                        # Base agent class
  │   │   ├── agent_lesson_plan_creator.py   # Creates learning plans
  │   │   ├── agent_lesson_teacher.py        # Teaches lessons
  │   │   └── agent_lesson_evaluator.py      # Evaluates progress
  │   └── models/
  │       ├── __init__.py
  │       ├── message.py                     # Message type definitions
  │       └── responses.py                   # Standardized response types
  ├── config.py                              # Configuration management
  ├── middleware/
  │   └── error_handler.py                   # Error handling middleware
  ├── routes/
  │   └── chat.py                           # FastAPI chat endpoints
  ├── db/
  │   ├── database.py                        # Database connection
  │   ├── queries.py                         # SQL queries
  │   └── repository.py                      # Database repository
  └── utils/
      ├── agent_info.py                       # Agent info management
      └── helpers.py                         # Utility functions
```

### 2. Core Components

#### 2.1 Message Models (backend/ai/models/message.py)
```python
from enum import Enum
from pydantic import BaseModel
from datetime import datetime

class MessageType(str, Enum):
    AGENT_LESSON_GOAL = "agent_lesson_goal"
    AGENT_QUESTION = "agent_question"
    AGENT_TEACHING = "agent_teaching"
    USER_ANSWER = "user_answer"

class Message(BaseModel):
    id: str
    timestamp: int
    user_id: str
    type: MessageType
    content: str
    question_number: int | None = None
    is_correct: bool | None = None
```

#### 2.2 Response Types (backend/ai/models/responses.py)
```python
from pydantic import BaseModel
from typing import Optional, List
from .message import Message

class ChatResponse(BaseModel):
    message: Message
    metadata: Optional[dict] = None

class ErrorResponse(BaseModel):
    error: str
    code: str
    details: Optional[dict] = None

class ChatHistoryResponse(BaseModel):
    messages: List[Message]
    metadata: dict
```

#### 2.3 Error Handling (backend/ai/utils/errors.py)
```python
class ChatError(Exception):
    def __init__(self, message: str, code: str, details: dict = None):
        self.message = message
        self.code = code
        self.details = details
        super().__init__(self.message)

class TokenLimitError(ChatError):
    def __init__(self, message: str = "Token limit exceeded"):
        super().__init__(message, "TOKEN_LIMIT_EXCEEDED")

class InvalidMessageError(ChatError):
    def __init__(self, message: str = "Invalid message format"):
        super().__init__(message, "INVALID_MESSAGE")

class AgentError(ChatError):
    def __init__(self, message: str = "Agent processing error"):
        super().__init__(message, "AGENT_ERROR")
```

#### 2.4 Configuration Management (backend/ai/config.py)
```python
from pydantic import BaseSettings
from typing import Dict

class AIConfig(BaseSettings):
    OPENAI_API_KEY: str
    DEFAULT_MODEL: str = "gpt-4"
    MAX_TOKENS: int = 4000
    TEMPERATURE: float = 0.7
    
    # Agent-specific settings
    AGENT_CONFIGS: Dict[str, dict] = {
        "agent_lesson_teacher": {
            "model": "gpt-4",
            "temperature": 0.7,
            "streaming": True
        },
        "agent_lesson_plan_creator": {
            "model": "gpt-4",
            "temperature": 0.4,
            "streaming": False
        },
        "agent_lesson_evaluator": {
            "model": "gpt-4",
            "temperature": 0.3,
            "streaming": False
        }
    }
    
    class Config:
        env_file = ".env"
```

#### 2.5 Agent Info Management (backend/ai/utils/agent_info.py)
```python
from typing import Dict, Any
import json
from prisma.models import User

class AgentInfo:
    @staticmethod
    async def get_agent_info(agent_id: str) -> Dict[str, Any]:
        """Get agent info from database"""
        agent = await User.prisma().find_unique(
            where={'id': agent_id}
        )
        
        if not agent or agent.roles != 'role_agent':
            raise ValueError(f"Unknown agent ID: {agent_id}")
            
        # Parse the about JSON which contains the prompt
        about = json.loads(agent.about)
        
        return {
            'name': agent.name,
            'icon': agent.icon,
            'prompt': about.get('prompt', {})
        }
    
    @staticmethod
    async def get_agent_prompt(agent_id: str, prompt_type: str) -> str:
        """Get agent's prompt template from about field"""
        agent_info = await AgentInfo.get_agent_info(agent_id)
        prompt = agent_info.get('prompt', {})
        
        if prompt_type not in prompt:
            raise ValueError(f"No prompt found for agent {agent_id} and type {prompt_type}")
            
        return prompt[prompt_type]
    
    @staticmethod
    async def update_agent_info(agent_id: str, updates: Dict[str, Any]) -> None:
        """Update agent information in database"""
        agent = await User.prisma().find_unique(
            where={'id': agent_id}
        )
        
        if not agent:
            raise ValueError(f"Unknown agent ID: {agent_id}")
            
        current_about = json.loads(agent.about)
        
        # Update prompt if provided
        if 'prompt' in updates:
            current_about['prompt'] = updates['prompt']
        
        # Update agent
        await User.prisma().update(
            where={'id': agent_id},
            data={
                'name': updates.get('name', agent.name),
                'icon': updates.get('icon', agent.icon),
                'about': json.dumps(current_about)
            }
        )
```

#### 2.6 Base Agent (backend/ai/agents/base.py)
```python
from langchain.chat_models import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.prompts import ChatPromptTemplate
from langchain.chains import LLMChain
from prisma.models import User
from ..utils.agent_info import AgentInfo

class BaseQuizLearnAgent:
    async def __init__(self, model_name: str, user: User):
        self.user = user
        
        # Load agent info from database
        self.agent_info = await AgentInfo.get_agent_info(self.__class__.__name__.lower())
        
        # Use agent-specific configuration
        self.llm = ChatOpenAI(
            model_name=self.agent_info['config'].model,
            temperature=self.agent_info['config'].temperature
        )
        
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
        
        self.chain = await self._create_chain()
    
    async def get_prompt_template(self) -> str:
        """Get prompt template from database"""
        # Get base prompt
        base_prompt = await AgentInfo.get_agent_prompt(
            self.__class__.__name__.lower(), 
            'base'
        )
        
        # Get agent-specific prompt
        specific_prompt = await AgentInfo.get_agent_prompt(
            self.__class__.__name__.lower(), 
            self.get_prompt_type()
        )
        
        return base_prompt + specific_prompt
    
    def get_prompt_type(self) -> str:
        """Override to specify which prompt type to use"""
        raise NotImplementedError
```

#### 2.7 Lesson Plan Creator Agent (backend/ai/agents/agent_lesson_plan_creator.py)
```python
class AgentLessonPlanCreator(BaseQuizLearnAgent):
    """Creates structured lesson plans"""
    
    def get_prompt_type(self) -> str:
        return 'lesson_plan'
```

#### 2.8 Teacher Agent (backend/ai/agents/agent_lesson_teacher.py)
```python
class AgentLessonTeacher(BaseQuizLearnAgent):
    """Conducts interactive lessons"""
    
    def get_prompt_type(self) -> str:
        return 'teaching'
```

#### 2.9 Evaluator Agent (backend/ai/agents/agent_lesson_evaluator.py)
```python
class AgentLessonEvaluator(BaseQuizLearnAgent):
    """Evaluates learning progress"""
    
    def get_prompt_type(self) -> str:
        return 'evaluation'
```

### 3. API Endpoints (backend/routes/chat.py)

```python
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
from uuid import uuid4
import time
import json
from prisma.models import User
from ..ai.utils.errors import ChatError
from ..ai.models.responses import ChatResponse, ChatHistoryResponse
from ..ai.utils.helpers import sanitize_message_content, calculate_progress_metrics
from ..ai.config import AIConfig
from ..db.repository import AgentRepository, ChatRepository

router = APIRouter()
config = AIConfig()

@router.post("/lessons/{lesson_id}/agent-lesson-teacher", response_model=ChatResponse)
async def agent_lesson_teacher(
    lesson_id: str,
    message: str,
    user: User = Depends(get_current_user),
    agent_repo: AgentRepository = Depends(),
    chat_repo: ChatRepository = Depends()
) -> ChatResponse:
    try:
        # Sanitize input
        message = sanitize_message_content(message)
        
        # Get user topic lesson
        user_topic_lesson = await chat_repo.get_chat_history(user.id, lesson_id)
        
        # Create teacher agent with config
        agent_config = config.AGENT_CONFIGS["agent_lesson_teacher"]
        agent = AgentLessonTeacher(
            model_name=agent_config["model"],
            user=user
        )
        
        # Load chat history
        await agent.load_chat_history(user_topic_lesson)
        
        # Process message
        response = await agent.chain.apredict(
            input=message,
            lesson_title=user_topic_lesson.lesson.title,
            lesson_content=user_topic_lesson.lesson.content,
            current_question=user_topic_lesson.currentQuestion,
            questions_total=user_topic_lesson.questionsTotal,
            questions_correct=user_topic_lesson.questionsCorrect
        )
        
        # Create and save message
        new_message = Message(
            id=f"msg_{uuid4()}",
            timestamp=int(time.time()),
            user_id="agent_lesson_teacher",
            type=MessageType.AGENT_TEACHING,
            content=response
        )
        await agent.save_message(user_topic_lesson, new_message)
        
        # Calculate progress metrics
        metrics = calculate_progress_metrics(
            json.loads(user_topic_lesson.chat_history)["messages"]
        )
        
        return ChatResponse(
            message=new_message,
            metadata={"progress_metrics": metrics}
        )
        
    except ChatError as e:
        raise e
    except Exception as e:
        raise ChatError(str(e), "UNEXPECTED_ERROR", {"original_error": str(e)})

@router.get("/lessons/{lesson_id}/chat-history", response_model=ChatHistoryResponse)
async def get_chat_history(
    lesson_id: str,
    user: User = Depends(get_current_user),
    chat_repo: ChatRepository = Depends()
) -> ChatHistoryResponse:
    """Get chat history with progress metrics"""
    user_topic_lesson = await chat_repo.get_chat_history(user.id, lesson_id)
    
    if not user_topic_lesson.chat_history:
        return ChatHistoryResponse(
            messages=[],
            metadata={"progress_metrics": calculate_progress_metrics([])}
        )
    
    history = json.loads(user_topic_lesson.chat_history)
    metrics = calculate_progress_metrics(history["messages"])
    
    return ChatHistoryResponse(
        messages=history["messages"],
        metadata={"progress_metrics": metrics}
    )

@router.post("/lessons/{lesson_id}/agent-lesson-plan-creator", response_model=ChatResponse)
async def agent_lesson_plan_creator(
    lesson_id: str,
    message: str,
    user: User = Depends(get_current_user),
    agent_repo: AgentRepository = Depends(),
    chat_repo: ChatRepository = Depends()
) -> ChatResponse:
    try:
        # Sanitize input
        message = sanitize_message_content(message)
        
        # Get user topic lesson and topic
        user_topic_lesson = await chat_repo.get_chat_history(user.id, lesson_id)
        topic = await get_topic(user_topic_lesson.topic_id)
        
        # Create plan creator agent with config
        agent_config = config.AGENT_CONFIGS["agent_lesson_plan_creator"]
        agent = AgentLessonPlanCreator(
            model_name=agent_config["model"],
            user=user
        )
        
        # Load chat history
        await agent.load_chat_history(user_topic_lesson)
        
        # Process message
        response = await agent.chain.apredict(
            input=message,
            topic_title=topic.title,
            topic_description=topic.description,
            topic_objectives=topic.objectives,
            progress_summary=user_topic_lesson.progressSummary
        )
        
        # Create and save message
        new_message = Message(
            id=f"msg_{uuid4()}",
            timestamp=int(time.time()),
            user_id="agent_lesson_plan_creator",
            type=MessageType.AGENT_TEACHING,
            content=response
        )
        await agent.save_message(user_topic_lesson, new_message)
        
        # Calculate progress metrics
        metrics = calculate_progress_metrics(
            json.loads(user_topic_lesson.chat_history)["messages"]
        )
        
        return ChatResponse(
            message=new_message,
            metadata={"progress_metrics": metrics}
        )
        
    except ChatError as e:
        raise e
    except Exception as e:
        raise ChatError(str(e), "UNEXPECTED_ERROR", {"original_error": str(e)})

@router.post("/lessons/{lesson_id}/agent-lesson-evaluator", response_model=ChatResponse)
async def agent_lesson_evaluator(
    lesson_id: str,
    message: str,
    user: User = Depends(get_current_user),
    agent_repo: AgentRepository = Depends(),
    chat_repo: ChatRepository = Depends()
) -> ChatResponse:
    try:
        # Sanitize input
        message = sanitize_message_content(message)
        
        # Get user topic lesson
        user_topic_lesson = await chat_repo.get_chat_history(user.id, lesson_id)
        
        # Create evaluator agent with config
        agent_config = config.AGENT_CONFIGS["agent_lesson_evaluator"]
        agent = AgentLessonEvaluator(
            model_name=agent_config["model"],
            user=user
        )
        
        # Load chat history
        await agent.load_chat_history(user_topic_lesson)
        
        # Process message
        response = await agent.chain.apredict(
            input=message,
            lesson_title=user_topic_lesson.lesson.title,
            lesson_objectives=user_topic_lesson.lesson.objectives,
            lesson_content=user_topic_lesson.lesson.content,
            questions_total=user_topic_lesson.questionsTotal,
            questions_correct=user_topic_lesson.questionsCorrect,
            progress_summary=user_topic_lesson.progressSummary
        )
        
        # Create and save message
        new_message = Message(
            id=f"msg_{uuid4()}",
            timestamp=int(time.time()),
            user_id="agent_lesson_evaluator",
            type=MessageType.AGENT_TEACHING,
            content=response
        )
        await agent.save_message(user_topic_lesson, new_message)
        
        # Calculate progress metrics
        metrics = calculate_progress_metrics(
            json.loads(user_topic_lesson.chat_history)["messages"]
        )
        
        return ChatResponse(
            message=new_message,
            metadata={"progress_metrics": metrics}
        )
        
    except ChatError as e:
        raise e
    except Exception as e:
        raise ChatError(str(e), "UNEXPECTED_ERROR", {"original_error": str(e)})

@router.put("/agents/{agent_id}", response_model=Dict[str, Any])
async def update_agent(
    agent_id: str,
    updates: Dict[str, Any],
    user: User = Depends(get_current_user),
    agent_repo: AgentRepository = Depends()
) -> Dict[str, Any]:
    """Update agent information and prompts"""
    # Check permissions
    if user.roles != 'role_admin':
        raise HTTPException(status_code=403, detail="Not authorized")
        
    try:
        await agent_repo.update_agent(agent_id, updates)
        return await agent_repo.get_agent_info(agent_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/agents/{agent_id}", response_model=Dict[str, Any])
async def get_agent(
    agent_id: str,
    user: User = Depends(get_current_user),
    agent_repo: AgentRepository = Depends()
) -> Dict[str, Any]:
    """Get agent information and prompts"""
    try:
        return await agent_repo.get_agent_info(agent_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

## Implementation Phases

### Phase 1: Basic Chat (Current)
- Implement Message models and response types
- Create BaseQuizLearnAgent with chat history integration
- Set up teacher endpoint with error handling
- Add configuration management
- Test basic conversations

### Phase 2: Enhanced Features (Next)
- Implement lesson plan creation
- Add progress evaluation
- Support question tracking
- Add streaming responses
- Add progress metrics calculation
- Implement proper error handling

### Phase 3: Advanced Features (Future)
- Add conversation summarization
- Implement difficulty adaptation
- Add response caching
- Add usage analytics
- Add conversation backups
- Implement rate limiting

### Phase 4: Optimization (Future)
- Optimize token usage
- Add performance monitoring
- Implement error handling
- Add fallback strategies
- Implement load balancing
- Add response caching

## Testing Strategy

### 1. Unit Tests
- Test message formatting and validation
- Test progress metrics calculation
- Test error handling
- Test configuration loading

### 2. Integration Tests
- Test agent interactions
- Test chat history management
- Test database operations
- Test API endpoints

### 3. Load Tests
- Test concurrent users
- Test response times
- Test memory usage
- Test token limits

## Monitoring and Analytics

### 1. Performance Metrics
- Response times
- Token usage
- Memory usage
- Error rates

### 2. User Metrics
- Session duration
- Questions answered
- Learning progress
- User engagement

### 3. System Health
- API availability
- Database performance
- Cache hit rates
- Error distribution

## Security Considerations

### 1. Data Protection
- Encrypt sensitive data
- Implement proper authentication
- Use secure connections
- Regular security audits

### 2. Rate Limiting
- Implement per-user limits
- Add API throttling
- Monitor for abuse
- Set token budgets

### 3. Error Handling
- Sanitize error messages
- Log security events
- Implement proper validation
- Handle timeouts gracefully

## Database Access Layer

### Database Connection (backend/db/database.py)
```python
from libsql_client import AsyncClient
import json
from typing import Optional, Dict, Any
import os

DATABASE_URL = os.getenv("DATABASE_URL", "file:///backend/data/db/quizlearn.db")
TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN")  # Only needed for remote Turso DB

async def get_db():
    client = AsyncClient(url=DATABASE_URL, auth_token=TURSO_AUTH_TOKEN)
    try:
        yield client
    finally:
        await client.close()
```

### Database Queries (backend/db/queries.py)
```python
class Queries:
    # User and Authentication
    GET_USER_BY_EMAIL = """
        SELECT id, email, name, password_hash, roles, default_difficulty, about
        FROM user
        WHERE email = ?
    """
    
    CREATE_USER = """
        INSERT INTO user (id, email, name, password_hash, roles, default_difficulty, about)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        RETURNING id
    """
    
    UPDATE_USER = """
        UPDATE user
        SET name = COALESCE(?, name),
            default_difficulty = COALESCE(?, default_difficulty),
            about = COALESCE(?, about),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        RETURNING id
    """
    
    # Topic Management
    GET_TOPIC = """
        SELECT t.*, 
               json_group_array(DISTINCT l.id) as lesson_ids,
               json_group_array(DISTINCT l.title) as lesson_titles
        FROM topic t
        LEFT JOIN lesson l ON l.topic_id = t.id
        WHERE t.id = ?
        GROUP BY t.id
    """
    
    GET_USER_TOPICS = """
        SELECT t.*,
               COUNT(DISTINCT l.id) as total_lessons,
               COUNT(DISTINCT utl.id) as completed_lessons,
               COALESCE(AVG(utl.questions_correct * 100.0 / NULLIF(utl.questions_total, 0)), 0) as avg_score
        FROM topic t
        LEFT JOIN lesson l ON l.topic_id = t.id
        LEFT JOIN user_topic_lesson utl ON utl.topic_id = t.id AND utl.user_id = ?
        GROUP BY t.id
        ORDER BY t.created_at DESC
    """
    
    CREATE_TOPIC = """
        INSERT INTO topic (id, title, description, difficulty, prerequisites)
        VALUES (?, ?, ?, ?, ?)
        RETURNING id
    """
    
    # Lesson Management
    GET_LESSON = """
        SELECT l.*,
               t.title as topic_title,
               t.description as topic_description,
               t.difficulty as topic_difficulty
        FROM lesson l
        JOIN topic t ON t.id = l.topic_id
        WHERE l.id = ?
    """
    
    CREATE_LESSON = """
        INSERT INTO lesson (id, topic_id, title, content, order_index)
        VALUES (?, ?, ?, ?, ?)
        RETURNING id
    """
    
    # User Progress
    GET_USER_PROGRESS = """
        SELECT t.id as topic_id,
               t.title as topic_title,
               COUNT(DISTINCT l.id) as total_lessons,
               COUNT(DISTINCT utl.id) as completed_lessons,
               SUM(utl.questions_total) as total_questions,
               SUM(utl.questions_correct) as correct_questions,
               MAX(utl.updated_at) as last_activity
        FROM topic t
        LEFT JOIN lesson l ON l.topic_id = t.id
        LEFT JOIN user_topic_lesson utl ON utl.topic_id = t.id AND utl.user_id = ?
        WHERE t.id IN (
            SELECT DISTINCT topic_id 
            FROM user_topic_lesson 
            WHERE user_id = ?
        )
        GROUP BY t.id
        ORDER BY last_activity DESC
    """
    
    # Agent Management
    GET_AGENT = """
        SELECT id, name, icon, about
        FROM user
        WHERE id = ? AND roles = 'role_agent'
    """
    
    UPDATE_AGENT = """
        UPDATE user
        SET name = COALESCE(?, name),
            icon = COALESCE(?, icon),
            about = COALESCE(?, about),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND roles = 'role_agent'
        RETURNING id, name, icon, about
    """
    
    # Chat and Lesson Progress
    GET_USER_TOPIC_LESSON = """
        SELECT utl.*,
               t.title as topic_title,
               t.description as topic_description,
               l.title as lesson_title,
               l.content as lesson_content
        FROM user_topic_lesson utl
        JOIN topic t ON t.id = utl.topic_id
        JOIN lesson l ON l.topic_id = t.id
        WHERE utl.user_id = ? AND utl.topic_id = ?
    """
    
    CREATE_USER_TOPIC_LESSON = """
        INSERT INTO user_topic_lesson (id, user_id, topic_id, questions_total, questions_correct, chat_history)
        VALUES (?, ?, ?, 0, 0, '{"messages":[]}')
        ON CONFLICT (user_id, topic_id) DO NOTHING
        RETURNING id
    """
    
    UPDATE_CHAT_HISTORY = """
        UPDATE user_topic_lesson
        SET chat_history = ?,
            questions_total = ?,
            questions_correct = ?,
            progress_summary = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND topic_id = ?
    """
    
    # Analytics
    GET_USER_ANALYTICS = """
        SELECT 
            COUNT(DISTINCT t.id) as total_topics,
            COUNT(DISTINCT utl.topic_id) as started_topics,
            SUM(utl.questions_total) as total_questions,
            SUM(utl.questions_correct) as correct_questions,
            AVG(CASE WHEN utl.questions_total > 0 
                THEN utl.questions_correct * 100.0 / utl.questions_total 
                ELSE 0 END) as avg_score,
            MAX(utl.updated_at) as last_activity
        FROM user u
        LEFT JOIN user_topic_lesson utl ON utl.user_id = u.id
        LEFT JOIN topic t ON t.id = utl.topic_id
        WHERE u.id = ?
        GROUP BY u.id
    """

# Example usage in repository:
class ProgressRepository:
    def __init__(self, db: AsyncClient = Depends(get_db)):
        self.db = db
    
    async def get_user_progress(self, user_id: str) -> Dict[str, Any]:
        """Get user's overall progress across all topics"""
        result = await self.db.execute(Queries.GET_USER_ANALYTICS, [user_id])
        analytics = result.rows[0] if result.rows else None
        
        if not analytics:
            return {
                'total_topics': 0,
                'started_topics': 0,
                'total_questions': 0,
                'correct_questions': 0,
                'avg_score': 0,
                'last_activity': None
            }
            
        return {
            'total_topics': analytics[0],
            'started_topics': analytics[1],
            'total_questions': analytics[2],
            'correct_questions': analytics[3],
            'avg_score': round(analytics[4], 2),
            'last_activity': analytics[5]
        }
    
    async def get_topic_progress(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's progress for each topic they've started"""
        result = await self.db.execute(Queries.GET_USER_PROGRESS, [user_id, user_id])
        return [
            {
                'topic_id': row[0],
                'topic_title': row[1],
                'total_lessons': row[2],
                'completed_lessons': row[3],
                'total_questions': row[4],
                'correct_questions': row[5],
                'last_activity': row[6],
                'completion_rate': round(row[3] * 100 / row[2], 2) if row[2] > 0 else 0,
                'accuracy': round(row[5] * 100 / row[4], 2) if row[4] > 0 else 0
            }
            for row in result.rows
        ]

### Database Indexes

```sql
-- User table indexes
CREATE INDEX IF NOT EXISTS idx_user_email ON user(email);
CREATE INDEX IF NOT EXISTS idx_user_roles ON user(roles);

-- Topic and Lesson indexes
CREATE INDEX IF NOT EXISTS idx_lesson_topic ON lesson(topic_id);
CREATE INDEX IF NOT EXISTS idx_lesson_order ON lesson(topic_id, order_index);

-- User Progress indexes
CREATE INDEX IF NOT EXISTS idx_user_topic_lesson_user ON user_topic_lesson(user_id);
CREATE INDEX IF NOT EXISTS idx_user_topic_lesson_topic ON user_topic_lesson(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_topic_lesson_composite ON user_topic_lesson(user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_user_topic_lesson_updated ON user_topic_lesson(updated_at);
```

### Project Dependencies
```toml
# pyproject.toml
[tool.poetry.dependencies]
python = "^3.9"
fastapi = "^0.104.1"
libsql-client = "^0.3.1"  # For Turso/libSQL support
pydantic = "^2.5.2"
langchain = "^0.0.350"
openai = "^1.3.7"
python-jose = {extras = ["cryptography"], version = "^3.3.0"}
passlib = {extras = ["bcrypt"], version = "^1.7.4"}
python-multipart = "^0.0.6"
```

### Error Handling
```python
# backend/core/exceptions.py
from fastapi import HTTPException, status

class DatabaseError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {detail}"
        )

# backend/middleware/error_handler.py
from fastapi import Request
from fastapi.responses import JSONResponse
from sqlite3 import Error as SQLiteError
from ..core.exceptions import DatabaseError

async def error_handler(request: Request, call_next):
    try:
        return await call_next(request)
    except SQLiteError as e:
        return JSONResponse(
            status_code=500,
            content={"detail": f"Database error: {str(e)}"}
        )
    except DatabaseError as e:
        return JSONResponse(
            status_code=e.status_code,
            content={"detail": e.detail}
        )
