from typing import List, Optional, Dict, Any
import time
import uuid
from src.lib.db import get_db
from pydantic import BaseModel

class LessonPlan(BaseModel):
    mainTopics: List[dict]
    currentTopic: str
    completedTopics: List[str]

class TopicCreate(BaseModel):
    userId: str
    title: str
    description: str
    lessonPlan: LessonPlan

class TopicUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    lessonPlan: LessonPlan | None = None

class TopicService:
    @staticmethod
    async def get_user_topics(user_id: str) -> List[Dict[str, Any]]:
        db = get_db()
        result = db.execute("""
            SELECT * FROM topics
            WHERE user_id = ? AND deleted_at IS NULL
            ORDER BY created_at DESC
        """, [user_id])
        return [dict(row) for row in result.rows]

    @staticmethod
    async def get_topic_by_id(topic_id: str) -> Optional[Dict[str, Any]]:
        db = get_db()
        result = db.execute("""
            SELECT * FROM topics
            WHERE id = ? AND deleted_at IS NULL
        """, [topic_id])
        return dict(result.rows[0]) if result.rows else None

    @staticmethod
    async def create_topic(data: TopicCreate) -> Dict[str, Any]:
        db = get_db()
        topic_id = str(uuid.uuid4())
        current_time = int(time.time())

        result = db.execute("""
            INSERT INTO topics (
                id, user_id, title, description, lesson_plan,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            RETURNING *
        """, [
            topic_id,
            data.userId,
            data.title,
            data.description,
            data.lessonPlan.json(),
            current_time,
            current_time
        ])

        return dict(result.rows[0])

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
