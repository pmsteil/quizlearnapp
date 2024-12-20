from typing import List, Dict, Any
from datetime import datetime, timedelta
import json

class ProgressMetrics:
    @staticmethod
    def calculate_metrics(chat_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate learning progress metrics from chat history"""
        metrics = {
            "total_messages": len(chat_history),
            "questions_total": 0,
            "questions_correct": 0,
            "questions_incorrect": 0,
            "average_response_time": 0,
            "session_duration": 0,
            "engagement_score": 0
        }
        
        if not chat_history:
            return metrics
        
        # Calculate question metrics
        question_messages = [
            msg for msg in chat_history 
            if msg.get('type') == 'agent_question'
        ]
        answer_messages = [
            msg for msg in chat_history 
            if msg.get('type') == 'user_answer'
        ]
        
        metrics["questions_total"] = len(question_messages)
        metrics["questions_correct"] = sum(
            1 for msg in answer_messages 
            if msg.get('is_correct', False)
        )
        metrics["questions_incorrect"] = len(answer_messages) - metrics["questions_correct"]
        
        # Calculate response times
        response_times = []
        for i in range(len(chat_history) - 1):
            if chat_history[i].get('type') == 'agent_question':
                if chat_history[i + 1].get('type') == 'user_answer':
                    time_diff = chat_history[i + 1]['timestamp'] - chat_history[i]['timestamp']
                    response_times.append(time_diff)
        
        if response_times:
            metrics["average_response_time"] = sum(response_times) / len(response_times)
        
        # Calculate session duration
        if len(chat_history) >= 2:
            metrics["session_duration"] = (
                chat_history[-1]['timestamp'] - chat_history[0]['timestamp']
            )
        
        # Calculate engagement score (0-100)
        # Factors: response time, correct answers, session length
        if metrics["questions_total"] > 0:
            correct_ratio = metrics["questions_correct"] / metrics["questions_total"]
            time_factor = min(1.0, metrics["session_duration"] / (30 * 60))  # Cap at 30 minutes
            response_factor = 1.0
            if metrics["average_response_time"] > 0:
                response_factor = min(1.0, 60 / metrics["average_response_time"])
            
            metrics["engagement_score"] = int(
                (correct_ratio * 0.5 + time_factor * 0.3 + response_factor * 0.2) * 100
            )
        
        return metrics

    @staticmethod
    async def update_progress(db, user_id: str, lesson_id: str, metrics: Dict[str, Any]):
        """Update progress in database"""
        await db.execute("""
            UPDATE user_topic_lessons
            SET 
                questions_total = ?,
                questions_correct = ?,
                progress_percent = ?,
                last_message_at = CURRENT_TIMESTAMP
            WHERE user_id = ? AND lesson_id = ?
        """, [
            metrics["questions_total"],
            metrics["questions_correct"],
            metrics["engagement_score"],
            user_id,
            lesson_id
        ])

    @staticmethod
    async def get_user_progress(db, user_id: str, lesson_id: str) -> Dict[str, Any]:
        """Get user's progress for a lesson"""
        result = await db.execute("""
            SELECT 
                questions_total,
                questions_correct,
                progress_percent,
                chat_history,
                started_at,
                completed_at
            FROM user_topic_lessons
            WHERE user_id = ? AND lesson_id = ?
        """, [user_id, lesson_id])
        
        if not result.rows:
            return {
                "questions_total": 0,
                "questions_correct": 0,
                "progress_percent": 0,
                "chat_history": [],
                "started_at": None,
                "completed_at": None
            }
        
        progress = result.rows[0]
        return {
            "questions_total": progress[0],
            "questions_correct": progress[1],
            "progress_percent": progress[2],
            "chat_history": json.loads(progress[3]) if progress[3] else [],
            "started_at": progress[4],
            "completed_at": progress[5]
        }
