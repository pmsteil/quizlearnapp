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
    description: str
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
    description: str
    lessonPlan: dict
    createdAt: int
    updatedAt: int

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
                SELECT id, user_id, title, description, progress, lesson_plan, created_at, updated_at 
                FROM topics
                WHERE user_id = ?
                ORDER BY created_at DESC
            """, [user_id])
            logger.info(f"Found {len(result.rows) if result.rows else 0} topics")

            topics = []
            for row in result.rows:
                try:
                    topic_dict = dict(row)
                    logger.debug(f"Processing topic: {topic_dict}")
                    
                    # Convert snake_case to camelCase for frontend
                    topic_dict["userId"] = topic_dict.pop("user_id")
                    topic_dict["createdAt"] = topic_dict.pop("created_at")
                    topic_dict["updatedAt"] = topic_dict.pop("updated_at")
                    
                    # Handle lesson_plan - if None, initialize with default structure
                    lesson_plan = topic_dict.pop("lesson_plan")
                    if not lesson_plan:
                        lesson_plan = {
                            "mainTopics": [],
                            "currentTopic": "",
                            "completedTopics": []
                        }
                    elif isinstance(lesson_plan, str):
                        try:
                            lesson_plan = json.loads(lesson_plan)
                        except json.JSONDecodeError:
                            logger.error(f"Invalid lesson_plan JSON for topic {topic_dict['id']}")
                            lesson_plan = {
                                "mainTopics": [],
                                "currentTopic": "",
                                "completedTopics": []
                            }
                    topic_dict["lessonPlan"] = lesson_plan
                    
                    topics.append(topic_dict)
                except Exception as e:
                    logger.error(f"Error processing topic row: {row}")
                    logger.error(f"Error: {str(e)}")
                    logger.exception(e)
                    continue

            return topics
        except HTTPException as e:
            logger.error(f"HTTP error in get_user_topics: {str(e)}")
            raise e
        except Exception as e:
            logger.error("Error in get_user_topics")
            logger.error(f"Error type: {type(e)}")
            logger.error(f"Error message: {str(e)}")
            logger.exception(e)
            raise HTTPException(status_code=500, detail={"error": str(e), "type": str(type(e))})

    @staticmethod
    async def get_topic_by_id(topic_id: str) -> Optional[Dict[str, Any]]:
        db = get_db()
        result = db.execute("""
            SELECT * FROM topics
            WHERE id = ? AND deleted_at IS NULL
        """, [topic_id])
        return dict(result.rows[0]) if result.rows else None

    @classmethod
    def create_topic(cls, topic: TopicCreate) -> Topic:
        """Create a new topic."""
        try:
            logger.info(f"Creating topic with data: {topic.dict()}")
            lesson_plan = topic.get_lesson_plan()
            logger.info(f"Using lesson plan: {lesson_plan.dict()}")
            
            query = """
                INSERT INTO topics (id, user_id, title, description, lesson_plan, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """
            current_time = int(time.time())
            topic_id = str(uuid.uuid4())
            values = [
                topic_id,
                topic.userId,
                topic.title,
                topic.description,
                json.dumps(lesson_plan.dict()),
                current_time,
                current_time
            ]
            logger.info(f"Executing query with values: {values}")
            
            cls.db.execute(query, values)
            
            # Fetch the created topic
            result = cls.db.execute("SELECT * FROM topics WHERE id = ?", [topic_id])
            if not result.rows:
                raise HTTPException(status_code=500, detail="Failed to create topic")
            
            topic_dict = dict(result.rows[0])
            # Convert snake_case to camelCase for frontend
            topic_dict["userId"] = topic_dict.pop("user_id")
            topic_dict["createdAt"] = topic_dict.pop("created_at")
            topic_dict["updatedAt"] = topic_dict.pop("updated_at")
            
            # Parse lesson_plan JSON
            lesson_plan = topic_dict.pop("lesson_plan")
            if isinstance(lesson_plan, str):
                try:
                    lesson_plan = json.loads(lesson_plan)
                except json.JSONDecodeError:
                    lesson_plan = {
                        "mainTopics": [],
                        "currentTopic": "",
                        "completedTopics": []
                    }
            topic_dict["lessonPlan"] = lesson_plan
            
            return Topic(**topic_dict)
        except ValidationError as e:
            logger.error(f"Validation error: {str(e)}")
            raise HTTPException(status_code=422, detail=str(e))
        except Exception as e:
            logger.error("Error in create_topic")
            logger.error(f"Error type: {type(e)}")
            logger.error(f"Error message: {str(e)}")
            logger.exception(e)
            raise HTTPException(status_code=500, detail={"error": str(e), "type": str(type(e))})

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
            WHERE id = ? AND deleted_at IS NULL
            RETURNING *
        """, params)

        return dict(result.rows[0]) if result.rows else None

    @staticmethod
    async def delete_topic(topic_id: str) -> None:
        db = get_db()
        current_time = int(time.time())
        db.execute("""
            UPDATE topics
            SET deleted_at = ?
            WHERE id = ?
        """, [current_time, topic_id])
