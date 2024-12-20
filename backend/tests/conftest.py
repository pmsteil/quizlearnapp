import pytest
from fastapi.testclient import TestClient
from typing import AsyncGenerator, Dict
import jwt
from datetime import datetime, timedelta
from libsql_client import Client
from backend.ai.config import AIConfig
from backend.main import app

# Test configuration
TEST_USER_ID = "test_user_123"
TEST_LESSON_ID = "test_lesson_123"
TEST_TOPIC_ID = "test_topic_123"

@pytest.fixture
def config():
    """Fixture for AI configuration"""
    return AIConfig()

@pytest.fixture
def test_client():
    """Fixture for FastAPI test client"""
    return TestClient(app)

@pytest.fixture
def auth_headers(config):
    """Fixture for authentication headers"""
    # Create a test JWT token
    token = jwt.encode(
        {
            "sub": TEST_USER_ID,
            "exp": datetime.utcnow() + timedelta(days=1)
        },
        config.JWT_SECRET,
        algorithm="HS256"
    )
    return {"Authorization": f"Bearer {token}"}

class MockResultSet:
    def __init__(self):
        self.rows = [[1, 2, 3]]
        self.columns = ['col1', 'col2', 'col3']
    
    def fetchall(self):
        return self.rows
    
    def fetchone(self):
        return self.rows[0] if self.rows else None

class MockDB:
    """Mock database for testing"""
    def __init__(self):
        self.data = {
            "users": {
                TEST_USER_ID: {
                    "id": TEST_USER_ID,
                    "name": "Test User",
                    "email": "test@example.com",
                    "roles": ["role_user"]
                }
            },
            "lessons": {
                TEST_LESSON_ID: {
                    "id": TEST_LESSON_ID,
                    "title": "Test Lesson",
                    "content": "Test content",
                    "topic_id": TEST_TOPIC_ID
                }
            },
            "topics": {
                TEST_TOPIC_ID: {
                    "id": TEST_TOPIC_ID,
                    "title": "Test Topic",
                    "description": "Test description"
                }
            },
            "user_topic_lessons": {}
        }
    
    async def execute(self, query: str, params: list = None) -> Dict:
        """Mock database execute method"""
        # Simple mock implementation - in real tests we'd match the query
        # and return appropriate data
        return MockResultSet()

@pytest.fixture
async def mock_db() -> AsyncGenerator[MockDB, None]:
    """Fixture for mock database"""
    yield MockDB()

@pytest.fixture
def mock_agent_response():
    """Fixture for mock agent responses"""
    return {
        "content": "This is a test response",
        "type": "agent_response",
        "metadata": {
            "confidence": 0.9,
            "source": "test_agent"
        }
    }

def pytest_configure(config):
    """Configure pytest with custom markers"""
    config.addinivalue_line(
        "markers",
        "integration: mark test as an integration test"
    )
