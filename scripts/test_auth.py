#!/usr/bin/env python3
import requests
import json
import sys
from typing import Dict, Any
import os
from libsql_client import create_client_sync

BASE_URL = "http://localhost:8001"

def test_register():
    """Test user registration."""
    print("\n🔹 Testing Registration...")

    url = f"{BASE_URL}/auth/register"
    data = {
        "email": "test@example.com",
        "password": "testpassword123",
        "name": "Test User"
    }

    response = requests.post(url, data=data)  # Using data= for form data
    print_response(response)
    return response.json() if response.ok else None

def test_login() -> Dict[str, Any]:
    """Test user login endpoint."""
    print("\n🔹 Testing Login...")

    url = f"{BASE_URL}/auth/login"
    data = {
        "username": "test@example.com",  # OAuth2 form uses username field for email
        "password": "testpassword123"
    }

    response = requests.post(url, data=data)  # Using data= for form data
    print_response(response)
    return response.json() if response.ok else None

def test_me(token: str) -> None:
    """Test get current user endpoint."""
    print("\n🔹 Testing Get Current User...")

    url = f"{BASE_URL}/auth/me"
    headers = {
        "Authorization": f"Bearer {token}"
    }

    print(f"Requesting {url} with headers {headers}")
    response = requests.get(url, headers=headers)
    print_response(response)

def print_response(response):
    """Print response details."""
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response Body: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Raw Response: {response.text}")
        print(f"Error parsing JSON: {e}")

def cleanup():
    print("\n=== Cleaning Up Test Data ===")
    # Get database credentials from environment
    db_url = os.getenv('VITE_LIBSQL_DB_URL')
    auth_token = os.getenv('VITE_LIBSQL_DB_AUTH_TOKEN')

    if not db_url or not auth_token:
        print("❌ Database credentials not found in environment")
        return

    try:
        # Create database client
        db = create_client_sync(
            url=db_url,
            auth_token=auth_token
        )

        # Get the test user's ID first
        result = db.execute("SELECT id FROM users WHERE email = ?", ["test@example.com"])
        if result.rows:
            user_id = result.rows[0][0]

            # Delete related records first (only from tables we know exist)
            db.execute("DELETE FROM sessions WHERE user_id = ?", [user_id])

            # Finally delete the user
            db.execute("DELETE FROM users WHERE id = ?", [user_id])
            print("✅ Database cleaned")
        else:
            print("✅ No test user found to clean up")

    except Exception as e:
        print(f"Error during cleanup: {str(e)}")

    print("Cleanup completed")

def main():
    """Run all tests."""
    try:
        # Clean up first
        cleanup()

        # Run tests
        register_result = test_register()
        if register_result:
            token = register_result.get('token')
            if token:
                test_me(token)

        login_result = test_login()
        if login_result:
            token = login_result.get('access_token')
            if token:
                test_me(token)
    except KeyboardInterrupt:
        print("\nTests interrupted by user")
    except Exception as e:
        print(f"\nTest suite failed: {e}")
    finally:
        cleanup()

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "cleanup":
        cleanup()
    else:
        main()
