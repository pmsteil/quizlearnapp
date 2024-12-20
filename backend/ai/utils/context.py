from typing import Dict, Any, Optional
from libsql_client import Client
import json
from datetime import datetime

class ContextLoader:
    def __init__(self, db: Client):
        self.db = db

    async def load_user_context(self, user_id: str) -> Dict[str, Any]:
        """Load user information for context"""
        result = self.db.execute("""
            SELECT name, default_difficulty, about
            FROM users
            WHERE user_id = ?
        """, [user_id])
        
        if not result.rows:
            raise ValueError(f"User {user_id} not found")
        
        user = result.rows[0]
        return {
            "user": {
                "name": user[0],  # name
                "defaultDifficulty": user[1],  # default_difficulty
                "about": user[2] or ""  # about
            }
        }

    async def load_lesson_context(self, lesson_id: str) -> Dict[str, Any]:
        """Load lesson information for context"""
        result = self.db.execute("""
            SELECT 
                tl.title,
                tl.content,
                t.title as topic_title,
                t.description as topic_description,
                parent.title as parent_title,
                parent.content as parent_content
            FROM topic_lessons tl
            JOIN topics t ON t.topic_id = tl.topic_id
            LEFT JOIN topic_lessons parent ON parent.lesson_id = tl.parent_lesson_id
            WHERE tl.lesson_id = ?
        """, [lesson_id])
        
        if not result.rows:
            raise ValueError(f"Lesson {lesson_id} not found")
        
        lesson = result.rows[0]
        return {
            "lesson_title": lesson[0],
            "lesson_content": lesson[1],
            "topic_title": lesson[2],
            "topic_description": lesson[3] or "",
            "parent_lesson": {
                "title": lesson[4],
                "content": lesson[5]
            } if lesson[4] else None
        }

    async def load_progress_context(self, user_id: str, lesson_id: str) -> Dict[str, Any]:
        """Load user's progress information for context"""
        result = self.db.execute("""
            SELECT 
                questions_total,
                questions_correct,
                progress_percent,
                status,
                chat_history
            FROM user_topic_lessons
            WHERE user_id = ? AND lesson_id = ?
        """, [user_id, lesson_id])
        
        if not result.rows:
            return {
                "questions_total": 0,
                "questions_correct": 0,
                "progress_percent": 0,
                "status": "not_started",
                "chat_history": []
            }
        
        progress = result.rows[0]
        return {
            "questions_total": progress[0],
            "questions_correct": progress[1],
            "progress_percent": progress[2],
            "status": progress[3],
            "chat_history": json.loads(progress[4]) if progress[4] else []
        }

    async def load_topic_context(self, topic_id: str) -> Dict[str, Any]:
        """Load topic information for context"""
        # Get topic info
        topic_result = self.db.execute("""
            SELECT title, description
            FROM topics
            WHERE topic_id = ?
        """, [topic_id])
        
        if not topic_result.rows:
            raise ValueError(f"Topic {topic_id} not found")
        
        topic = topic_result.rows[0]
        
        # Get lessons
        lessons_result = self.db.execute("""
            SELECT title, content, order_index
            FROM topic_lessons
            WHERE topic_id = ?
            ORDER BY order_index ASC
        """, [topic_id])
        
        return {
            "topic_title": topic[0],
            "topic_description": topic[1] or "",
            "lessons": [
                {
                    "title": lesson[0],
                    "content": lesson[1],
                    "order_index": lesson[2]
                }
                for lesson in lessons_result.rows
            ]
        }

    async def load_full_context(
        self,
        user_id: str,
        lesson_id: Optional[str] = None,
        topic_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Load all context information"""
        context = await self.load_user_context(user_id)
        
        if lesson_id:
            lesson_context = await self.load_lesson_context(lesson_id)
            progress_context = await self.load_progress_context(user_id, lesson_id)
            context.update(lesson_context)
            context.update(progress_context)
        
        if topic_id:
            topic_context = await self.load_topic_context(topic_id)
            context.update(topic_context)
        
        # Add timestamp
        context["timestamp"] = int(datetime.now().timestamp())
        
        return context

    async def load_full_context_v2(
        self,
        user_id: str,
        lesson_id: Optional[str] = None,
        topic_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Load full context for AI agents"""
        context = {
            "user": await self.load_user_data(user_id)
        }
        
        if lesson_id:
            context["lesson"] = await self.load_lesson_data(lesson_id)
            context["progress"] = await self.load_progress_data(user_id, lesson_id)
        
        if topic_id:
            context["topic"] = await self.load_topic_data(topic_id)
        
        return context
    
    async def load_user_data(self, user_id: str) -> Dict[str, Any]:
        """Load user context"""
        result = self.db.execute("""
            SELECT name, default_difficulty, about
            FROM users
            WHERE id = ?
        """, [user_id])
        
        if not result.rows:
            return {}
        
        row = result.rows[0]
        return {
            "name": row[0],
            "default_difficulty": row[1],
            "about": row[2]
        }
    
    async def load_lesson_data(self, lesson_id: str) -> Dict[str, Any]:
        """Load lesson context"""
        result = self.db.execute("""
            SELECT title, content, topic_id
            FROM lessons
            WHERE id = ?
        """, [lesson_id])
        
        if not result.rows:
            return {}
        
        row = result.rows[0]
        return {
            "title": row[0],
            "content": row[1],
            "topic_id": row[2]
        }
    
    async def load_progress_data(
        self,
        user_id: str,
        lesson_id: str
    ) -> Dict[str, Any]:
        """Load progress context"""
        result = self.db.execute("""
            SELECT questions_total, questions_correct, progress_percent
            FROM user_topic_lessons
            WHERE user_id = ? AND lesson_id = ?
        """, [user_id, lesson_id])
        
        if not result.rows:
            return {
                "questions_total": 0,
                "questions_correct": 0,
                "progress_percent": 0
            }
        
        row = result.rows[0]
        return {
            "questions_total": row[0],
            "questions_correct": row[1],
            "progress_percent": row[2]
        }
    
    async def load_topic_data(self, topic_id: str) -> Dict[str, Any]:
        """Load topic context"""
        result = self.db.execute("""
            SELECT title, description
            FROM topics
            WHERE id = ?
        """, [topic_id])
        
        if not result.rows:
            return {}
        
        row = result.rows[0]
        return {
            "title": row[0],
            "description": row[1]
        }
