import pytest
from fastapi.testclient import TestClient
from backend.ai.models.message import Message, MessageType
from .conftest import TEST_USER_ID, TEST_LESSON_ID, TEST_TOPIC_ID
from datetime import datetime
import uuid

@pytest.mark.asyncio
async def test_chat_with_agent_unauthorized(test_client: TestClient):
    """Test chat endpoint without authentication"""
    response = test_client.post(
        f"/api/v1/chat/agent_lesson_teacher",
        json={
            "agent_id": "agent_lesson_teacher",
            "message_id": "test_message_1",
            "message_timestamp": 1234567890,
            "message_user_id": TEST_USER_ID,
            "message_content": "Hello",
            "message_type": MessageType.USER_ANSWER
        }
    )
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_chat_with_agent(
    test_client: TestClient,
    mock_current_user,
    mock_db,
    mock_ai_config
):
    """Test successful chat with agent"""
    timestamp = int(datetime.now().timestamp())
    
    response = test_client.post(
        f"/api/v1/chat/agent_lesson_teacher",
        data={
            "messageId": str(uuid.uuid4()),
            "messageTimestamp": timestamp,
            "messageUserId": TEST_USER_ID,
            "messageType": MessageType.USER_ANSWER,
            "messageContent": "What is the capital of France?",
            "messageQuestionNumber": 1,
            "messageIsCorrect": None,
            "lessonId": TEST_LESSON_ID,
            "topicId": TEST_TOPIC_ID
        }
    )
    
    # Assert response
    assert response.status_code == 200
    data = response.json()
    
    # Validate response structure
    assert "message" in data
    assert "metadata" in data
    
    # Validate message details
    assert data["message"]["id"] is not None
    assert data["message"]["type"] == MessageType.AGENT_TEACHING
    assert len(data["message"]["content"]) > 0

@pytest.mark.asyncio
async def test_chat_with_invalid_agent(
    test_client: TestClient,
    auth_headers: dict
):
    """Test chat with non-existent agent"""
    response = test_client.post(
        f"/api/v1/chat/invalid_agent",
        headers=auth_headers,
        json={
            "agent_id": "invalid_agent",
            "message_id": "test_message_3",
            "message_timestamp": 1234567890,
            "message_user_id": TEST_USER_ID,
            "message_content": "Hello",
            "message_type": MessageType.USER_ANSWER
        }
    )
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_chat_rate_limit(
    test_client: TestClient,
    auth_headers: dict
):
    """Test rate limiting"""
    # Make multiple requests quickly
    for i in range(61):  # Our limit is 60 per minute
        response = test_client.post(
            f"/api/v1/chat/agent_lesson_teacher",
            headers=auth_headers,
            json={
                "agent_id": "agent_lesson_teacher",
                "message_id": f"test_message_{i+4}",
                "message_timestamp": 1234567890,
                "message_user_id": TEST_USER_ID,
                "message_content": "Hello",
                "message_type": MessageType.USER_ANSWER
            }
        )
    assert response.status_code == 429

@pytest.mark.asyncio
async def test_message_sanitization(
    test_client: TestClient,
    auth_headers: dict
):
    """Test message content sanitization"""
    response = test_client.post(
        f"/api/v1/chat/agent_lesson_teacher",
        headers=auth_headers,
        json={
            "agent_id": "agent_lesson_teacher",
            "message_id": "test_message_65",
            "message_timestamp": 1234567890,
            "message_user_id": TEST_USER_ID,
            "message_content": "<script>alert('xss')</script>",
            "message_type": MessageType.USER_ANSWER
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "<script>" not in data["message"]["content"]

@pytest.mark.asyncio
@pytest.mark.integration
async def test_progress_tracking(
    test_client: TestClient,
    auth_headers: dict,
    mock_db
):
    """Test progress tracking in lesson chat"""
    # Send a series of messages
    messages = [
        {
            "agent_id": "agent_lesson_teacher",
            "message_id": "test_message_66",
            "message_timestamp": 1234567890,
            "message_user_id": TEST_USER_ID,
            "message_content": "What is Python?",
            "message_type": MessageType.USER_ANSWER,
            "lesson_id": TEST_LESSON_ID
        },
        {
            "agent_id": "agent_lesson_teacher",
            "message_id": "test_message_67",
            "message_timestamp": 1234567891,
            "message_user_id": TEST_USER_ID,
            "message_content": "A programming language",
            "message_type": MessageType.USER_ANSWER,
            "message_is_correct": True,
            "lesson_id": TEST_LESSON_ID
        }
    ]
    
    for message in messages:
        response = test_client.post(
            f"/api/v1/chat/agent_lesson_teacher",
            headers=auth_headers,
            json=message
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "metadata" in data

@pytest.mark.asyncio
async def test_error_handling(
    test_client: TestClient,
    auth_headers: dict
):
    """Test error handling in chat"""
    # Test with missing required fields
    response = test_client.post(
        f"/api/v1/chat/agent_lesson_teacher",
        headers=auth_headers,
        json={}
    )
    assert response.status_code == 422
    
    # Test with invalid message type
    response = test_client.post(
        f"/api/v1/chat/agent_lesson_teacher",
        headers=auth_headers,
        json={
            "agent_id": "agent_lesson_teacher",
            "message_id": "test_message_68",
            "message_timestamp": 1234567890,
            "message_user_id": TEST_USER_ID,
            "message_content": "Hello",
            "message_type": "invalid_type"
        }
    )
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_lesson_evaluation(
    test_client: TestClient,
    auth_headers: dict,
    mock_db
):
    """Test lesson evaluation endpoint"""
    response = test_client.post(
        f"/api/v1/chat/agent_lesson_evaluator/evaluate/{TEST_LESSON_ID}",
        headers=auth_headers,
        json={
            "answer_id": "test_answer_1",
            "answer_timestamp": 1234567890,
            "answer_user_id": TEST_USER_ID,
            "answer_type": MessageType.USER_ANSWER,
            "answer_content": "Test answer",
            "answer_is_correct": True
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "metadata" in data
    assert data["message"]["type"] == MessageType.AGENT_EVALUATION

@pytest.mark.asyncio
async def test_lesson_plan_creation(
    test_client: TestClient,
    auth_headers: dict,
    mock_db
):
    """Test lesson plan creation endpoint"""
    response = test_client.post(
        f"/api/v1/chat/agent_lesson_plan_creator/plan",
        headers=auth_headers,
        json={
            "topic_id": TEST_TOPIC_ID,
            "user_id": TEST_USER_ID
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "metadata" in data
    assert data["message"]["type"] == MessageType.AGENT_TEACHING
