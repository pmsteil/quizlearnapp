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
    user_id: str
    title: str
    description: str | None = None
    lesson_plan: LessonPlan | None = None

    @property
    def default_lesson_plan(self) -> LessonPlan:
        return LessonPlan()

    def get_lesson_plan(self) -> LessonPlan:
        return self.lesson_plan or self.default_lesson_plan

    class Config:
        json_encoders = {
            LessonPlan: lambda v: v.dict()
        }

class TopicUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    lesson_plan: LessonPlan | None = None

class Topic(BaseModel):
    topic_id: str
    user_id: str
    title: str
    description: str | None = None
    lesson_plan: LessonPlan
    created_at: int
    updated_at: int

    class Config:
        json_encoders = {
            LessonPlan: lambda v: v.dict()
        }

class TopicService:
    def __init__(self, db_client=None):
        """Initialize TopicService with optional database client."""
        if db_client is None:
            raise Exception("Database connection required")
        self.db = db_client

    @staticmethod
    def get_user_topics(user_id: str, db) -> List[Dict[str, Any]]:
        """Get all topics for a user."""
        try:
            logger.info(f"Getting topics for user {user_id}")
            
            # First check if user exists
            user_result = db.execute("SELECT user_id FROM users WHERE user_id = ?", [user_id])
            user = user_result.fetchone()
            if not user:
                logger.error(f"User {user_id} not found")
                raise HTTPException(status_code=404, detail=f"User {user_id} not found")

            # Get topics
            logger.info(f"User found, fetching their topics")
            cursor = db.execute("""
                SELECT 
                    t.topic_id,
                    t.user_id,
                    t.title,
                    t.description,
                    t.created_at,
                    t.updated_at,
                    (
                        SELECT json_group_array(
                            json_object(
                                'id', l.lesson_id,
                                'title', l.title,
                                'content', l.content,
                                'orderIndex', l.order_index
                            )
                        )
                        FROM topic_lessons l
                        WHERE l.topic_id = t.topic_id
                        ORDER BY l.order_index
                    ) as lessons
                FROM topics t
                WHERE t.user_id = ?
                ORDER BY t.created_at DESC
            """, [user_id])
            
            topics = []
            for row in cursor.fetchall():
                try:
                    # Convert row tuple to dict with proper field names
                    topic_dict = {
                        "topic_id": row[0],
                        "user_id": row[1],
                        "title": row[2],
                        "description": row[3],
                        "createdAt": row[4],
                        "updatedAt": row[5],
                        "lessonPlan": {
                            "mainTopics": json.loads(row[6]) if row[6] else [],
                            "currentTopic": "",
                            "completedTopics": []
                        }
                    }
                    topics.append(topic_dict)
                except Exception as e:
                    logger.error(f"Error processing topic row: {row}")
                    logger.error(f"Error type: {type(e)}")
                    logger.error(f"Error message: {str(e)}")
                    logger.exception(e)
                    continue

            logger.info(f"Found {len(topics)} topics")
            return topics

        except Exception as e:
            logger.error(f"Error getting topics for user {user_id}")
            logger.error(f"Error type: {type(e)}")
            logger.error(f"Error message: {str(e)}")
            logger.exception(e)
            raise HTTPException(status_code=500, detail={"error": str(e), "type": str(type(e))})

    @staticmethod
    async def get_topic_by_id(topic_id: str, db) -> Optional[Dict[str, Any]]:
        """Get a specific topic by ID."""
        try:
            result = db.execute("""
                SELECT 
                    t.user_id,
                    t.topic_id,
                    t.title,
                    t.description,
                    t.lesson_plan,
                    t.created_at,
                    t.updated_at
                FROM topics t
                WHERE t.topic_id = ?
            """, [topic_id])

            if not result.fetchall():
                return None

            row = result.fetchone()
            return {
                "user_id": row[0],
                "topic_id": row[1],
                "title": row[2],
                "description": row[3],
                "lessonPlan": json.loads(row[4]) if row[4] else {"mainTopics": [], "currentTopic": "", "completedTopics": []},
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
    def create_topic(topic: TopicCreate, db) -> Dict[str, Any]:
        """Create a new topic."""
        try:
            logger.info(f"Creating topic for user {topic.user_id}")
            logger.info(f"Topic data: {topic.dict()}")
            
            topic_id = str(uuid.uuid4())
            current_time = int(time.time())
            
            try:
                # Start a transaction
                db.execute("BEGIN TRANSACTION")
                
                # First create the topic
                logger.info("Creating topic")
                db.execute("""
                    INSERT INTO topics (topic_id, user_id, title, description, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, [
                    topic_id,
                    topic.user_id,
                    topic.title,
                    topic.description,
                    current_time,
                    current_time
                ])
                
                # Then create the user-topic relationship
                logger.info("Creating user-topic relationship")
                db.execute("""
                    INSERT INTO user_topics (user_id, topic_id, goal_text)
                    VALUES (?, ?, ?)
                """, [
                    topic.user_id,
                    topic_id,
                    f"Learn {topic.title}"  # Default goal text
                ])
                
                # Commit the transaction
                db.execute("COMMIT")
                logger.info("Topic creation successful")
                
            except Exception as e:
                # Rollback on error
                db.execute("ROLLBACK")
                raise e
            
            # Return the created topic
            return {
                "topic_id": topic_id,
                "user_id": topic.user_id,
                "title": topic.title,
                "description": topic.description,
                "lessonPlan": {
                    "mainTopics": [],
                    "currentTopic": "",
                    "completedTopics": []
                },
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
    async def update_topic(topic_id: str, data: TopicUpdate, db) -> Optional[Dict[str, Any]]:
        try:
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
            if data.lesson_plan is not None:
                updates.append("lesson_plan = ?")
                params.append(json.dumps(data.lesson_plan.dict()))

            updates.append("updated_at = ?")
            params.append(current_time)

            # Add topic_id as the last parameter
            params.append(topic_id)

            if not updates:
                return None

            result = db.execute(f"""
                UPDATE topics
                SET {", ".join(updates)}
                WHERE topic_id = ? 
                RETURNING topic_id, user_id, title, description, lesson_plan, created_at, updated_at
            """, params)

            if not result.fetchall():
                raise HTTPException(status_code=404, detail="Topic not found")

            row = result.fetchone()
            # Log the row data for debugging
            logger.debug(f"Row data: {row}")
            
            return {
                "user_id": row[1],
                "topic_id": row[0],
                "title": row[2],
                "description": row[3],
                "lesson_plan": json.loads(row[4]) if row[4] else {
                    "mainTopics": [],
                    "currentTopic": "",
                    "completedTopics": []
                },
                "created_at": int(row[5]),  # Ensure integer conversion
                "updated_at": int(row[6])   # Ensure integer conversion
            }
        except Exception as e:
            logger.error(f"Error updating topic {topic_id}")
            logger.error(f"Error type: {type(e)}")
            logger.error(f"Error message: {str(e)}")
            logger.exception(e)
            raise HTTPException(
                status_code=500,
                detail={"error": str(e), "type": str(type(e))}
            )

    @staticmethod
    async def delete_topic(topic_id: str, db) -> None:
        """Delete a topic."""
        try:
            # First check if the topic exists
            result = db.execute("""
                SELECT topic_id FROM topics 
                WHERE topic_id = ?
            """, [topic_id])
            
            if not result.fetchone():
                raise HTTPException(status_code=404, detail="Topic not found")
            
            # Delete the topic
            db.execute("""
                DELETE FROM topics
                WHERE topic_id = ?
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
