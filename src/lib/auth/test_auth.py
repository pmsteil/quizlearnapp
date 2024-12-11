import pytest
from fastapi.testclient import TestClient
from src.lib.db import get_test_db, get_db, cleanup_test_db
from src.lib.app import app

@pytest.fixture
def client():
    """Get test client with test database."""
    # Clean up before test
    cleanup_test_db()

    # Override the database dependency
    app.dependency_overrides[get_db] = get_test_db
    yield TestClient(app)

    # Clean up after test
    cleanup_test_db()
    app.dependency_overrides.clear()

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
    response = client.post(
        "/auth/register",
        data={
            "email": test_user_data["email"],
            "password": test_user_data["password"],
            "name": test_user_data["name"]
        }
    )
    print(f"Registration response: {response.status_code}")
    print(f"Response body: {response.text}")

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == test_user_data["email"]
    assert data["user"]["name"] == test_user_data["name"]
    assert "session_id" in data["user"]

def test_login_success(client, test_user_data):
    """Test successful login."""
    # First register a user
    register_response = client.post(
        "/auth/register",
        data={
            "email": test_user_data["email"],
            "password": test_user_data["password"],
            "name": test_user_data["name"]
        }
    )
    assert register_response.status_code == 200

    # Then try to login
    response = client.post(
        "/auth/login",
        data={
            "username": test_user_data["email"],  # OAuth2 form uses username field
            "password": test_user_data["password"]
        }
    )
    print(f"Login response: {response.status_code}")
    print(f"Response body: {response.text}")

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "session_id" in data["user"]
    assert data["expires_in"] == 24 * 60 * 60  # 24 hours in seconds

def test_login_wrong_password(client, test_user_data):
    """Test login with wrong password."""
    # First register a user
    register_response = client.post(
        "/auth/register",
        data={
            "email": test_user_data["email"],
            "password": test_user_data["password"],
            "name": test_user_data["name"]
        }
    )
    assert register_response.status_code == 200

    # Try to login with wrong password
    response = client.post(
        "/auth/login",
        data={
            "username": test_user_data["email"],
            "password": "wrongpassword"
        }
    )
    print(f"Login response: {response.status_code}")
    print(f"Login body: {response.text}")

    assert response.status_code == 401
    data = response.json()
    assert data["detail"]["error_code"] == "INVALID_CREDENTIALS"
    assert data["detail"]["message"] == "Invalid credentials"

def test_register_duplicate_email(client, test_user_data):
    """Test registering with duplicate email."""
    # Register first time
    register_response = client.post(
        "/auth/register",
        data={
            "email": test_user_data["email"],
            "password": test_user_data["password"],
            "name": test_user_data["name"]
        }
    )
    assert register_response.status_code == 200

    # Try to register again with same email
    response = client.post(
        "/auth/register",
        data={
            "email": test_user_data["email"],
            "password": test_user_data["password"],
            "name": test_user_data["name"]
        }
    )
    print(f"Duplicate registration response: {response.status_code}")
    print(f"Response body: {response.text}")

    assert response.status_code == 400
    data = response.json()
    assert data["detail"]["error_code"] == "USER_EXISTS"
    assert data["detail"]["message"] == "User already exists"
