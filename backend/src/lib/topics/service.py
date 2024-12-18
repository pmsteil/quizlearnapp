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

class LessonUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    order_index: int | None = None
    parent_lesson_id: str | None = None

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
                    t.progress,
                    t.created_at,
                    t.updated_at
                FROM topics t
                WHERE t.topic_id = ?
            """, [topic_id])

            row = result.fetchone()
            if not row:
                return None

            # Ensure topic has lessons
            TopicService.ensure_topic_has_lessons(topic_id, db)

            return {
                "user_id": row[0],
                "topic_id": row[1],
                "title": row[2],
                "description": row[3],
                "progress": row[4],
                "createdAt": row[5],
                "updatedAt": row[6],
                "lessonPlan": {
                    "mainTopics": [],
                    "currentTopic": "",
                    "completedTopics": []
                }
            }
        except Exception as e:
            logger.error(f"Error getting topic {topic_id}")
            logger.error(f"Error type: {type(e)}")
            logger.error(f"Error message: {str(e)}")
            logger.exception(e)
            raise HTTPException(
                status_code=500,
                detail={"error": str(e), "type": str(type(e))}
            )

    @staticmethod
    def ensure_topic_has_lessons(topic_id: str, db) -> None:
        """Ensure a topic has lessons, create default ones if none exist."""
        logger.info(f"Checking lessons for topic {topic_id}")
        
        # Check if topic has any lessons
        result = db.execute("""
            SELECT COUNT(*) FROM topic_lessons WHERE topic_id = ?
        """, [topic_id])
        count = result.fetchone()[0]
        
        if count == 0:
            logger.info(f"No lessons found for topic {topic_id}, creating defaults")
            TopicService.create_default_lessons(topic_id, db)
        else:
            logger.info(f"Topic {topic_id} already has {count} lessons")

    @staticmethod
    async def get_topic_lessons(topic_id: str, db) -> List[Dict[str, Any]]:
        """Get all lessons for a topic."""
        try:
            result = db.execute("""
                WITH RECURSIVE lesson_tree AS (
                    -- Base case: Get root lessons (no parent)
                    SELECT 
                        lesson_id,
                        topic_id,
                        title,
                        content,
                        order_index,
                        parent_lesson_id,
                        COALESCE(created_at, unixepoch()) as created_at,
                        COALESCE(updated_at, unixepoch()) as updated_at,
                        0 as level
                    FROM topic_lessons
                    WHERE topic_id = ? AND parent_lesson_id IS NULL
                    
                    UNION ALL
                    
                    -- Recursive case: Get child lessons
                    SELECT 
                        t.lesson_id,
                        t.topic_id,
                        t.title,
                        t.content,
                        t.order_index,
                        t.parent_lesson_id,
                        COALESCE(t.created_at, unixepoch()) as created_at,
                        COALESCE(t.updated_at, unixepoch()) as updated_at,
                        lt.level + 1
                    FROM topic_lessons t
                    JOIN lesson_tree lt ON t.parent_lesson_id = lt.lesson_id
                )
                SELECT * FROM lesson_tree
                ORDER BY level, order_index;
            """, [topic_id])
            
            lessons = []
            for row in result.fetchall():
                lesson = {
                    "lesson_id": row[0],
                    "topic_id": row[1],
                    "title": row[2],
                    "content": row[3],
                    "order_index": row[4],
                    "parent_lesson_id": row[5],
                    "created_at": row[6],
                    "updated_at": row[7]
                }
                lessons.append(lesson)
            
            # Return flat list of lessons
            return lessons
        except Exception as e:
            logger.error(f"Error getting lessons for topic {topic_id}")
            logger.error(f"Error type: {type(e)}")
            logger.error(f"Error message: {str(e)}")
            logger.exception(e)
            raise HTTPException(status_code=500, detail={"error": str(e), "type": str(type(e))})

    @staticmethod
    async def get_topic_progress(topic_id: str, user_id: str, db) -> List[Dict[str, Any]]:
        """Get progress for all lessons in a topic."""
        try:
            result = db.execute("""
                SELECT 
                    p.progress_id,
                    p.user_id,
                    p.lesson_id,
                    p.status,
                    p.last_interaction_at,
                    p.completion_date
                FROM user_lesson_progress p
                JOIN topic_lessons l ON l.lesson_id = p.lesson_id
                WHERE l.topic_id = ? AND p.user_id = ?
            """, [topic_id, user_id])
            
            progress = []
            for row in result.fetchall():
                progress_item = {
                    "progress_id": row[0],
                    "user_id": row[1],
                    "lesson_id": row[2],
                    "status": row[3],
                    "last_interaction_at": row[4],
                    "completion_date": row[5]
                }
                progress.append(progress_item)
            
            return progress
        except Exception as e:
            logger.error(f"Error getting progress for topic {topic_id}")
            logger.error(f"Error type: {type(e)}")
            logger.error(f"Error message: {str(e)}")
            logger.exception(e)
            raise HTTPException(
                status_code=500,
                detail={"error": str(e), "type": str(type(e))}
            )

    @staticmethod
    def create_default_lessons(topic_id: str, db) -> None:
        """Create default lessons for a new topic."""
        logger.info(f"Creating default lessons for topic {topic_id}")
        current_time = int(time.time())
        
        # Define default lessons structure
        default_lessons = [
            {
                "id": str(uuid.uuid4()),
                "title": "Getting Started",
                "content": "Welcome to your new topic! Let's begin learning.",
                "order_index": 0,
                "parent_id": None,
                "created_at": current_time,
                "updated_at": current_time,
                "children": [
                    {
                        "id": str(uuid.uuid4()),
                        "title": "Introduction",
                        "content": "This is an introduction to your topic.",
                        "order_index": 0,
                        "created_at": current_time,
                        "updated_at": current_time
                    },
                    {
                        "id": str(uuid.uuid4()),
                        "title": "Key Concepts",
                        "content": "Here are the key concepts you'll learn.",
                        "order_index": 1,
                        "created_at": current_time,
                        "updated_at": current_time
                    }
                ]
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Core Material",
                "content": "Let's dive into the main content.",
                "order_index": 1,
                "parent_id": None,
                "created_at": current_time,
                "updated_at": current_time,
                "children": [
                    {
                        "id": str(uuid.uuid4()),
                        "title": "Basic Principles",
                        "content": "Understanding the fundamentals.",
                        "order_index": 0,
                        "created_at": current_time,
                        "updated_at": current_time
                    },
                    {
                        "id": str(uuid.uuid4()),
                        "title": "Advanced Topics",
                        "content": "Exploring more complex ideas.",
                        "order_index": 1,
                        "created_at": current_time,
                        "updated_at": current_time
                    }
                ]
            }
        ]

        # Insert lessons into database
        try:
            for main_lesson in default_lessons:
                # Insert main lesson
                db.execute("""
                    INSERT INTO topic_lessons (
                        lesson_id, topic_id, title, content, 
                        order_index, parent_lesson_id, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, [
                    main_lesson["id"],
                    topic_id,
                    main_lesson["title"],
                    main_lesson["content"],
                    main_lesson["order_index"],
                    None,
                    main_lesson["created_at"],
                    main_lesson["updated_at"]
                ])

                # Insert child lessons
                for child in main_lesson["children"]:
                    db.execute("""
                        INSERT INTO topic_lessons (
                            lesson_id, topic_id, title, content, 
                            order_index, parent_lesson_id, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, [
                        child["id"],
                        topic_id,
                        child["title"],
                        child["content"],
                        child["order_index"],
                        main_lesson["id"],
                        child["created_at"],
                        child["updated_at"]
                    ])
            
            logger.info("Successfully created default lessons")
        except Exception as e:
            logger.error("Error creating default lessons")
            logger.error(f"Error type: {type(e)}")
            logger.error(f"Error message: {str(e)}")
            logger.exception(e)
            raise e

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
                
                # Create default lessons
                logger.info("Creating default lessons")
                current_time = int(time.time())
                
                # Define default lessons structure
                default_lessons = [
                    {
                        "id": str(uuid.uuid4()),
                        "title": "Getting Started",
                        "content": "Welcome to your new topic! Let's begin learning.",
                        "order_index": 0,
                        "parent_id": None,
                        "created_at": current_time,
                        "updated_at": current_time,
                        "children": [
                            {
                                "id": str(uuid.uuid4()),
                                "title": "Introduction",
                                "content": "This is an introduction to your topic.",
                                "order_index": 0,
                                "created_at": current_time,
                                "updated_at": current_time
                            },
                            {
                                "id": str(uuid.uuid4()),
                                "title": "Key Concepts",
                                "content": "Here are the key concepts you'll learn.",
                                "order_index": 1,
                                "created_at": current_time,
                                "updated_at": current_time
                            }
                        ]
                    },
                    {
                        "id": str(uuid.uuid4()),
                        "title": "Core Material",
                        "content": "Let's dive into the main content.",
                        "order_index": 1,
                        "parent_id": None,
                        "created_at": current_time,
                        "updated_at": current_time,
                        "children": [
                            {
                                "id": str(uuid.uuid4()),
                                "title": "Basic Principles",
                                "content": "Understanding the fundamentals.",
                                "order_index": 0,
                                "created_at": current_time,
                                "updated_at": current_time
                            },
                            {
                                "id": str(uuid.uuid4()),
                                "title": "Advanced Topics",
                                "content": "Exploring more complex ideas.",
                                "order_index": 1,
                                "created_at": current_time,
                                "updated_at": current_time
                            }
                        ]
                    }
                ]

                # Insert lessons into database
                for main_lesson in default_lessons:
                    # Insert main lesson
                    db.execute("""
                        INSERT INTO topic_lessons (
                            lesson_id, topic_id, title, content, 
                            order_index, parent_lesson_id, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, [
                        main_lesson["id"],
                        topic_id,
                        main_lesson["title"],
                        main_lesson["content"],
                        main_lesson["order_index"],
                        None,
                        main_lesson["created_at"],
                        main_lesson["updated_at"]
                    ])

                    # Insert child lessons
                    for child in main_lesson["children"]:
                        db.execute("""
                            INSERT INTO topic_lessons (
                                lesson_id, topic_id, title, content, 
                                order_index, parent_lesson_id, created_at, updated_at
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """, [
                            child["id"],
                            topic_id,
                            child["title"],
                            child["content"],
                            child["order_index"],
                            main_lesson["id"],
                            child["created_at"],
                            child["updated_at"]
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

    @staticmethod
    async def update_lesson(lesson_id: str, topic_id: str, data: LessonUpdate, db) -> Dict[str, Any]:
        """Update a lesson."""
        try:
            logger.info(f"Updating lesson {lesson_id} in topic {topic_id}")
            
            # First check if lesson exists and belongs to the topic
            result = db.execute("""
                SELECT lesson_id FROM topic_lessons 
                WHERE lesson_id = ? AND topic_id = ?
            """, [lesson_id, topic_id])
            
            lesson = result.fetchone()
            if not lesson:
                logger.error(f"Lesson {lesson_id} not found in topic {topic_id}")
                raise HTTPException(status_code=404, detail="Lesson not found")
            
            # Build update query dynamically based on provided fields
            update_fields = []
            params = []
            
            if data.title is not None:
                update_fields.append("title = ?")
                params.append(data.title)
            
            if data.content is not None:
                update_fields.append("content = ?")
                params.append(data.content)
            
            if data.order_index is not None:
                update_fields.append("order_index = ?")
                params.append(data.order_index)
            
            if data.parent_lesson_id is not None:
                update_fields.append("parent_lesson_id = ?")
                params.append(data.parent_lesson_id)
            
            if not update_fields:
                logger.warning("No fields to update")
                return None
            
            # Add updated_at timestamp
            update_fields.append("updated_at = ?")
            params.extend([int(time.time()), lesson_id, topic_id])
            
            # Execute update
            query = f"""
                UPDATE topic_lessons 
                SET {", ".join(update_fields)}
                WHERE lesson_id = ? AND topic_id = ?
                RETURNING *
            """
            
            result = db.execute(query, params)
            updated_lesson = result.fetchone()
            
            if not updated_lesson:
                logger.error(f"Failed to update lesson {lesson_id}")
                raise HTTPException(status_code=500, detail="Failed to update lesson")
            
            # Convert row to dict
            return {
                "lesson_id": updated_lesson[0],
                "topic_id": updated_lesson[1],
                "title": updated_lesson[2],
                "content": updated_lesson[3],
                "order_index": updated_lesson[4],
                "parent_lesson_id": updated_lesson[5],
                "created_at": updated_lesson[6],
                "updated_at": updated_lesson[7]
            }
            
        except HTTPException as e:
            raise e
        except Exception as e:
            logger.error(f"Error updating lesson {lesson_id}")
            logger.error(f"Error type: {type(e)}")
            logger.error(f"Error message: {str(e)}")
            logger.exception(e)
            raise HTTPException(
                status_code=500,
                detail={"error": str(e), "type": str(type(e))}
            )
