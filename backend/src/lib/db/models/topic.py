from datetime import datetime
import json
from typing import List, Optional
from backend.src.lib.db.client import dbClient
from backend.src.lib.utils.auth import generateId
from backend.src.lib.utils.dates import now, to_unix_timestamp, from_unix_timestamp
from shared.src.types import Topic, LessonPlan

class TopicModel:
    @staticmethod
    async def create(
        userId: str,
        title: str,
        description: str,
        lessonPlan: LessonPlan
    ) -> Topic:
        id = generateId()
        timestamp = to_unix_timestamp(now())

        try:
            result = await dbClient.execute(
                sql="""
                    INSERT INTO topics (id, user_id, title, description, lesson_plan, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    RETURNING *
                """,
                args=[id, userId, title, description, json.dumps(lessonPlan), timestamp, timestamp]
            )

            if not result.rows or len(result.rows) == 0:
                raise Exception('Failed to create topic')

            return TopicModel.mapTopic(result.rows[0])
        except Exception as e:
            print('Error creating topic:', e)
            raise e

    @staticmethod
    async def getByUserId(userId: str) -> List[Topic]:
        try:
            result = await dbClient.execute(
                sql='SELECT * FROM topics WHERE user_id = ? ORDER BY created_at DESC',
                args=[userId]
            )

            return [TopicModel.mapTopic(row) for row in (result.rows or [])]
        except Exception as e:
            print('Error getting topics:', e)
            raise e

    @staticmethod
    async def getById(id: str) -> Optional[Topic]:
        try:
            result = await dbClient.execute(
                sql='SELECT * FROM topics WHERE id = ?',
                args=[id]
            )

            if not result.rows or len(result.rows) == 0:
                return None

            return TopicModel.mapTopic(result.rows[0])
        except Exception as e:
            print('Error getting topic:', e)
            raise e

    @staticmethod
    async def update(
        id: str,
        title: str,
        description: str,
        lessonPlan: LessonPlan
    ) -> Topic:
        timestamp = int(datetime.now().timestamp())

        try:
            result = await dbClient.execute(
                sql="""
                    UPDATE topics
                    SET title = ?, description = ?, lesson_plan = ?, updated_at = ?
                    WHERE id = ?
                    RETURNING *
                """,
                args=[title, description, json.dumps(lessonPlan), timestamp, id]
            )

            if not result.rows or len(result.rows) == 0:
                raise Exception('Topic not found')

            return TopicModel.mapTopic(result.rows[0])
        except Exception as e:
            print('Error updating topic:', e)
            raise e

    @staticmethod
    async def delete(id: str) -> bool:
        try:
            result = await dbClient.execute(
                sql='DELETE FROM topics WHERE id = ?',
                args=[id]
            )

            return result.rowcount > 0
        except Exception as e:
            print('Error deleting topic:', e)
            raise e

    @staticmethod
    def mapTopic(row: any) -> Topic:
        try:
            return {
                'id': row.id,
                'userId': row.user_id,
                'title': row.title,
                'description': row.description,
                'lessonPlan': json.loads(row.lesson_plan),
                'createdAt': from_unix_timestamp(row.created_at),
                'updatedAt': from_unix_timestamp(row.updated_at)
            }
        except Exception as e:
            print('Error mapping topic:', e)
            raise e