import pytest
from fastapi.testclient import TestClient
from ..src.lib.app import app
from ..src.lib.auth.service import AuthService
from ..src.lib.db import get_test_db
import logging

logger = logging.getLogger(__name__)

@pytest.fixture
def client():
    """Create a test client using a test database."""
    # Get test database
    test_db = get_test_db()
    
    # Override the database dependency
    app.state.db = test_db
    
    # Create test client
    with TestClient(app) as client:
        yield client

def test_register_endpoint(client):
    """Test the register endpoint with valid data."""
    # Test data
    test_user = {
        "username": "test@example.com",
        "password": "testpassword",
        "name": "Test User"
    }
    
    # Make request
    response = client.post("/api/v1/auth/register", json=test_user)
    logger.info(f"Register response: {response.status_code} - {response.text}")
    
    # Check response
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert "user" in data
    assert data["user"]["email"] == test_user["username"]

def test_register_duplicate_user(client):
    """Test registering a duplicate user."""
    # Create first user
    test_user = {
        "username": "test@example.com",
        "password": "testpassword",
        "name": "Test User"
    }
    response = client.post("/api/v1/auth/register", json=test_user)
    assert response.status_code == 200
    
    # Try to create duplicate user
    response = client.post("/api/v1/auth/register", json=test_user)
    assert response.status_code == 400
    data = response.json()
    assert data["detail"]["error_code"] == "USER_EXISTS"

def test_register_invalid_data(client):
    """Test register endpoint with invalid data."""
    # Missing required fields
    response = client.post("/api/v1/auth/register", json={})
    assert response.status_code == 422  # FastAPI validation error
    
    # Empty username
    response = client.post("/api/v1/auth/register", json={
        "username": "",
        "password": "testpassword",
        "name": "Test User"
    })
    assert response.status_code == 422

def test_register_form_data(client):
    """Test register endpoint with form data."""
    response = client.post(
        "/api/v1/auth/register",
        data={
            "username": "test@example.com",
            "password": "testpassword",
            "name": "Test User"
        }
    )
    logger.info(f"Form data response: {response.status_code} - {response.text}")
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
