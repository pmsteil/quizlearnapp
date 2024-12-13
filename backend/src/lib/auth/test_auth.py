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

@pytest.fixture
def admin_user_data():
    """Get admin user data."""
    return {
        "email": "admin@example.com",
        "password": "adminpass123",
        "name": "Admin User"
    }

@pytest.fixture
def create_admin_user(client, admin_user_data):
    """Create an admin user and return their token."""
    def _create_admin():
        # Register admin user
        response = client.post(
            "/auth/register",
            data={
                "email": admin_user_data["email"],
                "password": admin_user_data["password"],
                "name": admin_user_data["name"]
            }
        )
        assert response.status_code == 200

        # Update user to have admin role directly in database
        db = get_test_db()
        db.execute(
            "UPDATE users SET roles = ? WHERE email = ?",
            ["role_user,role_admin", admin_user_data["email"]]
        )

        # Log in to get token with admin role
        login_response = client.post(
            "/auth/login",
            data={
                "username": admin_user_data["email"],  # OAuth2 form uses username field
                "password": admin_user_data["password"]
            }
        )
        assert login_response.status_code == 200
        return login_response.json()["access_token"]

    return _create_admin

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
    assert response.status_code == 400
    data = response.json()
    assert data["detail"]["error_code"] == "USER_EXISTS"
    assert data["detail"]["message"] == "User already exists"

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
    assert register_response.status_code == 200
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

def test_logout(client, test_user_data):
    """Test user logout."""
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

def test_list_users(client, admin_user_data, test_user_data, create_admin_user):
    """Test listing users (admin only)."""
    # Create admin user and get token
    admin_token = create_admin_user()

    # Create regular user
    client.post(
        "/auth/register",
        data={
            "email": test_user_data["email"],
            "password": test_user_data["password"],
            "name": test_user_data["name"]
        }
    )

    # List users
    response = client.get(
        "/users",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    users = response.json()
    assert len(users) >= 2  # At least admin and regular user
    assert any(user["email"] == admin_user_data["email"] for user in users)
    assert any(user["email"] == test_user_data["email"] for user in users)

    # Try listing without admin token
    response = client.get("/users")
    assert response.status_code == 401

def test_update_user(client, create_admin_user):
    """Test updating a user as admin."""
    # Create admin user and get token
    admin_token = create_admin_user()

    # Create a regular user to update
    response = client.post(
        "/auth/register",
        data={
            "email": "user@example.com",
            "password": "password123",
            "name": "Test User"
        }
    )
    assert response.status_code == 200
    user_id = response.json()["user"]["id"]

    # Update user details
    response = client.put(
        f"/users/{user_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "name": "Updated Name",
            "roles": ["role_user", "role_admin"]
        }
    )
    assert response.status_code == 200
    updated_user = response.json()
    assert updated_user["name"] == "Updated Name"
    assert "role_admin" in updated_user["roles"].split(",")

    # Try updating without admin token
    user_response = client.post(
        "/auth/login",
        data={
            "username": "user@example.com",  # OAuth2 form uses username field
            "password": "password123"
        }
    )
    user_token = user_response.json()["access_token"]

    response = client.put(
        f"/users/{user_id}",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Should Not Update"}
    )
    assert response.status_code == 403

def test_delete_user(client, create_admin_user):
    """Test deleting a user as admin."""
    # Create admin user and get token
    admin_token = create_admin_user()

    # Create a regular user to delete
    response = client.post(
        "/auth/register",
        data={
            "email": "delete@example.com",
            "password": "password123",
            "name": "Delete Me"
        }
    )
    assert response.status_code == 200
    user_id = response.json()["user"]["id"]

    # Delete user
    response = client.delete(
        f"/users/{user_id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "User deleted successfully"

    # Verify user is deleted
    response = client.post(
        "/auth/login",
        data={
            "username": "delete@example.com",  # OAuth2 form uses username field
            "password": "password123"
        }
    )
    assert response.status_code == 401

    # Try deleting without admin token
    response = client.post(
        "/auth/register",
        data={
            "email": "user2@example.com",
            "password": "password123",
            "name": "Test User 2"
        }
    )
    user2_id = response.json()["user"]["id"]
    user_token = client.post(
        "/auth/login",
        data={
            "username": "user2@example.com",  # OAuth2 form uses username field
            "password": "password123"
        }
    ).json()["access_token"]

    response = client.delete(
        f"/users/{user2_id}",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 403
