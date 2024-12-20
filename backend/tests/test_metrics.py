import pytest
from datetime import datetime, timedelta
from backend.ai.utils.metrics import ProgressMetrics

@pytest.mark.asyncio
async def test_calculate_metrics_empty_history():
    """Test metrics calculation with empty chat history"""
    metrics = ProgressMetrics.calculate_metrics([])
    assert metrics["total_messages"] == 0
    assert metrics["questions_total"] == 0
    assert metrics["questions_correct"] == 0
    assert metrics["engagement_score"] == 0

@pytest.mark.asyncio
async def test_calculate_metrics():
    """Test metrics calculation with chat history"""
    now = datetime.now().timestamp()
    chat_history = [
        {
            "type": "agent_question",
            "content": "What is Python?",
            "timestamp": now
        },
        {
            "type": "user_answer",
            "content": "A programming language",
            "is_correct": True,
            "timestamp": now + 30  # 30 seconds later
        },
        {
            "type": "agent_question",
            "content": "Is Python interpreted?",
            "timestamp": now + 60
        },
        {
            "type": "user_answer",
            "content": "Yes",
            "is_correct": False,
            "timestamp": now + 90
        }
    ]
    
    metrics = ProgressMetrics.calculate_metrics(chat_history)
    assert metrics["total_messages"] == 4
    assert metrics["questions_total"] == 2
    assert metrics["questions_correct"] == 1
    assert metrics["questions_incorrect"] == 1
    assert metrics["average_response_time"] == 30  # 30 seconds per response
    assert metrics["session_duration"] == 90  # 90 seconds total
    assert 0 <= metrics["engagement_score"] <= 100

@pytest.mark.asyncio
async def test_engagement_score():
    """Test engagement score calculation"""
    now = datetime.now().timestamp()
    # Create a perfect session: quick responses, all correct
    chat_history = [
        {
            "type": "agent_question",
            "content": "Q1",
            "timestamp": now
        },
        {
            "type": "user_answer",
            "content": "A1",
            "is_correct": True,
            "timestamp": now + 10  # Quick response
        },
        {
            "type": "agent_question",
            "content": "Q2",
            "timestamp": now + 20
        },
        {
            "type": "user_answer",
            "content": "A2",
            "is_correct": True,
            "timestamp": now + 30
        }
    ]
    
    metrics = ProgressMetrics.calculate_metrics(chat_history)
    assert metrics["engagement_score"] > 80  # Should be high due to perfect performance

@pytest.mark.asyncio
async def test_long_response_times():
    """Test metrics with long response times"""
    now = datetime.now().timestamp()
    chat_history = [
        {
            "type": "agent_question",
            "content": "Q1",
            "timestamp": now
        },
        {
            "type": "user_answer",
            "content": "A1",
            "is_correct": True,
            "timestamp": now + 300  # 5 minutes
        }
    ]
    
    metrics = ProgressMetrics.calculate_metrics(chat_history)
    assert metrics["average_response_time"] == 300
    assert metrics["engagement_score"] < 80  # Should be lower due to slow response

@pytest.mark.asyncio
@pytest.mark.integration
async def test_progress_persistence(mock_db):
    """Test progress persistence in database"""
    metrics = {
        "questions_total": 5,
        "questions_correct": 3,
        "engagement_score": 75
    }
    
    # Update progress
    await ProgressMetrics.update_progress(
        mock_db,
        "test_user",
        "test_lesson",
        metrics
    )
    
    # Get progress
    progress = await ProgressMetrics.get_user_progress(
        mock_db,
        "test_user",
        "test_lesson"
    )
    
    assert progress["questions_total"] == 5
    assert progress["questions_correct"] == 3
    assert progress["progress_percent"] == 75
