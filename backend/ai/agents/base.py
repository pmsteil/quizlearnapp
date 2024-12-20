from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from libsql_client import Client
import json
from ..models.message import Message, ChatResponse
from ..utils.errors import AgentError
from ..config import AIConfig
import sqlite3

class BaseQuizLearnAgent(ABC):
    def __init__(self, agent_id: str, config: AIConfig):
        """Initialize the base agent with its configuration"""
        self.agent_id = agent_id
        self.config = config
        self.agent_config = config.AGENT_CONFIGS.get(agent_id, {})
        
        # Initialize the language model
        self.llm = ChatOpenAI(
            model_name=self.agent_config.get('model') or config.OPENAI_MODEL,
            temperature=self.agent_config.get('temperature', config.TEMPERATURE),
            streaming=self.agent_config.get('streaming', False),
            max_tokens=self.agent_config.get('max_tokens', config.MAX_TOKENS),
            openai_api_key=config.OPENAI_API_KEY
        )
        
        # Initialize conversation history
        self.conversation_history = []
        
        # Load agent info from database
        try:
            conn = sqlite3.connect(config.DATABASE_PATH)
            cursor = conn.cursor()
            cursor.execute(
                "SELECT name, icon, about FROM users WHERE user_id = ?",
                (agent_id,)
            )
            result = cursor.fetchone()
            if not result:
                raise AgentError(f"Agent {agent_id} not found in database")
            
            name, icon, about = result
            self.agent_info = {
                "name": name,
                "icon": icon,
                "about": eval(about) if about else {}
            }
            conn.close()
        except Exception as e:
            raise AgentError(f"Failed to load agent info: {str(e)}")
        
        # Initialize conversation history with system message
        base_prompt = self.agent_info.get('about', {}).get('prompt', {}).get('base')
        if base_prompt:
            self.conversation_history.append(SystemMessage(content=base_prompt))

    async def initialize(self, client: Client) -> None:
        """Load agent information from the database"""
        try:
            # Get agent info from database
            result = await client.execute(
                "SELECT name, icon, about FROM users WHERE user_id = ? AND roles = 'role_agent'",
                [self.agent_id]
            )
            
            if not result.rows:
                raise AgentError(f"Agent {self.agent_id} not found")
            
            row = result.rows[0]
            self.agent_info = {
                "name": row[0],
                "icon": row[1] if row[1] else "👩‍🏫",
                "about": json.loads(row[2]) if row[2] else {}
            }
            
            # Get base prompt from about field
            self.base_prompt = self.agent_info.get('about', {}).get('prompt', {}).get('base', '')
            
            # Add the base prompt to conversation history
            if self.base_prompt:
                self.conversation_history.append(SystemMessage(content=self.base_prompt))
                
        except Exception as e:
            raise AgentError(f"Failed to initialize agent: {str(e)}")

    def _format_message_for_history(self, message: Message) -> HumanMessage | AIMessage:
        """Format a message for the conversation history"""
        if message.user_id == self.agent_id:
            return AIMessage(content=message.content)
        return HumanMessage(content=message.content)

    def add_to_history(self, message: Message) -> None:
        """Add a message to the conversation history"""
        self.conversation_history.append(self._format_message_for_history(message))

    def clear_history(self) -> None:
        """Clear the conversation history except for the base prompt"""
        base_prompt = next((msg for msg in self.conversation_history if isinstance(msg, SystemMessage)), None)
        self.conversation_history = [base_prompt] if base_prompt else []

    @abstractmethod
    async def process_message(self, message: Message, context: Dict[str, Any] = None) -> ChatResponse:
        """Process an incoming message and generate a response"""
        pass

    @abstractmethod
    async def get_prompt(self, prompt_type: str, context: Dict[str, Any] = None) -> str:
        """Get a specific prompt template and format it with context"""
        pass
