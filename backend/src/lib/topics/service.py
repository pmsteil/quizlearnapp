from typing import List, Optional, Dict, Any
import time
import uuid
from src.lib.db import get_db
from pydantic import BaseModel, ValidationError
from fastapi import HTTPException
import logging
import json

logger = logging.getLogger(__name__)

class LessonPlan(BaseModel):
    mainTopics: List[dict] = []
    currentTopic: str = ""
    completedTopics: List[str] = []

    class Config:
        json_schema_extra = {
            "example": {
                "mainTopics": [],
                "currentTopic": "",
                "completedTopics": []
            }
        }

class TopicCreate(BaseModel):
    userId: str
    title: str
    description: str | None = None
    lessonPlan: LessonPlan | None = None

    @property
    def default_lesson_plan(self) -> LessonPlan:
        return LessonPlan()

    def get_lesson_plan(self) -> LessonPlan:
        return self.lessonPlan or self.default_lesson_plan

    class Config:
        json_encoders = {
            LessonPlan: lambda v: v.dict()
        }

class TopicUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    lessonPlan: LessonPlan | None = None

class Topic(BaseModel):
    id: str
    userId: str
    title: str
    description: str | None = None
    lessonPlan: LessonPlan
    createdAt: int
    updatedAt: int

    class Config:
        json_encoders = {
            LessonPlan: lambda v: v.dict()
        }

class TopicService:
    db = get_db()

    @staticmethod
    def get_user_topics(user_id: str) -> List[Dict[str, Any]]:
        """Get all topics for a user."""
        try:
            logger.info(f"Getting topics for user {user_id}")
            
            # First check if user exists
            user_result = get_db().execute("SELECT id FROM users WHERE id = ?", [user_id])
            user = user_result.rows
            if not user:
                logger.error(f"User {user_id} not found")
                raise HTTPException(status_code=404, detail=f"User {user_id} not found")

            # Get topics
            logger.info(f"User found, fetching their topics")
            result = get_db().execute("""
                SELECT id, user_id, title, description, lesson_plan, created_at, updated_at 
                FROM topics
                WHERE user_id = ?
                ORDER BY created_at DESC
            """, [user_id])
            logger.info(f"Found {len(result.rows)} topics")

            topics = []
            for row in result.rows:
                try:
                    # Convert row tuple to dict with proper field names
                    topic_dict = {
                        "id": row[0],
                        "userId": row[1],
                        "title": row[2],
                        "description": row[3],
                        "lessonPlan": json.loads(row[4]) if row[4] else {"mainTopics": [], "currentTopic": "", "completedTopics": []},
                        "createdAt": row[5],
                        "updatedAt": row[6]
                    }
                    topics.append(topic_dict)
                except Exception as e:
                    logger.error(f"Error processing topic row: {row}")
                    logger.error(f"Error: {str(e)}")
                    logger.exception(e)
                    continue

            return topics
        except HTTPException as e:
            raise e
        except Exception as e:
            logger.error("Error in get_user_topics")
            logger.error(f"Error type: {type(e)}")
            logger.error(f"Error message: {str(e)}")
            logger.exception(e)
            raise HTTPException(status_code=500, detail={"error": str(e), "type": str(type(e))})

    @staticmethod
    async def get_topic_by_id(topic_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific topic by ID."""
        try:
            logger.info(f"Getting topic {topic_id}")
            db = get_db()
            result = db.execute("""
                SELECT id, user_id, title, description, lesson_plan, created_at, updated_at 
                FROM topics
                WHERE id = ?
            """, [topic_id])
            
            if not result.rows:
                logger.info(f"Topic {topic_id} not found")
                return None
                
            row = result.rows[0]
            logger.info(f"Found topic: {row}")
            
            try:
                lesson_plan = json.loads(row[4]) if row[4] else {
                    "mainTopics": [],
                    "currentTopic": "",
                    "completedTopics": []
                }
            except json.JSONDecodeError as e:
                logger.error(f"Error decoding lesson_plan JSON: {e}")
                logger.error(f"Raw lesson_plan value: {row[4]}")
                lesson_plan = {
                    "mainTopics": [],
                    "currentTopic": "",
                    "completedTopics": []
                }
            
            return {
                "id": row[0],
                "userId": row[1],
                "title": row[2],
                "description": row[3],
                "lessonPlan": lesson_plan,
                "createdAt": row[5],
                "updatedAt": row[6]
            }
        except Exception as e:
            logger.error(f"Error getting topic {topic_id}")
            logger.error(f"Error type: {type(e)}")
            logger.error(f"Error message: {str(e)}")
            logger.exception(e)
            raise HTTPException(status_code=500, detail={"error": str(e), "type": str(type(e))})

    @staticmethod
    def create_topic(topic: TopicCreate) -> Dict[str, Any]:
        """Create a new topic."""
        try:
            logger.info(f"Creating topic for user {topic.userId}")
            logger.info(f"Topic data: {topic.dict()}")
            
            topic_id = str(uuid.uuid4())
            current_time = int(time.time())
            lesson_plan = topic.get_lesson_plan()
            
            logger.info("Executing insert query")
            result = get_db().execute("""
                INSERT INTO topics (id, user_id, title, description, progress, lesson_plan, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, [
                topic_id,
                topic.userId,
                topic.title,
                topic.description,
                0,  # Initial progress
                json.dumps(lesson_plan.dict()),
                current_time,
                current_time
            ])
            logger.info("Insert successful")
            
            # Return the created topic
            return {
                "id": topic_id,
                "userId": topic.userId,
                "title": topic.title,
                "description": topic.description,
                "progress": 0,
                "lessonPlan": lesson_plan.dict(),
                "createdAt": current_time,
                "updatedAt": current_time
            }
            
        except Exception as e:
            logger.error("Error in create_topic")
            logger.error(f"Error type: {type(e)}")
            logger.error(f"Error message: {str(e)}")
            logger.exception(e)
            raise HTTPException(
                status_code=500,
                detail={"error": str(e), "type": str(type(e))}
            )

    @staticmethod
    async def update_topic(topic_id: str, data: TopicUpdate) -> Optional[Dict[str, Any]]:
        db = get_db()
        current_time = int(time.time())

        # Build update query dynamically based on provided fields
        updates = []
        params = []
        if data.title is not None:
            updates.append("title = ?")
            params.append(data.title)
        if data.description is not None:
            updates.append("description = ?")
            params.append(data.description)
        if data.lessonPlan is not None:
            updates.append("lesson_plan = ?")
            params.append(data.lessonPlan.json())

        updates.append("updated_at = ?")
        params.append(current_time)

        # Add topic_id as the last parameter
        params.append(topic_id)

        if not updates:
            return None

        result = db.execute(f"""
            UPDATE topics
            SET {", ".join(updates)}
            WHERE id = ? 
            RETURNING *
        """, params)

        return dict(result.rows[0]) if result.rows else None

    @staticmethod
    async def delete_topic(topic_id: str) -> None:
        """Delete a topic."""
        try:
            db = get_db()
            
            # First check if the topic exists
            result = db.execute("""
                SELECT id FROM topics 
                WHERE id = ?
            """, [topic_id])
            
            if not result.rows:
                raise HTTPException(status_code=404, detail="Topic not found")
            
            # Delete the topic
            db.execute("""
                DELETE FROM topics
                WHERE id = ?
            """, [topic_id])
            
        except Exception as e:
            logger.error(f"Error deleting topic {topic_id}")
            logger.error(f"Error type: {type(e)}")
            logger.error(f"Error message: {str(e)}")
            logger.exception(e)
            raise HTTPException(
                status_code=500,
                detail={"error": str(e), "type": str(type(e))}
            )
