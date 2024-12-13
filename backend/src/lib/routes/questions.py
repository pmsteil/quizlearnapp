from fastapi import APIRouter, Depends, HTTPException
from typing import List
from pydantic import BaseModel
from backend.src.lib.auth.middleware import require_auth
from backend.src.lib.auth.service import get_current_user
from backend.src.lib.db.models.question import QuestionModel
from backend.src.lib.db.models.topic import TopicModel
from shared.src.types import Question, User

router = APIRouter(prefix="/questions", tags=["questions"])

class CreateQuestionRequest(BaseModel):
    text: str
    options: List[str]
    correctAnswer: int
    explanation: str

class UpdateQuestionRequest(BaseModel):
    text: str
    options: List[str]
    correctAnswer: int
    explanation: str

@router.get("/topic/{topic_id}", response_model=List[Question])
async def get_topic_questions(
    topic_id: str,
    current_user: User = Depends(require_auth())
):
    """
    Get all questions for a specific topic.
    Users can only access questions for topics they own or if they're an admin.
    """
    try:
        # Check if topic exists and user has access
        topic = await TopicModel.getById(topic_id)
        if not topic:
            raise HTTPException(
                status_code=404,
                detail="Topic not found"
            )

        # Check if user has access to this topic
        if topic.userId != current_user.id and "role_admin" not in current_user.roles:
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to access questions for this topic"
            )

        # Get questions
        questions = await QuestionModel.getByTopicId(topic_id)
        return questions
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch questions: {str(e)}"
        )

@router.post("/topic/{topic_id}", response_model=Question)
async def create_question(
    topic_id: str,
    question_data: CreateQuestionRequest,
    current_user: User = Depends(require_auth())
):
    """
    Create a new question for a topic.
    Only admins can create questions.
    """
    try:
        # Check if user is admin
        if "role_admin" not in current_user.roles:
            raise HTTPException(
                status_code=403,
                detail="Only administrators can create questions"
            )

        # Check if topic exists
        topic = await TopicModel.getById(topic_id)
        if not topic:
            raise HTTPException(
                status_code=404,
                detail="Topic not found"
            )

        # Validate options and correct answer
        if len(question_data.options) < 2:
            raise HTTPException(
                status_code=400,
                detail="Questions must have at least 2 options"
            )

        if question_data.correctAnswer >= len(question_data.options):
            raise HTTPException(
                status_code=400,
                detail="Correct answer index must be less than the number of options"
            )

        # Create question
        question = await QuestionModel.create(
            topic_id,
            question_data.text,
            question_data.options,
            question_data.correctAnswer,
            question_data.explanation
        )
        return question
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create question: {str(e)}"
        )

@router.put("/{question_id}", response_model=Question)
async def update_question(
    question_id: str,
    question_data: UpdateQuestionRequest,
    current_user: User = Depends(require_auth())
):
    """
    Update a specific question.
    Only admins can update questions.
    """
    try:
        # Check if user is admin
        if "role_admin" not in current_user.roles:
            raise HTTPException(
                status_code=403,
                detail="Only administrators can update questions"
            )

        # Check if question exists
        existing_question = await QuestionModel.getById(question_id)
        if not existing_question:
            raise HTTPException(
                status_code=404,
                detail="Question not found"
            )

        # Validate options and correct answer
        if len(question_data.options) < 2:
            raise HTTPException(
                status_code=400,
                detail="Questions must have at least 2 options"
            )

        if question_data.correctAnswer >= len(question_data.options):
            raise HTTPException(
                status_code=400,
                detail="Correct answer index must be less than the number of options"
            )

        # Update question
        updated_question = await QuestionModel.update(
            question_id,
            question_data.text,
            question_data.options,
            question_data.correctAnswer,
            question_data.explanation
        )
        return updated_question
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update question: {str(e)}"
        )
