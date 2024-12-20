import asyncio
import time
from dotenv import load_dotenv
import os
from libsql_client import create_client, Client
from ai.agents.agent_lesson_teacher import LessonTeacherAgent
from ai.models.message import Message, MessageType
from ai.config import AIConfig

async def get_agent_info(client: Client, agent_id: str):
    """Get agent information from the database"""
    result = await client.execute("SELECT * FROM users WHERE user_id = ? AND roles = 'role_agent'", [agent_id])
    if not result.rows:
        raise ValueError(f"Agent {agent_id} not found")
    
    row = result.rows[0]
    return {
        "id": row[0],
        "name": row[2],
        "icon": row[5] if row[5] else "👩‍🏫",
        "about": row[7]
    }

async def test_conversation():
    # Load environment variables
    load_dotenv()
    
    # Initialize libsql client
    db_path = os.getenv("PRISMA_DATABASE_URL").replace("file:", "")
    db_url = f"file://{os.path.abspath(db_path)}"
    client = create_client(url=db_url)
    
    try:
        # Initialize the AI config
        config = AIConfig()
        
        # Get agent info
        agent_id = "agent_lesson_teacher"
        agent_info = await get_agent_info(client, agent_id)
        print(f"\nFound agent: {agent_info['name']} {agent_info['icon']}\n")
        
        # Create Professor Ada instance
        ada = LessonTeacherAgent(agent_id, config)
        await ada.initialize(client)
        
        # Create a test context
        context = {
            "lesson_title": "Introduction to Python",
            "lesson_content": """
            Python is a high-level, interpreted programming language.
            Key features:
            1. Easy to read and write
            2. Large standard library
            3. Dynamic typing
            4. Automatic memory management
            """,
            "current_question": None,
            "user": {
                "name": "Test Student",
                "defaultDifficulty": "high_school",
                "about": "First-time programmer"
            },
            "questions_total": 0,
            "questions_correct": 0,
            "timestamp": int(time.time())
        }
        
        # Simulate student's first message
        student_message = Message(
            id="1",
            timestamp=int(time.time()),
            user_id="test_student",
            type=MessageType.USER_ANSWER,
            content="Hi Professor Ada! I'm excited to learn Python. Can you tell me what makes Python special?"
        )
        
        print("\n=== Starting conversation with Professor Ada ===\n")
        print(f"Student: {student_message.content}\n")
        
        # Get Ada's response
        response = await ada.process_message(student_message, context)
        print(f"Professor Ada ({response.metadata['agent_icon']}): {response.message.content}\n")
        
        # Ask Ada to generate a question
        print("=== Asking Ada to generate a question ===\n")
        context["question_number"] = 1
        question_response = await ada.ask_question(context)
        print(f"Professor Ada ({question_response.metadata['agent_icon']}): {question_response.message.content}\n")
        
        # Simulate student's answer
        student_answer = Message(
            id="2",
            timestamp=int(time.time()),
            user_id="test_student",
            type=MessageType.USER_ANSWER,
            content="Python is easy to read because it uses indentation and simple English-like syntax!"
        )
        
        print(f"Student: {student_answer.content}\n")
        
        # Get Ada's evaluation
        context["is_correct"] = True
        eval_response = await ada.evaluate_answer(student_answer, context)
        print(f"Professor Ada ({eval_response.metadata['agent_icon']}): {eval_response.message.content}\n")
        
        # Ask for a lesson summary
        print("=== Asking Ada for a lesson summary ===\n")
        summary_response = await ada.summarize_lesson(context)
        print(f"Professor Ada ({summary_response.metadata['agent_icon']}): {summary_response.message.content}\n")
        
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(test_conversation())
