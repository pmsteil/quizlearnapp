from fastapi import APIRouter, Depends, HTTPException
from typing import List
from pydantic import BaseModel
from backend.src.lib.auth.middleware import require_auth
from backend.src.lib.auth.service import get_current_user
from backend.src.lib.db.models.topic import TopicModel
from shared.src.types import Topic, User, LessonPlan

router = APIRouter(prefix="/topics", tags=["topics"])

class CreateTopicRequest(BaseModel):
    title: str
    description: str
    lesson_plan: LessonPlan

class UpdateTopicRequest(BaseModel):
    title: str
    description: str
    lesson_plan: LessonPlan

@router.get("/", response_model=List[Topic])
async def get_topics(current_user: User = Depends(require_auth())):
    """
    Get all topics for the current user.
    If user has admin role, returns all topics.
    """
    try:
        # Get topics for the user
        topics = await TopicModel.getByUserId(current_user.id)
        return topics
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch topics: {str(e)}"
        )

@router.post("/", response_model=Topic)
async def create_topic(
    topic_data: CreateTopicRequest,
    current_user: User = Depends(require_auth())
):
    """
    Create a new topic.
    Only users with admin role can create topics.
    """
    try:
        # Check if user has admin role
        if "role_admin" not in current_user.roles:
            raise HTTPException(
                status_code=403,
                detail="Only administrators can create topics"
            )

        # Create the topic
        topic = await TopicModel.create(
            current_user.id,
            topic_data.title,
            topic_data.description,
            topic_data.lesson_plan
        )
        return topic
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create topic: {str(e)}"
        )

@router.get("/{topic_id}", response_model=Topic)
async def get_topic(
    topic_id: str,
    current_user: User = Depends(require_auth())
):
    """
    Get a specific topic by ID.
    Users can only access their own topics unless they have admin role.
    """
    try:
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
                detail="You don't have permission to access this topic"
            )

        return topic
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch topic: {str(e)}"
        )

@router.put("/{topic_id}", response_model=Topic)
async def update_topic(
    topic_id: str,
    topic_data: UpdateTopicRequest,
    current_user: User = Depends(require_auth())
):
    """
    Update a specific topic.
    Only admins or the topic owner can update it.
    """
    try:
        # Check if topic exists and user has access
        existing_topic = await TopicModel.getById(topic_id)
        if not existing_topic:
            raise HTTPException(
                status_code=404,
                detail="Topic not found"
            )

        # Check permissions
        if existing_topic.userId != current_user.id and "role_admin" not in current_user.roles:
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to update this topic"
            )

        # Update the topic
        updated_topic = await TopicModel.update(
            topic_id,
            topic_data.title,
            topic_data.description,
            topic_data.lesson_plan
        )
        return updated_topic
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update topic: {str(e)}"
        )

@router.delete("/{topic_id}")
async def delete_topic(
    topic_id: str,
    current_user: User = Depends(require_auth())
):
    """
    Delete a specific topic.
    Only admins or the topic owner can delete it.
    """
    try:
        # Check if topic exists and user has access
        existing_topic = await TopicModel.getById(topic_id)
        if not existing_topic:
            raise HTTPException(
                status_code=404,
                detail="Topic not found"
            )

        # Check permissions
        if existing_topic.userId != current_user.id and "role_admin" not in current_user.roles:
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to delete this topic"
            )

        # Delete the topic
        await TopicModel.delete(topic_id)
        return {"message": "Topic deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete topic: {str(e)}"
        )
