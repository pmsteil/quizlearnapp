import asyncio
import os
from dotenv import load_dotenv
from ai.agents.agent_lesson_evaluator import LessonEvaluatorAgent
from ai.models.message import Message, MessageType
from ai.config import AIConfig

# Load environment variables
load_dotenv()

async def test_lesson_evaluator():
    """Test the lesson evaluator agent"""
    # Initialize the agent
    agent = LessonEvaluatorAgent("agent_lesson_evaluator", AIConfig())
    
    # Print agent info
    print(f"\nFound agent: {agent.agent_info['name']} {agent.agent_info['icon']}\n")
    
    # Test context
    context = {
        "lesson_title": "Introduction to Python",
        "lesson_content": """
        1. Basic Python Syntax
           - Variables and data types
           - Print statements
           - Basic operators
        
        2. Control Flow
           - If statements
           - Loops
           - Basic functions
        """,
        "student_responses": [
            {"question": "What is a variable in Python?", "answer": "A variable is like a container that stores data"},
            {"question": "How do you print text in Python?", "answer": "Using the print() function"}
        ],
        "user": {
            "name": "Test User",
            "defaultDifficulty": "beginner",
            "about": "New to programming, interested in learning Python"
        }
    }
    
    print("\n=== Starting conversation with Dr. Grace ===\n")
    
    # Test initial message
    message = Message(
        id="1",
        timestamp=0,
        user_id="test_user",
        type=MessageType.USER_ANSWER,
        content="Hi Dr. Grace! Could you evaluate how I'm doing in my Python lessons?"
    )
    
    response = await agent.process_message(message, context)
    print(f"Student: {message.content}\n")
    print(f"{agent.agent_info['name']} ({agent.agent_info['icon']}): {response.message.content}\n")
    
    print("\n=== Asking Dr. Grace to evaluate the lesson ===\n")
    
    # Test lesson evaluation
    response = await agent.evaluate_lesson(context)
    print(f"{agent.agent_info['name']} ({agent.agent_info['icon']}): {response.message.content}\n")
    
    print("\n=== Asking Dr. Grace to analyze progress ===\n")
    
    # Test progress analysis
    response = await agent.analyze_progress(context)
    print(f"{agent.agent_info['name']} ({agent.agent_info['icon']}): {response.message.content}\n")
    
    print("\n=== Asking Dr. Grace for recommendations ===\n")
    
    # Test recommendations
    response = await agent.provide_recommendations(context)
    print(f"{agent.agent_info['name']} ({agent.agent_info['icon']}): {response.message.content}\n")

if __name__ == "__main__":
    asyncio.run(test_lesson_evaluator())
