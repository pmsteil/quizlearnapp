from typing import List, Optional
from datetime import datetime
from src.lib.db import get_db

class TopicService:
    @staticmethod
    async def get_topics(user_id: Optional[int] = None) -> List[dict]:
        db = get_db()
        query = """
            SELECT id, title, description, created_at, updated_at, user_id
            FROM topics
            WHERE deleted_at IS NULL
        """
        params = []

        if user_id:
            query += " AND user_id = ?"
            params.append(user_id)

        query += " ORDER BY created_at DESC"

        topics = await db.fetch_all(query, params)
        return [dict(topic) for topic in topics]

    @staticmethod
    async def get_topic_by_id(topic_id: int) -> Optional[dict]:
        db = get_db()
        query = """
            SELECT id, title, description, created_at, updated_at, user_id
            FROM topics
            WHERE id = ? AND deleted_at IS NULL
        """
        topic = await db.fetch_one(query, [topic_id])
        return dict(topic) if topic else None

    @staticmethod
    async def create_topic(title: str, description: str, user_id: int) -> dict:
        db = get_db()
        query = """
            INSERT INTO topics (title, description, user_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            RETURNING id, title, description, created_at, updated_at, user_id
        """
        now = datetime.utcnow()
        topic = await db.fetch_one(query, [title, description, user_id, now, now])
        return dict(topic)

    @staticmethod
    async def update_topic(topic_id: int, title: str, description: str) -> Optional[dict]:
        db = get_db()
        query = """
            UPDATE topics
            SET title = ?, description = ?, updated_at = ?
            WHERE id = ? AND deleted_at IS NULL
            RETURNING id, title, description, created_at, updated_at, user_id
        """
        now = datetime.utcnow()
        topic = await db.fetch_one(query, [title, description, now, topic_id])
        return dict(topic) if topic else None

    @staticmethod
    async def delete_topic(topic_id: int) -> bool:
        db = get_db()
        query = """
            UPDATE topics
            SET deleted_at = ?
            WHERE id = ? AND deleted_at IS NULL
        """
        now = datetime.utcnow()
        result = await db.execute(query, [now, topic_id])
        return result.rowcount > 0
