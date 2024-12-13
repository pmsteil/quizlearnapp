from datetime import datetime
from typing import List, Optional
from backend.src.lib.db.client import dbClient
from backend.src.lib.utils.auth import generateId
from backend.src.lib.utils.dates import now, to_unix_timestamp, from_unix_timestamp
from shared.src.types import Progress, TopicProgress

class ProgressModel:
    @staticmethod
    async def create(
        userId: str,
        topicId: str,
        questionId: str,
        isCorrect: bool
    ) -> Progress:
        id = generateId()
        timestamp = to_unix_timestamp(now())

        try:
            result = await dbClient.execute(
                sql="""
                    INSERT INTO user_progress (id, user_id, topic_id, question_id, is_correct, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                    RETURNING *
                """,
                args=[id, userId, topicId, questionId, 1 if isCorrect else 0, timestamp]
            )

            if not result.rows or len(result.rows) == 0:
                raise Exception('Failed to create progress entry')

            return ProgressModel.mapProgress(result.rows[0])
        except Exception as e:
            print('Error creating progress:', e)
            raise e

    @staticmethod
    async def getByTopicId(userId: str, topicId: str) -> List[Progress]:
        try:
            result = await dbClient.execute(
                sql='SELECT * FROM user_progress WHERE user_id = ? AND topic_id = ? ORDER BY created_at DESC',
                args=[userId, topicId]
            )

            return [ProgressModel.mapProgress(row) for row in (result.rows or [])]
        except Exception as e:
            print('Error getting progress:', e)
            raise e

    @staticmethod
    async def getTopicProgress(topicId: str) -> TopicProgress:
        try:
            result = await dbClient.execute(
                sql="""
                    SELECT
                        (SELECT COUNT(*) FROM user_progress WHERE topic_id = ? AND is_correct = 1) as correct_answers,
                        (SELECT COUNT(*) FROM user_progress WHERE topic_id = ? AND is_correct = 0) as incorrect_answers,
                        (SELECT COUNT(*) FROM questions WHERE topic_id = ?) as total_questions,
                        (SELECT ROUND((julianday('now') - julianday(MIN(created_at))) * 24 * 60)
                         FROM user_progress
                         WHERE topic_id = ?) as time_spent_minutes
                """,
                args=[topicId, topicId, topicId, topicId]
            )

            row = result.rows[0] if result.rows else None
            return {
                'correctAnswers': int(row.correct_answers if row and row.correct_answers else 0),
                'incorrectAnswers': int(row.incorrect_answers if row and row.incorrect_answers else 0),
                'totalQuestions': int(row.total_questions if row and row.total_questions else 0),
                'timeSpentMinutes': int(row.time_spent_minutes if row and row.time_spent_minutes else 0)
            }
        except Exception as e:
            print('Error getting topic progress:', e)
            raise e

    @staticmethod
    def mapProgress(row: any) -> Progress:
        try:
            return {
                'id': row.id,
                'userId': row.user_id,
                'topicId': row.topic_id,
                'questionId': row.question_id,
                'isCorrect': bool(row.is_correct),
                'createdAt': from_unix_timestamp(row.created_at)
            }
        except Exception as e:
            print('Error mapping progress:', e)
            raise e
