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
        topic_id = generateId()
        timestamp = to_unix_timestamp(now())

        try:
            result = await dbClient.execute(
                sql="""
                    INSERT INTO topics (topic_id, user_id, title, description, lesson_plan, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    RETURNING *
                """,
                args=[topic_id, userId, title, description, json.dumps(lessonPlan), timestamp, timestamp]
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
    async def getById(topic_id: str) -> Optional[Topic]:
        try:
            result = await dbClient.execute(
                sql='SELECT * FROM topics WHERE topic_id = ?',
                args=[topic_id]
            )

            if not result.rows or len(result.rows) == 0:
                return None

            return TopicModel.mapTopic(result.rows[0])
        except Exception as e:
            print('Error getting topic:', e)
            raise e

    @staticmethod
    async def update(
        topic_id: str,
        title: Optional[str] = None,
        description: Optional[str] = None,
        lessonPlan: Optional[LessonPlan] = None
    ) -> Topic:
        timestamp = int(datetime.now().timestamp())

        try:
            # First get the existing topic
            existing = await TopicModel.getById(topic_id)
            if not existing:
                raise Exception('Topic not found')

            # Build update query dynamically based on provided fields
            updates = []
            params = []
            if title is not None:
                updates.append("title = ?")
                params.append(title)
            if description is not None:
                updates.append("description = ?")
                params.append(description)
            if lessonPlan is not None:
                updates.append("lesson_plan = ?")
                params.append(json.dumps(lessonPlan))

            # Always update the timestamp
            updates.append("updated_at = ?")
            params.append(timestamp)

            # Add topic_id as the last parameter for WHERE clause
            params.append(topic_id)

            # If no fields to update, return existing topic
            if not updates:
                return existing

            # Print debug info
            print("Updating topic with:", {
                "updates": updates,
                "params": params,
                "sql": f"""
                    UPDATE topics
                    SET {", ".join(updates)}
                    WHERE topic_id = ?
                    RETURNING *
                """
            })

            result = await dbClient.execute(
                sql=f"""
                    UPDATE topics
                    SET {", ".join(updates)}
                    WHERE topic_id = ?
                    RETURNING *
                """,
                args=params
            )

            if not result.rows or len(result.rows) == 0:
                raise Exception('Topic not found')

            return TopicModel.mapTopic(result.rows[0])
        except Exception as e:
            print('Error updating topic:', e)
            raise e

    @staticmethod
    async def delete(topic_id: str) -> bool:
        try:
            result = await dbClient.execute(
                sql='DELETE FROM topics WHERE topic_id = ?',
                args=[topic_id]
            )

            return result.rowcount > 0
        except Exception as e:
            print('Error deleting topic:', e)
            raise e

    @staticmethod
    def mapTopic(row: any) -> Topic:
        try:
            return {
                'topic_id': row.topic_id,
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
