from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List
from src.lib.auth.service import get_current_user, require_admin
from src.lib.topics.service import TopicService, TopicCreate, TopicUpdate, LessonPlan
from pydantic import BaseModel, ValidationError
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/topics", tags=["topics"])

class TopicResponse(BaseModel):
    user_id: str
    topic_id: str
    title: str
    description: str
    lessonPlan: LessonPlan
    createdAt: int
    updatedAt: int

class TopicLessonResponse(BaseModel):
    lesson_id: str
    topic_id: str
    title: str
    content: str
    order_index: int
    parent_lesson_id: str | None = None
    created_at: int
    updated_at: int

class UserLessonProgressResponse(BaseModel):
    progress_id: str
    user_id: str
    lesson_id: str
    status: str
    last_interaction_at: int
    completion_date: int | None = None

@router.get("/user/{user_id}", response_model=List[TopicResponse])
async def get_user_topics(user_id: str, request: Request, current_user = Depends(get_current_user)):
    """Get all topics for a specific user."""
    if current_user["user_id"] != user_id and "role_admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Not authorized to view these topics")
    try:
        logger.info(f"Getting topics for user {user_id}")
        topic_service = TopicService(request.app.state.db)
        topics = topic_service.get_user_topics(user_id, request.app.state.db)
        logger.info(f"Successfully retrieved {len(topics)} topics")
        return [TopicResponse(**topic) for topic in topics]
    except HTTPException as e:
        logger.error(f"HTTP error in get_user_topics endpoint: {str(e)}")
        raise e
    except Exception as e:
        logger.error("Error in get_user_topics endpoint")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error message: {str(e)}")
        logger.exception(e)
        raise HTTPException(status_code=500, detail={"error": str(e), "type": str(type(e))})

@router.get("/{topic_id}", response_model=TopicResponse)
async def get_topic(topic_id: str, request: Request, current_user = Depends(get_current_user)):
    """Get a specific topic by ID."""
    logger.info(f"Getting topic with ID: {topic_id}")
    try:
        logger.info(f"Fetching topic {topic_id} for user {current_user['user_id']}")
        topic_service = TopicService(request.app.state.db)
        topic = await topic_service.get_topic_by_id(topic_id, request.app.state.db)
        
        if not topic:
            logger.warning(f"Topic not found: {topic_id}")
            logger.error(f"Topic {topic_id} not found")
            raise HTTPException(status_code=404, detail="Topic not found")
            
        if topic["user_id"] != current_user["user_id"] and "role_admin" not in current_user.get("roles", []):
            logger.warning(f"User {current_user['user_id']} attempted to access topic {topic_id} owned by {topic['user_id']}")
            raise HTTPException(status_code=403, detail="Not authorized to view this topic")
            
        logger.info(f"Found topic: {topic}")
        logger.info(f"Topic data retrieved: {topic}")
        
        logger.info(f"Successfully returning topic {topic_id}")
        return TopicResponse(**topic)
    except HTTPException as e:
        logger.error(f"HTTP error in get_topic endpoint: {str(e)}")
        raise e
    except Exception as e:
        logger.error(f"Error getting topic {topic_id}: {str(e)}")
        logger.error(f"Unexpected error in get_topic endpoint for topic {topic_id}")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error message: {str(e)}")
        logger.exception(e)
        raise HTTPException(status_code=500, detail={"error": str(e), "type": str(type(e))})

@router.get("/{topic_id}/lessons")
async def get_topic_lessons(topic_id: str, request: Request, current_user = Depends(get_current_user)):
    """Get all lessons for a specific topic."""
    try:
        logger.info(f"Getting lessons for topic {topic_id}")
        topic_service = TopicService(request.app.state.db)
        
        # First check if topic exists and user has access
        topic = await topic_service.get_topic_by_id(topic_id, request.app.state.db)
        if not topic:
            logger.warning(f"Topic not found: {topic_id}")
            raise HTTPException(status_code=404, detail="Topic not found")
            
        if topic["user_id"] != current_user["user_id"] and "role_admin" not in current_user.get("roles", []):
            logger.warning(f"User {current_user['user_id']} attempted to access lessons for topic {topic_id}")
            raise HTTPException(status_code=403, detail="Not authorized to view these lessons")
        
        # Get lessons
        lessons = await topic_service.get_topic_lessons(topic_id, request.app.state.db)
        logger.info(f"Successfully retrieved {len(lessons)} lessons")
        return {"data": [TopicLessonResponse(**lesson) for lesson in lessons]}
    except HTTPException as e:
        logger.error(f"HTTP error in get_topic_lessons endpoint: {str(e)}")
        raise e
    except Exception as e:
        logger.error(f"Error getting lessons for topic {topic_id}")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error message: {str(e)}")
        logger.exception(e)
        raise HTTPException(status_code=500, detail={"error": str(e), "type": str(type(e))})

@router.get("/{topic_id}/progress")
async def get_topic_progress(topic_id: str, request: Request, current_user = Depends(get_current_user)):
    """Get progress for all lessons in a topic."""
    try:
        logger.info(f"Getting progress for topic {topic_id}")
        topic_service = TopicService(request.app.state.db)
        
        # First check if topic exists and user has access
        topic = await topic_service.get_topic_by_id(topic_id, request.app.state.db)
        if not topic:
            logger.warning(f"Topic not found: {topic_id}")
            raise HTTPException(status_code=404, detail="Topic not found")
            
        if topic["user_id"] != current_user["user_id"] and "role_admin" not in current_user.get("roles", []):
            logger.warning(f"User {current_user['user_id']} attempted to access progress for topic {topic_id}")
            raise HTTPException(status_code=403, detail="Not authorized to view this progress")
        
        # Get progress
        progress = await topic_service.get_topic_progress(topic_id, current_user["user_id"], request.app.state.db)
        logger.info(f"Successfully retrieved progress for {len(progress)} lessons")
        return {"data": [UserLessonProgressResponse(**p) for p in progress]}
    except HTTPException as e:
        logger.error(f"HTTP error in get_topic_progress endpoint: {str(e)}")
        raise e
    except Exception as e:
        logger.error(f"Error getting progress for topic {topic_id}")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error message: {str(e)}")
        logger.exception(e)
        raise HTTPException(status_code=500, detail={"error": str(e), "type": str(type(e))})

@router.post("", response_model=TopicResponse)
async def create_topic(topic: TopicCreate, request: Request, current_user = Depends(get_current_user)):
    """Create a new topic."""
    try:
        logger.info(f"Creating topic for user {current_user['user_id']}")
        topic.user_id = current_user["user_id"]
        logger.info(f"Topic data: {topic.dict()}")
        
        topic_service = TopicService(request.app.state.db)
        new_topic = topic_service.create_topic(topic, request.app.state.db)
        logger.info(f"Topic created successfully: {new_topic}")
        return TopicResponse(**new_topic)
    except HTTPException as e:
        logger.error(f"HTTP error in create_topic endpoint: {str(e)}")
        raise e
    except Exception as e:
        logger.error("Error in create_topic endpoint")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error message: {str(e)}")
        logger.exception(e)
        raise HTTPException(status_code=500, detail={"error": str(e), "type": str(type(e))})

@router.put("/{topic_id}", response_model=TopicResponse)
async def update_topic(topic_id: str, topic: TopicUpdate, request: Request, current_user = Depends(get_current_user)):
    """Update a topic."""
    existing_topic = await TopicService(request.app.state.db).get_topic_by_id(topic_id, request.app.state.db)
    if not existing_topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    if existing_topic["user_id"] != current_user["user_id"] and "role_admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Not authorized to update this topic")
    
    topic_service = TopicService(request.app.state.db)
    updated_topic = await topic_service.update_topic(topic_id, topic, request.app.state.db)
    if not updated_topic:
        raise HTTPException(status_code=400, detail="No fields to update")
    return TopicResponse(**updated_topic)

@router.delete("/{topic_id}")
async def delete_topic(topic_id: str, request: Request, current_user = Depends(get_current_user)):
    """Delete a topic."""
    existing_topic = await TopicService(request.app.state.db).get_topic_by_id(topic_id, request.app.state.db)
    if not existing_topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    if existing_topic["user_id"] != current_user["user_id"] and "role_admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Not authorized to delete this topic")
    
    topic_service = TopicService(request.app.state.db)
    await topic_service.delete_topic(topic_id, request.app.state.db)
    return {"message": "Topic deleted successfully"}
