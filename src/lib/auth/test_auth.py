import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
import time
from src.lib.db import get_test_db, cleanup_test_db, get_db
from src.lib.auth.service import AuthService
from src.lib.auth.jwt import create_access_token
from src.lib.app import app

# Setup test client
@pytest.fixture
def client():
    """Get test client with test database."""
    app.dependency_overrides[get_db] = get_test_db
    client = TestClient(app)
    yield client
    cleanup_test_db()

@pytest.fixture
def auth_service():
    """Get auth service with test database."""
    service = AuthService(get_test_db())
    return service

@pytest.fixture
def test_user_data():
    """Get test user data."""
    return {
        "email": "test@example.com",
        "password": "testpassword123",
        "name": "Test User"
    }

def test_register_user(client, test_user_data):
    """Test user registration."""
    # Convert dict to form data
    response = client.post(
        "/auth/register",
        data={
            "email": test_user_data["email"],
            "password": test_user_data["password"],
            "name": test_user_data["name"]
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == test_user_data["email"]
    assert data["user"]["name"] == test_user_data["name"]
    assert "session_id" in data["user"]

def test_login_success(client, test_user_data):
    """Test successful login."""
    # First register a user
    client.post(
        "/auth/register",
        data={
            "email": test_user_data["email"],
            "password": test_user_data["password"],
            "name": test_user_data["name"]
        }
    )

    # Then try to login
    response = client.post(
        "/auth/login",
        data={
            "username": test_user_data["email"],
            "password": test_user_data["password"]
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "session_id" in data["user"]
    assert data["expires_in"] == 24 * 60 * 60  # 24 hours in seconds

def test_login_wrong_password(client, test_user_data):
    """Test login with wrong password."""
    # First register a user
    client.post(
        "/auth/register",
        data={
            "email": test_user_data["email"],
            "password": test_user_data["password"],
            "name": test_user_data["name"]
        }
    )

    # Try to login with wrong password
    response = client.post(
        "/auth/login",
        data={
            "username": test_user_data["email"],
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401
    data = response.json()
    assert data["detail"]["error_code"] == "INVALID_CREDENTIALS"

def test_login_account_lockout(client, test_user_data):
    """Test account lockout after multiple failed attempts."""
    # First register a user
    client.post(
        "/auth/register",
        data={
            "email": test_user_data["email"],
            "password": test_user_data["password"],
            "name": test_user_data["name"]
        }
    )

    # Try to login with wrong password multiple times
    for _ in range(5):
        response = client.post(
            "/auth/login",
            data={
                "username": test_user_data["email"],
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401

    # Try one more time to trigger lockout
    response = client.post(
        "/auth/login",
        data={
            "username": test_user_data["email"],
            "password": test_user_data["password"]  # Even with correct password
        }
    )
    assert response.status_code == 401
    data = response.json()
    assert data["detail"]["error_code"] == "ACCOUNT_LOCKED"

def test_logout(client, test_user_data):
    """Test user logout."""
    # First register and login
    register_response = client.post(
        "/auth/register",
        data={
            "email": test_user_data["email"],
            "password": test_user_data["password"],
            "name": test_user_data["name"]
        }
    )
    token = register_response.json()["access_token"]

    # Then logout
    response = client.post(
        "/auth/logout",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200

    # Try to access /me endpoint with the same token
    me_response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_response.status_code == 401
    assert me_response.json()["detail"] == "Session expired"

def test_session_expiry(client, test_user_data, auth_service):
    """Test session expiry."""
    # Override session timeout for testing
    auth_service.session_timeout = timedelta(seconds=1)

    # Register and login
    register_response = client.post(
        "/auth/register",
        data={
            "email": test_user_data["email"],
            "password": test_user_data["password"],
            "name": test_user_data["name"]
        }
    )
    token = register_response.json()["access_token"]

    # Wait for session to expire
    time.sleep(2)

    # Try to access /me endpoint
    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Session expired"

def test_me_endpoint(client, test_user_data):
    """Test /me endpoint."""
    # Register and login
    register_response = client.post(
        "/auth/register",
        data={
            "email": test_user_data["email"],
            "password": test_user_data["password"],
            "name": test_user_data["name"]
        }
    )
    token = register_response.json()["access_token"]

    # Access /me endpoint
    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user_data["email"]
    assert data["name"] == test_user_data["name"]
    assert "session_id" in data

def test_register_duplicate_email(client, test_user_data):
    """Test registering with duplicate email."""
    # Register first time
    client.post(
        "/auth/register",
        data={
            "email": test_user_data["email"],
            "password": test_user_data["password"],
            "name": test_user_data["name"]
        }
    )

    # Try to register again with same email
    response = client.post(
        "/auth/register",
        data={
            "email": test_user_data["email"],
            "password": test_user_data["password"],
            "name": test_user_data["name"]
        }
    )
    assert response.status_code == 400
    assert "User already exists" in response.json()["detail"]

def test_invalid_token(client):
    """Test using invalid token."""
    # Try to access /me endpoint with invalid token
    response = client.get(
        "/auth/me",
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Could not validate credentials"
