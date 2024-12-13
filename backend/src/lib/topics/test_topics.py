import pytest
from httpx import AsyncClient
from src.lib.app import app
from src.lib.db import get_db

@pytest.mark.asyncio
async def test_get_topics(admin_token, test_client: AsyncClient):
    response = await test_client.get(
        "/api/v1/topics",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_create_topic(admin_token, test_client: AsyncClient):
    topic_data = {
        "title": "Test Topic",
        "description": "Test Description"
    }
    response = await test_client.post(
        "/api/v1/topics",
        headers={"Authorization": f"Bearer {admin_token}"},
        json=topic_data
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == topic_data["title"]
    assert data["description"] == topic_data["description"]

@pytest.mark.asyncio
async def test_get_topic(admin_token, test_client: AsyncClient):
    # First create a topic
    topic_data = {
        "title": "Test Topic",
        "description": "Test Description"
    }
    create_response = await test_client.post(
        "/api/v1/topics",
        headers={"Authorization": f"Bearer {admin_token}"},
        json=topic_data
    )
    created_topic = create_response.json()

    # Then get it by ID
    response = await test_client.get(
        f"/api/v1/topics/{created_topic['id']}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    assert response.json()["id"] == created_topic["id"]

@pytest.mark.asyncio
async def test_update_topic(admin_token, test_client: AsyncClient):
    # First create a topic
    topic_data = {
        "title": "Test Topic",
        "description": "Test Description"
    }
    create_response = await test_client.post(
        "/api/v1/topics",
        headers={"Authorization": f"Bearer {admin_token}"},
        json=topic_data
    )
    created_topic = create_response.json()

    # Update the topic
    update_data = {
        "title": "Updated Title",
        "description": "Updated Description"
    }
    response = await test_client.put(
        f"/api/v1/topics/{created_topic['id']}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json=update_data
    )
    assert response.status_code == 200
    updated_topic = response.json()
    assert updated_topic["title"] == update_data["title"]
    assert updated_topic["description"] == update_data["description"]

@pytest.mark.asyncio
async def test_delete_topic(admin_token, test_client: AsyncClient):
    # First create a topic
    topic_data = {
        "title": "Test Topic",
        "description": "Test Description"
    }
    create_response = await test_client.post(
        "/api/v1/topics",
        headers={"Authorization": f"Bearer {admin_token}"},
        json=topic_data
    )
    created_topic = create_response.json()

    # Delete the topic
    response = await test_client.delete(
        f"/api/v1/topics/{created_topic['id']}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200

    # Verify it's deleted
    get_response = await test_client.get(
        f"/api/v1/topics/{created_topic['id']}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert get_response.status_code == 404
