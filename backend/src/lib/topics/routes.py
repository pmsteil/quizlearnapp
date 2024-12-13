from fastapi import APIRouter, Depends, HTTPException
from typing import List
from src.lib.auth.service import get_current_user, require_admin
from src.lib.topics.service import TopicService, TopicCreate, TopicUpdate, LessonPlan
from pydantic import BaseModel, ValidationError
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/topics", tags=["topics"])

class TopicResponse(BaseModel):
    id: str
    userId: str
    title: str
    description: str
    lessonPlan: LessonPlan
    createdAt: int
    updatedAt: int

@router.get("/user/{user_id}", response_model=List[TopicResponse])
async def get_user_topics(user_id: str, current_user = Depends(get_current_user)):
    """Get all topics for a specific user."""
    if current_user["id"] != user_id and "role_admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Not authorized to view these topics")
    topics = await TopicService.get_user_topics(user_id)
    return topics

@router.get("/{topic_id}", response_model=TopicResponse)
async def get_topic(topic_id: str, current_user = Depends(get_current_user)):
    """Get a specific topic by ID."""
    topic = await TopicService.get_topic_by_id(topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    if topic["user_id"] != current_user["id"] and "role_admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Not authorized to view this topic")
    return topic

@router.post("", response_model=TopicResponse)
async def create_topic(topic: TopicCreate, current_user = Depends(get_current_user)):
    """Create a new topic."""
    try:
        logger.info(f"Creating topic with data: {topic.dict()}")
        lesson_plan = topic.get_lesson_plan()
        logger.info(f"Using lesson plan: {lesson_plan.dict()}")
        
        logger.info(f"Executing TopicService.create_topic with topic: {topic.dict()}")
        
        result = TopicService.create_topic(topic)
        if result is None:
            raise HTTPException(status_code=500, detail="Failed to create topic")
        return result
    except ValidationError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating topic: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{topic_id}", response_model=TopicResponse)
async def update_topic(topic_id: str, topic: TopicUpdate, current_user = Depends(get_current_user)):
    """Update a topic."""
    existing_topic = await TopicService.get_topic_by_id(topic_id)
    if not existing_topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    if existing_topic["user_id"] != current_user["id"] and "role_admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Not authorized to update this topic")
    
    updated_topic = await TopicService.update_topic(topic_id, topic)
    if not updated_topic:
        raise HTTPException(status_code=400, detail="No fields to update")
    return updated_topic

@router.delete("/{topic_id}")
async def delete_topic(topic_id: str, current_user = Depends(get_current_user)):
    """Delete a topic."""
    existing_topic = await TopicService.get_topic_by_id(topic_id)
    if not existing_topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    if existing_topic["user_id"] != current_user["id"] and "role_admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Not authorized to delete this topic")
    
    await TopicService.delete_topic(topic_id)
    return {"message": "Topic deleted successfully"}
