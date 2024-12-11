#!/usr/bin/env python3
import requests
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8001"

def print_response(response: requests.Response) -> None:
    """Pretty print the response."""
    print("\nStatus Code:", response.status_code)
    try:
        print("Response:", json.dumps(response.json(), indent=2))
    except:
        print("Response:", response.text)
    print("-" * 50)

def test_register() -> Dict[str, Any]:
    """Test user registration endpoint."""
    print("\n🔹 Testing Registration...")

    url = f"{BASE_URL}/auth/register"
    data = {
        "email": "test@example.com",
        "password": "testpassword123",
        "name": "Test User"
    }

    response = requests.post(url, json=data)
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

    response = requests.post(url, data=data)  # Note: using data= for form data
    print_response(response)
    return response.json() if response.ok else None

def test_me(token: str) -> None:
    """Test get current user endpoint."""
    print("\n🔹 Testing Get Current User...")

    url = f"{BASE_URL}/auth/me"
    headers = {
        "Authorization": f"Bearer {token}"
    }

    response = requests.get(url, headers=headers)
    print_response(response)

def main():
    print("🚀 Starting Authentication Tests...")

    # Test registration
    register_result = test_register()

    # Test login
    login_result = test_login()

    if login_result and "access_token" in login_result:
        # Test get current user
        test_me(login_result["access_token"])
    else:
        print("❌ Skipping get current user test as login failed")

if __name__ == "__main__":
    main()
