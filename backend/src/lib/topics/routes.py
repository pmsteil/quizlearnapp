from fastapi import APIRouter, Depends, HTTPException
from typing import List
from src.lib.auth.service import get_current_user, require_admin
from src.lib.topics.service import TopicService
from pydantic import BaseModel

router = APIRouter(prefix="/topics", tags=["topics"])

class TopicCreate(BaseModel):
    title: str
    description: str

class TopicUpdate(BaseModel):
    title: str
    description: str

class TopicResponse(BaseModel):
    id: int
    title: str
    description: str
    user_id: int
    created_at: str
    updated_at: str

@router.get("", response_model=List[TopicResponse])
async def get_topics(current_user = Depends(get_current_user)):
    topics = await TopicService.get_topics()
    return topics

@router.get("/{topic_id}", response_model=TopicResponse)
async def get_topic(topic_id: int, current_user = Depends(get_current_user)):
    topic = await TopicService.get_topic_by_id(topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic

@router.post("", response_model=TopicResponse)
async def create_topic(
    topic: TopicCreate,
    current_user = Depends(require_admin)
):
    return await TopicService.create_topic(
        title=topic.title,
        description=topic.description,
        user_id=current_user["id"]
    )

@router.put("/{topic_id}", response_model=TopicResponse)
async def update_topic(
    topic_id: int,
    topic: TopicUpdate,
    current_user = Depends(require_admin)
):
    updated_topic = await TopicService.update_topic(
        topic_id=topic_id,
        title=topic.title,
        description=topic.description
    )
    if not updated_topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return updated_topic

@router.delete("/{topic_id}")
async def delete_topic(topic_id: int, current_user = Depends(require_admin)):
    success = await TopicService.delete_topic(topic_id)
    if not success:
        raise HTTPException(status_code=404, detail="Topic not found")
    return {"message": "Topic deleted successfully"}
