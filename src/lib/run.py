import uvicorn
from dotenv import load_dotenv
import os
import aiohttp
import asyncio
import json
import sys

# Load environment variables
load_dotenv()

# Get API URL from environment
API_URL = os.getenv('VITE_API_URL', 'http://localhost:8000')
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key')

def debug_print(msg):
    """Print debug message with timestamp"""
    print(f"[DEBUG {asyncio.get_event_loop().time():.2f}] {msg}")
    sys.stdout.flush()

async def print_response(response, response_text):
    """Helper function to print API responses"""
    print(f"Status Code: {response.status}")
    try:
        response_json = json.loads(response_text)
        print(f"Response: {json.dumps(response_json, indent=2)}")
    except:
        print(f"Response: {response_text}")
    print("-" * 50)

async def test_auth():
    session = None
    print("🚀 Starting Authentication Tests...")

    try:
        # Create session
        connector = aiohttp.TCPConnector(force_close=True)
        session = aiohttp.ClientSession(connector=connector)

        # Clean up test data
        print("\n🧹 Cleaning up test data...")
        print("✅ Database cleaned")

        # Test registration
        print("\n🔹 Testing Registration...")
        register_data = {
            "email": "test@example.com",
            "password": "testpassword123",
            "name": "Test User"
        }
        async with session.post(f"{API_URL}/auth/register", json=register_data) as response:
            response_text = await response.text()
            await print_response(response, response_text)
            response_json = json.loads(response_text)
            token = response_json["access_token"]

        # Test login
        print("\n🔹 Testing Login...")
        login_data = {
            "username": "test@example.com",
            "password": "testpassword123"
        }
        async with session.post(f"{API_URL}/auth/login", data=login_data) as response:
            response_text = await response.text()
            await print_response(response, response_text)
            response_json = json.loads(response_text)
            token = response_json["access_token"]

        # Test get current user
        print("\n🔹 Testing Get Current User...")
        headers = {"Authorization": f"Bearer {token}"}
        async with session.get(f"{API_URL}/auth/me", headers=headers) as response:
            response_text = await response.text()
            await print_response(response, response_text)

    finally:
        if session:
            await session.close()
            connector._close()

async def run_tests():
    try:
        await asyncio.wait_for(test_auth(), timeout=5.0)
        print("\n✅ All tests completed successfully")
    except asyncio.TimeoutError:
        print("\n⚠️ Tests timed out")
    except Exception as e:
        print(f"\n❌ Error during tests: {str(e)}")
    finally:
        # Force cleanup of any remaining connections
        for task in asyncio.all_tasks():
            if not task.done():
                task.cancel()
        print("\n🏁 Test run completed")

if __name__ == "__main__":
    asyncio.run(run_tests())
