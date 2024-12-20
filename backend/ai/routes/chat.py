from typing import Dict, Any
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from libsql_client import Client

from ..config import AIConfig
from ..middleware.auth import get_current_user
from ..middleware.rate_limit import check_rate_limit
from ..utils.context import ContextLoader
from ..utils.logger import ai_logger
from ..utils.errors import AgentError
from ..utils.sanitizer import MessageSanitizer
from ..utils.metrics import ProgressMetrics

from ..models.message import Message, MessageType
from ..agents.agent_lesson_teacher import LessonTeacherAgent
from ..agents.agent_lesson_plan_creator import LessonPlanCreatorAgent
from ..agents.agent_lesson_evaluator import LessonEvaluatorAgent

router = APIRouter()

# Dependency to get database client
def get_db() -> Client:
    db = Client(
        url="file:backend/data/db/quizlearn.db",
        auth_token=None
    )
    return db

async def process_chat_request(
    agent_id: str, 
    request: Request, 
    config: AIConfig, 
    db: Client, 
    current_user: str
) -> JSONResponse:
    """Generic handler for all chat-related requests"""
    try:
        # Get form data
        form_data_raw = await request.form()
        
        # Convert form data to use correct keys
        form_data = {
            'message_id': form_data_raw.get('messageId'),
            'message_timestamp': form_data_raw.get('messageTimestamp'),
            'message_user_id': form_data_raw.get('messageUserId'),
            'message_type': form_data_raw.get('messageType'),
            'message_content': form_data_raw.get('messageContent'),
            'message_question_number': form_data_raw.get('messageQuestionNumber'),
            'message_is_correct': form_data_raw.get('messageIsCorrect'),
            'lesson_id': form_data_raw.get('lessonId'),
            'topic_id': form_data_raw.get('topicId'),
            'answer_id': form_data_raw.get('answerId'),
            'answer_timestamp': form_data_raw.get('answerTimestamp'),
            'answer_user_id': form_data_raw.get('answerUserId'),
            'answer_content': form_data_raw.get('answerContent'),
            'question_id': form_data_raw.get('questionId')
        }
        
        # Remove None values
        form_data = {k: v for k, v in form_data.items() if v is not None}
        
        # Validate agent
        agent_map = {
            "agent_lesson_teacher": LessonTeacherAgent,
            "agent_lesson_plan_creator": LessonPlanCreatorAgent,
            "agent_lesson_evaluator": LessonEvaluatorAgent
        }
        
        if agent_id not in agent_map:
            return JSONResponse(status_code=404, content={"detail": f"Agent {agent_id} not found"})
        
        # Check rate limit
        await check_rate_limit(None, current_user)
        
        # Determine route based on request path
        route_handlers = {
            "/chat/{agent_id}": handle_chat,
            "/chat/{agent_id}/question": handle_question,
            "/chat/{agent_id}/evaluate/{lesson_id}": handle_evaluate_answer,
            "/chat/{agent_id}/plan": handle_lesson_plan,
            "/chat/{agent_id}/evaluate_lesson": handle_evaluate_lesson,
            "/chat/{agent_id}/analyze_progress": handle_analyze_progress,
            "/chat/{agent_id}/summarize": handle_summarize_lesson
        }
        
        # Get the current route handler
        handler = route_handlers.get(request.url.path)
        if not handler:
            return JSONResponse(status_code=400, content={"detail": "Invalid route"})
        
        # Process the request
        return await handler(agent_id, form_data, config, db, current_user)
    
    except Exception as e:
        ai_logger.log_error(
            error=e,
            agent_id=agent_id,
            user_id=current_user,
            context=dict(form_data_raw)
        )
        return JSONResponse(status_code=500, content={"detail": str(e)})

async def handle_chat(
    agent_id: str, 
    form_data: Dict[str, Any], 
    config: AIConfig, 
    db: Client, 
    current_user: str
) -> JSONResponse:
    """Handle chat request"""
    # Extract required fields
    required_fields = ['message_id', 'message_timestamp', 'message_user_id', 'message_type', 'message_content']
    for field in required_fields:
        if not form_data.get(field):
            return JSONResponse(status_code=400, content={"detail": f"Missing {field}"})
    
    # Create message object
    message = Message(
        id=form_data.get('message_id'),
        timestamp=int(form_data.get('message_timestamp')),
        user_id=form_data.get('message_user_id'),
        type=MessageType(form_data.get('message_type')),
        content=form_data.get('message_content'),
        question_number=int(form_data.get('message_question_number')) if form_data.get('message_question_number') else None,
        is_correct=bool(form_data.get('message_is_correct')) if form_data.get('message_is_correct') else None
    )
    
    # Initialize agent
    agent = LessonTeacherAgent(agent_id, config) if agent_id == "agent_lesson_teacher" else \
             LessonPlanCreatorAgent(agent_id, config) if agent_id == "agent_lesson_plan_creator" else \
             LessonEvaluatorAgent(agent_id, config)
    
    # Initialize context loader
    context_loader = ContextLoader(db)
    
    # Load context
    context = await context_loader.load_full_context(
        user_id=current_user,
        lesson_id=form_data.get('lesson_id'),
        topic_id=form_data.get('topic_id')
    )
    
    # Process message
    response = await agent.process_message(message, context)
    
    # Log interaction
    ai_logger.log_interaction(
        agent_id=agent_id,
        user_id=current_user,
        message_type="chat",
        content=message.content,
        metadata={
            "lesson_id": form_data.get('lesson_id'),
            "topic_id": form_data.get('topic_id'),
            "response": response.dict()
        }
    )
    
    return JSONResponse(content=response.dict())

async def handle_question(
    agent_id: str, 
    form_data: Dict[str, Any], 
    config: AIConfig, 
    db: Client, 
    current_user: str
) -> JSONResponse:
    """Handle question request"""
    # Extract required fields
    required_fields = ['lesson_id', 'user_id']
    for field in required_fields:
        if not form_data.get(field):
            return JSONResponse(status_code=400, content={"detail": f"Missing {field}"})
    
    # Initialize agent
    agent = LessonTeacherAgent(agent_id, config) if agent_id == "agent_lesson_teacher" else \
             LessonPlanCreatorAgent(agent_id, config) if agent_id == "agent_lesson_plan_creator" else \
             LessonEvaluatorAgent(agent_id, config)
    
    # Initialize context loader
    context_loader = ContextLoader(db)
    
    # Load context
    context = await context_loader.load_full_context(
        user_id=current_user,
        lesson_id=form_data.get('lesson_id')
    )
    
    # Get question
    response = await agent.get_question(context)
    
    # Log interaction
    ai_logger.log_interaction(
        agent_id=agent_id,
        user_id=current_user,
        message_type="question_generation",
        content=str(response),
        metadata={
            "lesson_id": form_data.get('lesson_id')
        }
    )
    
    return JSONResponse(content=response.dict())

async def handle_evaluate_answer(
    agent_id: str, 
    form_data: Dict[str, Any], 
    config: AIConfig, 
    db: Client, 
    current_user: str
) -> JSONResponse:
    """Handle evaluate answer request"""
    # Extract required fields
    required_fields = ['answer_id', 'answer_timestamp', 'answer_user_id', 'answer_content', 'question_id', 'lesson_id']
    for field in required_fields:
        if not form_data.get(field):
            return JSONResponse(status_code=400, content={"detail": f"Missing {field}"})
    
    # Create message object
    answer_message = Message(
        id=form_data.get('answer_id'),
        timestamp=int(form_data.get('answer_timestamp')),
        user_id=form_data.get('answer_user_id'),
        type=MessageType.USER_ANSWER,
        content=form_data.get('answer_content')
    )
    
    # Initialize agent
    agent = LessonTeacherAgent(agent_id, config) if agent_id == "agent_lesson_teacher" else \
             LessonPlanCreatorAgent(agent_id, config) if agent_id == "agent_lesson_plan_creator" else \
             LessonEvaluatorAgent(agent_id, config)
    
    # Initialize context loader
    context_loader = ContextLoader(db)
    
    # Load context
    context = await context_loader.load_full_context(
        user_id=current_user,
        lesson_id=form_data.get('lesson_id')
    )
    
    # Evaluate answer
    evaluation_result = await agent.evaluate_answer(
        answer=answer_message, 
        context=context,
        question_id=form_data.get('question_id')
    )
    
    # Update progress metrics
    chat_history = await ProgressMetrics.get_user_progress(db, current_user, form_data.get('lesson_id'))
    metrics = ProgressMetrics.calculate_metrics(chat_history["chat_history"])
    await ProgressMetrics.update_progress(db, current_user, form_data.get('lesson_id'), metrics)
    
    # Log interaction
    ai_logger.log_interaction(
        agent_id=agent_id,
        user_id=current_user,
        message_type="answer_evaluation",
        content=answer_message.content,
        metadata={
            "lesson_id": form_data.get('lesson_id'),
            "question_id": form_data.get('question_id'),
            "evaluation_result": evaluation_result.dict()
        }
    )
    
    return JSONResponse(content=evaluation_result.dict())

async def handle_lesson_plan(
    agent_id: str, 
    form_data: Dict[str, Any], 
    config: AIConfig, 
    db: Client, 
    current_user: str
) -> JSONResponse:
    """Handle lesson plan request"""
    # Extract required fields
    required_fields = ['topic_id', 'lesson_type', 'difficulty_level']
    for field in required_fields:
        if not form_data.get(field):
            return JSONResponse(status_code=400, content={"detail": f"Missing {field}"})
    
    # Initialize agent
    agent = LessonPlanCreatorAgent(agent_id, config)
    
    # Load context
    context_loader = ContextLoader(db)
    context = await context_loader.load_full_context(
        user_id=current_user,
        topic_id=form_data.get('topic_id')
    )
    
    # Create lesson plan
    lesson_plan = await agent.create_lesson_plan(
        context=context,
        lesson_type=form_data.get('lesson_type'),
        difficulty_level=form_data.get('difficulty_level')
    )
    
    # Log interaction
    ai_logger.log_interaction(
        agent_id=agent_id,
        user_id=current_user,
        message_type="lesson_plan_creation",
        content=form_data.get('lesson_type'),
        metadata={
            "topic_id": form_data.get('topic_id'),
            "difficulty_level": form_data.get('difficulty_level'),
            "lesson_plan": lesson_plan.dict()
        }
    )
    
    return JSONResponse(content=lesson_plan.dict())

async def handle_evaluate_lesson(
    agent_id: str, 
    form_data: Dict[str, Any], 
    config: AIConfig, 
    db: Client, 
    current_user: str
) -> JSONResponse:
    """Handle evaluate lesson request"""
    # Extract required fields
    required_fields = ['lesson_id', 'topic_id']
    for field in required_fields:
        if not form_data.get(field):
            return JSONResponse(status_code=400, content={"detail": f"Missing {field}"})
    
    # Initialize agent
    agent = LessonEvaluatorAgent(agent_id, config)
    
    # Load context
    context_loader = ContextLoader(db)
    context = await context_loader.load_full_context(
        user_id=current_user,
        lesson_id=form_data.get('lesson_id'),
        topic_id=form_data.get('topic_id')
    )
    
    # Evaluate lesson
    lesson_evaluation = await agent.evaluate_lesson(
        context=context
    )
    
    # Log interaction
    ai_logger.log_interaction(
        agent_id=agent_id,
        user_id=current_user,
        message_type="lesson_evaluation",
        content=str(lesson_evaluation),
        metadata={
            "lesson_id": form_data.get('lesson_id'),
            "topic_id": form_data.get('topic_id'),
            "lesson_evaluation": lesson_evaluation.dict()
        }
    )
    
    return JSONResponse(content=lesson_evaluation.dict())

async def handle_analyze_progress(
    agent_id: str, 
    form_data: Dict[str, Any], 
    config: AIConfig, 
    db: Client, 
    current_user: str
) -> JSONResponse:
    """Handle analyze progress request"""
    # Extract required fields
    required_fields = ['topic_id', 'lesson_id']
    for field in required_fields:
        if not form_data.get(field):
            return JSONResponse(status_code=400, content={"detail": f"Missing {field}"})
    
    # Initialize agent
    agent = LessonEvaluatorAgent(agent_id, config)
    
    # Load context
    context_loader = ContextLoader(db)
    context = await context_loader.load_full_context(
        user_id=current_user,
        lesson_id=form_data.get('lesson_id'),
        topic_id=form_data.get('topic_id')
    )
    
    # Analyze progress
    progress_analysis = await agent.analyze_progress(
        context=context
    )
    
    # Log interaction
    ai_logger.log_interaction(
        agent_id=agent_id,
        user_id=current_user,
        message_type="progress_analysis",
        content=str(progress_analysis),
        metadata={
            "lesson_id": form_data.get('lesson_id'),
            "topic_id": form_data.get('topic_id'),
            "progress_analysis": progress_analysis.dict()
        }
    )
    
    return JSONResponse(content=progress_analysis.dict())

async def handle_summarize_lesson(
    agent_id: str, 
    form_data: Dict[str, Any], 
    config: AIConfig, 
    db: Client, 
    current_user: str
) -> JSONResponse:
    """Handle summarize lesson request"""
    # Extract required fields
    required_fields = ['lesson_id']
    for field in required_fields:
        if not form_data.get(field):
            return JSONResponse(status_code=400, content={"detail": f"Missing {field}"})
    
    # Initialize agent
    agent = LessonTeacherAgent(agent_id, config)
    
    # Load context
    context_loader = ContextLoader(db)
    context = await context_loader.load_full_context(
        user_id=current_user,
        lesson_id=form_data.get('lesson_id')
    )
    
    # Summarize lesson
    lesson_summary = await agent.summarize_lesson(
        context=context
    )
    
    # Log interaction
    ai_logger.log_interaction(
        agent_id=agent_id,
        user_id=current_user,
        message_type="lesson_summary",
        content=str(lesson_summary),
        metadata={
            "lesson_id": form_data.get('lesson_id'),
            "lesson_summary": lesson_summary.dict()
        }
    )
    
    return JSONResponse(content=lesson_summary.dict())

@router.post("/chat/{agent_id}")
async def chat_route(
    agent_id: str, 
    request: Request, 
    config: AIConfig = Depends(AIConfig),
    db: Client = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Generic route for all chat-related requests"""
    return await process_chat_request(agent_id, request, config, db, current_user)

@router.post("/chat/{agent_id}/question")
async def question_route(
    agent_id: str, 
    request: Request, 
    config: AIConfig = Depends(AIConfig),
    db: Client = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Generic route for all question-related requests"""
    return await process_chat_request(agent_id, request, config, db, current_user)

@router.post("/chat/{agent_id}/evaluate/{lesson_id}")
async def evaluate_answer_route(
    agent_id: str, 
    lesson_id: str, 
    request: Request, 
    config: AIConfig = Depends(AIConfig),
    db: Client = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Generic route for all evaluate answer-related requests"""
    return await process_chat_request(agent_id, request, config, db, current_user)

@router.post("/chat/{agent_id}/plan")
async def lesson_plan_route(
    agent_id: str, 
    request: Request, 
    config: AIConfig = Depends(AIConfig),
    db: Client = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Generic route for all lesson plan-related requests"""
    return await process_chat_request(agent_id, request, config, db, current_user)

@router.post("/chat/{agent_id}/evaluate_lesson")
async def evaluate_lesson_route(
    agent_id: str, 
    request: Request, 
    config: AIConfig = Depends(AIConfig),
    db: Client = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Generic route for all evaluate lesson-related requests"""
    return await process_chat_request(agent_id, request, config, db, current_user)

@router.post("/chat/{agent_id}/analyze_progress")
async def analyze_progress_route(
    agent_id: str, 
    request: Request, 
    config: AIConfig = Depends(AIConfig),
    db: Client = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Generic route for all analyze progress-related requests"""
    return await process_chat_request(agent_id, request, config, db, current_user)

@router.post("/chat/{agent_id}/summarize")
async def summarize_lesson_route(
    agent_id: str, 
    request: Request, 
    config: AIConfig = Depends(AIConfig),
    db: Client = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Generic route for all summarize lesson-related requests"""
    return await process_chat_request(agent_id, request, config, db, current_user)
