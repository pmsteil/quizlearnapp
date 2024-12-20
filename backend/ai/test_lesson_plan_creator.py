import asyncio
import os
from dotenv import load_dotenv
from ai.agents.agent_lesson_plan_creator import LessonPlanCreatorAgent
from ai.models.message import Message, MessageType
from ai.config import AIConfig

# Load environment variables
load_dotenv()

async def test_lesson_plan_creator():
    """Test the lesson plan creator agent"""
    # Initialize the agent
    agent = LessonPlanCreatorAgent("agent_lesson_plan_creator", AIConfig())
    
    # Print agent info
    print(f"\nFound agent: {agent.agent_info['name']} {agent.agent_info['icon']}\n")
    
    # Test context
    context = {
        "topic_title": "Introduction to Python",
        "topic_description": "A beginner's guide to Python programming language",
        "topic_objectives": [
            "Understand basic Python syntax",
            "Learn about variables and data types",
            "Practice writing simple programs"
        ],
        "user": {
            "name": "Test User",
            "defaultDifficulty": "beginner",
            "about": "New to programming, interested in learning Python"
        },
        "progress_summary": "No previous progress"
    }
    
    print("\n=== Starting conversation with Dr. Turing ===\n")
    
    # Test initial message
    message = Message(
        id="1",
        timestamp=0,
        user_id="test_user",
        type=MessageType.USER_ANSWER,
        content="Hi Dr. Turing! I'd like to learn Python. Can you create a lesson plan for me?"
    )
    
    response = await agent.process_message(message, context)
    print(f"Student: {message.content}\n")
    print(f"{agent.agent_info['name']} ({agent.agent_info['icon']}): {response.message.content}\n")
    
    print("\n=== Asking Dr. Turing to create a lesson plan ===\n")
    
    # Test lesson plan creation
    response = await agent.create_lesson_plan(context)
    print(f"{agent.agent_info['name']} ({agent.agent_info['icon']}): {response.message.content}\n")
    
    print("\n=== Asking Dr. Turing to revise the lesson plan ===\n")
    
    # Test lesson plan revision
    message = Message(
        id="2",
        timestamp=0,
        user_id="test_user",
        type=MessageType.USER_ANSWER,
        content="Could you add more hands-on exercises to the lesson plan?"
    )
    
    response = await agent.revise_lesson_plan(message, context)
    print(f"Student: {message.content}\n")
    print(f"{agent.agent_info['name']} ({agent.agent_info['icon']}): {response.message.content}\n")

if __name__ == "__main__":
    asyncio.run(test_lesson_plan_creator())
