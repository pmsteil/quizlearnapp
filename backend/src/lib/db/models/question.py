from datetime import datetime
import json
from typing import List, Optional
from backend.src.lib.db.client import dbClient
from backend.src.lib.utils.auth import generateId
from backend.src.lib.utils.dates import now, to_unix_timestamp, from_unix_timestamp
from shared.src.types import Question

class QuestionModel:
    @staticmethod
    async def create(
        topicId: str,
        text: str,
        options: List[str],
        correctAnswer: int,
        explanation: str
    ) -> Question:
        id = generateId()
        timestamp = to_unix_timestamp(now())

        try:
            result = await dbClient.execute(
                sql="""
                    INSERT INTO questions (id, topic_id, text, options, correct_answer, explanation, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    RETURNING *
                """,
                args=[id, topicId, text, json.dumps(options), correctAnswer, explanation, timestamp, timestamp]
            )

            if not result.rows or len(result.rows) == 0:
                raise Exception('Failed to create question')

            return QuestionModel.mapQuestion(result.rows[0])
        except Exception as e:
            print('Error creating question:', e)
            raise e

    @staticmethod
    async def getByTopicId(topicId: str) -> List[Question]:
        try:
            result = await dbClient.execute(
                sql='SELECT * FROM questions WHERE topic_id = ? ORDER BY created_at ASC',
                args=[topicId]
            )

            return [QuestionModel.mapQuestion(row) for row in (result.rows or [])]
        except Exception as e:
            print('Error getting questions:', e)
            raise e

    @staticmethod
    async def getById(id: str) -> Optional[Question]:
        try:
            result = await dbClient.execute(
                sql='SELECT * FROM questions WHERE id = ?',
                args=[id]
            )

            if not result.rows or len(result.rows) == 0:
                return None

            return QuestionModel.mapQuestion(result.rows[0])
        except Exception as e:
            print('Error getting question:', e)
            raise e

    @staticmethod
    async def update(
        id: str,
        text: str,
        options: List[str],
        correctAnswer: int,
        explanation: str
    ) -> Question:
        timestamp = to_unix_timestamp(now())

        try:
            result = await dbClient.execute(
                sql="""
                    UPDATE questions
                    SET text = ?, options = ?, correct_answer = ?, explanation = ?, updated_at = ?
                    WHERE id = ?
                    RETURNING *
                """,
                args=[text, json.dumps(options), correctAnswer, explanation, timestamp, id]
            )

            if not result.rows or len(result.rows) == 0:
                raise Exception('Question not found')

            return QuestionModel.mapQuestion(result.rows[0])
        except Exception as e:
            print('Error updating question:', e)
            raise e

    @staticmethod
    def mapQuestion(row: any) -> Question:
        try:
            return {
                'id': row.id,
                'topicId': row.topic_id,
                'text': row.text,
                'options': json.loads(row.options),
                'correctAnswer': row.correct_answer,
                'explanation': row.explanation,
                'createdAt': from_unix_timestamp(row.created_at),
                'updatedAt': from_unix_timestamp(row.updated_at)
            }
        except Exception as e:
            print('Error mapping question:', e)
            raise e
