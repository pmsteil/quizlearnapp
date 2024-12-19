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
  │       └── message.py                     # Message type definitions
  └── routes/
      └── chat.py                           # FastAPI chat endpoints
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

#### 2.2 Base Agent (backend/ai/agents/base.py)
```python
from langchain.chat_models import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.prompts import ChatPromptTemplate
from langchain.chains import LLMChain
from prisma.models import User

class BaseQuizLearnAgent:
    def __init__(self, model_name: str, user: User):
        self.llm = ChatOpenAI(model_name=model_name)
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
        self.user = user  # Store entire user object for access to all user data
        self.chain = self._create_chain()
        
    async def load_chat_history(self, user_topic_lesson: UserTopicLesson):
        """Load chat history from database into memory"""
        if user_topic_lesson.chat_history:
            history = json.loads(user_topic_lesson.chat_history)
            for msg in history["messages"]:
                self.memory.chat_memory.add_message(Message(**msg))
                
    async def save_message(self, user_topic_lesson: UserTopicLesson, message: Message):
        """Save new message to database"""
        history = json.loads(user_topic_lesson.chat_history or '{"messages": []}')
        history["messages"].append(message.dict())
        user_topic_lesson.chat_history = json.dumps(history)
        await user_topic_lesson.save()

    def _create_chain(self) -> LLMChain:
        """Create the conversation chain with appropriate prompt"""
        prompt = ChatPromptTemplate.from_template(
            self.get_prompt_template()
        )
        return LLMChain(
            llm=self.llm,
            prompt=prompt,
            memory=self.memory
        )
```

#### 2.3 Lesson Plan Creator Agent (backend/ai/agents/agent_lesson_plan_creator.py)
```python
class AgentLessonPlanCreator(BaseQuizLearnAgent):
    """Creates structured lesson plans"""
    
    def get_prompt_template(self) -> str:
        return """You are an expert curriculum designer creating a personalized lesson plan.

        Topic Information:
        Title: {topic_title}
        Description: {topic_description}
        Learning Objectives: {topic_objectives}

        User Information:
        Difficulty Level: {user_difficulty}
        About User: {user_about}
        Previous Progress: {progress_summary}

        Previous Messages: {chat_history}

        Create a structured lesson plan that:
        1. Breaks down complex concepts into manageable chunks
        2. Includes practice exercises and assessments
        3. Adapts to the user's level and background
        4. Aligns with the learning objectives

        Human: {input}
        Assistant: Let me help you create an effective lesson plan.
        """
```

#### 2.4 Teacher Agent (backend/ai/agents/agent_lesson_teacher.py)
```python
class AgentLessonTeacher(BaseQuizLearnAgent):
    """Conducts interactive lessons"""
    
    def get_prompt_template(self) -> str:
        return """You are an expert teacher conducting an interactive lesson.

        Lesson Information:
        Title: {lesson_title}
        Content: {lesson_content}
        Current Question: {current_question}

        User Information:
        Difficulty Level: {user_difficulty}
        About User: {user_about}
        Questions Asked: {questions_total}
        Questions Correct: {questions_correct}

        Previous Messages: {chat_history}

        Remember to:
        1. Use markdown formatting for content
        2. For questions, use type: agent_question
        3. For teaching responses, use type: agent_teaching
        4. Include question_number for all questions
        5. Track if answers are correct
        6. Adapt explanations to user's background

        Human: {input}
        Assistant: Let me help you understand this concept.
        """
```

#### 2.5 Evaluator Agent (backend/ai/agents/agent_lesson_evaluator.py)
```python
class AgentLessonEvaluator(BaseQuizLearnAgent):
    """Evaluates learning progress"""
    
    def get_prompt_template(self) -> str:
        return """You are an expert in educational assessment evaluating learning progress.

        Lesson Information:
        Title: {lesson_title}
        Objectives: {lesson_objectives}
        Content Covered: {lesson_content}

        User Information:
        Difficulty Level: {user_difficulty}
        About User: {user_about}
        Questions Asked: {questions_total}
        Questions Correct: {questions_correct}

        Previous Messages: {chat_history}
        Progress Summary: {progress_summary}

        Provide assessment that:
        1. Evaluates understanding of key concepts
        2. Identifies areas for improvement
        3. Suggests next steps
        4. Considers user's background and goals

        Human: {input}
        Assistant: Let me assess your understanding.
        """
```

### 3. API Endpoints (backend/routes/chat.py)

```python
from fastapi import APIRouter, Depends
from typing import Dict
from uuid import uuid4
import time
import json
from prisma.models import User

router = APIRouter()

@router.post("/lessons/{lesson_id}/agent-lesson-plan-creator")
async def agent_lesson_plan_creator(
    lesson_id: str,
    message: str,
    user: User = Depends(get_current_user)
) -> Dict:
    # Get user topic lesson and topic
    user_topic_lesson = await get_user_topic_lesson(user.id, lesson_id)
    topic = await get_topic(user_topic_lesson.topic_id)
    
    # Create plan creator agent
    agent = AgentLessonPlanCreator(
        model_name="gpt-4",
        user=user  # Pass entire user object
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
    
    return {"message": new_message.dict()}

@router.post("/lessons/{lesson_id}/agent-lesson-teacher")
async def agent_lesson_teacher(
    lesson_id: str,
    message: str,
    user: User = Depends(get_current_user)
) -> Dict:
    # Get user topic lesson
    user_topic_lesson = await get_user_topic_lesson(user.id, lesson_id)
    
    # Create teacher agent
    agent = AgentLessonTeacher(
        model_name="gpt-4",
        user=user  # Pass entire user object
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
    
    return {"message": new_message.dict()}

@router.post("/lessons/{lesson_id}/agent-lesson-evaluator")
async def agent_lesson_evaluator(
    lesson_id: str,
    message: str,
    user: User = Depends(get_current_user)
) -> Dict:
    # Get user topic lesson
    user_topic_lesson = await get_user_topic_lesson(user.id, lesson_id)
    
    # Create evaluator agent
    agent = AgentLessonEvaluator(
        model_name="gpt-4",
        user=user  # Pass entire user object
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
    
    return {"message": new_message.dict()}
```

## Implementation Phases

### Phase 1: Basic Chat
- Implement Message models
- Create BaseQuizLearnAgent with chat history integration
- Set up teacher endpoint
- Test with basic conversations

### Phase 2: Enhanced Features
- Implement lesson plan creation
- Add progress evaluation
- Support question tracking
- Add streaming responses

### Phase 3: Advanced Features
- Add conversation summarization
- Implement difficulty adaptation
- Add response caching
- Add usage analytics

### Phase 4: Optimization
- Optimize token usage
- Add performance monitoring
- Implement error handling
- Add fallback strategies
