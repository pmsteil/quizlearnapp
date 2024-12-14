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
    user_id: str
    topic_id: str
    title: str
    description: str
    lessonPlan: LessonPlan
    createdAt: int
    updatedAt: int

@router.get("/user/{user_id}", response_model=List[TopicResponse])
async def get_user_topics(user_id: str, current_user = Depends(get_current_user)):
    """Get all topics for a specific user."""
    if current_user["user_id"] != user_id and "role_admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Not authorized to view these topics")
    try:
        logger.info(f"Getting topics for user {user_id}")
        topics = TopicService.get_user_topics(user_id)
        logger.info(f"Successfully retrieved {len(topics)} topics")
        return topics
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
async def get_topic(topic_id: str, current_user = Depends(get_current_user)):
    """Get a specific topic by ID."""
    logger.info(f"Getting topic with ID: {topic_id}")
    try:
        logger.info(f"Fetching topic {topic_id} for user {current_user['user_id']}")
        topic = await TopicService.get_topic_by_id(topic_id)
        
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
        return topic
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

@router.post("", response_model=TopicResponse)
def create_topic(topic: TopicCreate, current_user = Depends(get_current_user)):
    """Create a new topic."""
    try:
        logger.info(f"Creating topic for user {current_user['user_id']}")
        topic.user_id = current_user["user_id"]
        logger.info(f"Topic data: {topic.dict()}")
        
        new_topic = TopicService.create_topic(topic)
        logger.info(f"Topic created successfully: {new_topic}")
        return new_topic
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
async def update_topic(topic_id: str, topic: TopicUpdate, current_user = Depends(get_current_user)):
    """Update a topic."""
    existing_topic = await TopicService.get_topic_by_id(topic_id)
    if not existing_topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    if existing_topic["user_id"] != current_user["user_id"] and "role_admin" not in current_user.get("roles", []):
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
    if existing_topic["user_id"] != current_user["user_id"] and "role_admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Not authorized to delete this topic")
    
    await TopicService.delete_topic(topic_id)
    return {"message": "Topic deleted successfully"}
