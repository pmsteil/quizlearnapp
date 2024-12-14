from fastapi import APIRouter, Depends, HTTPException
from typing import List
from pydantic import BaseModel
from backend.src.lib.auth.middleware import require_auth
from backend.src.lib.auth.service import get_current_user
from backend.src.lib.db.models.progress import ProgressModel
from backend.src.lib.db.models.topic import TopicModel
from backend.src.lib.db.models.question import QuestionModel
from shared.src.types import Progress, TopicProgress, User

router = APIRouter(prefix="/progress", tags=["progress"])

class RecordProgressRequest(BaseModel):
    questionId: str
    isCorrect: bool

@router.get("/topic/{topic_id}", response_model=TopicProgress)
async def get_topic_progress(
    topic_id: str,
    current_user: User = Depends(require_auth())
):
    """
    Get progress statistics for a specific topic.
    Users can only access progress for topics they own or if they're an admin.
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
        if topic.userId != current_user.user_id and "role_admin" not in current_user.roles:
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to access progress for this topic"
            )

        # Get progress statistics
        progress = await ProgressModel.getTopicProgress(topic_id)
        return progress
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch topic progress: {str(e)}"
        )

@router.post("/topic/{topic_id}", response_model=Progress)
async def record_progress(
    topic_id: str,
    progress_data: RecordProgressRequest,
    current_user: User = Depends(require_auth())
):
    """
    Record progress for a question in a topic.
    Users can only record progress for topics they own.
    """
    try:
        # Check if topic exists and user has access
        topic = await TopicModel.getById(topic_id)
        if not topic:
            raise HTTPException(
                status_code=404,
                detail="Topic not found"
            )

        # Check if user owns this topic
        if topic.userId != current_user.user_id:
            raise HTTPException(
                status_code=403,
                detail="You can only record progress for your own topics"
            )

        # Check if question exists and belongs to this topic
        question = await QuestionModel.getById(progress_data.questionId)
        if not question:
            raise HTTPException(
                status_code=404,
                detail="Question not found"
            )
        if question.topicId != topic_id:
            raise HTTPException(
                status_code=400,
                detail="Question does not belong to this topic"
            )

        # Record progress
        progress = await ProgressModel.create(
            current_user.user_id,
            topic_id,
            progress_data.questionId,
            progress_data.isCorrect
        )
        return progress
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to record progress: {str(e)}"
        )
