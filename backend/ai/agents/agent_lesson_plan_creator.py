from typing import Optional, Dict, Any
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from ..models.message import Message, MessageType, ChatResponse
from ..utils.errors import AgentError
from .base import BaseQuizLearnAgent

class LessonPlanCreatorAgent(BaseQuizLearnAgent):
    async def get_prompt(self, prompt_type: str, context: Dict[str, Any]) -> str:
        """Get the appropriate prompt for the current context"""
        try:
            # Use the lesson plan prompt for all interactions
            prompt = self.agent_info.get('about', {}).get('prompt', {}).get('lesson_plan')
            if not prompt:
                raise AgentError(f"No lesson plan prompt found for agent {self.agent_id}")
            
            # Replace placeholders in the prompt
            for key, value in context.items():
                if isinstance(value, dict):
                    for subkey, subvalue in value.items():
                        prompt = prompt.replace(f"{{{{{key}.{subkey}}}}}", str(subvalue))
                else:
                    prompt = prompt.replace(f"{{{{{key}}}}}", str(value))
            
            return prompt
        except Exception as e:
            raise AgentError(f"Failed to get prompt: {str(e)}")

    async def process_message(self, message: Message, context: Dict[str, Any]) -> ChatResponse:
        """Process a message from the user"""
        try:
            # Get the lesson plan prompt
            prompt = await self.get_prompt('lesson_plan', context)
            
            # Add the user's message to conversation history
            self.conversation_history.append(HumanMessage(content=message.content))
            
            # Get response from language model
            ai_message = await self.llm.ainvoke(self.conversation_history)
            
            # Add AI response to conversation history
            self.conversation_history.append(ai_message)
            
            return ChatResponse(
                message=Message(
                    id=message.id,
                    timestamp=message.timestamp,
                    user_id=self.agent_id,
                    type=MessageType.AGENT_TEACHING,
                    content=ai_message.content
                ),
                metadata={
                    "agent_name": self.agent_info["name"],
                    "agent_icon": self.agent_info["icon"]
                }
            )
        except Exception as e:
            raise AgentError(f"Failed to process message: {str(e)}")

    async def create_lesson_plan(self, context: Dict[str, Any]) -> ChatResponse:
        """Create a lesson plan for a topic"""
        try:
            # Get the lesson plan prompt
            prompt = await self.get_prompt('lesson_plan', context)
            
            # Add instruction to create a lesson plan
            plan_instruction = HumanMessage(
                content="Please create a structured lesson plan for this topic, including learning objectives, key concepts, and practice exercises."
            )
            self.conversation_history.append(plan_instruction)
            
            # Get response from language model
            ai_message = await self.llm.ainvoke(self.conversation_history)
            
            # Add AI response to conversation history
            self.conversation_history.append(ai_message)
            
            return ChatResponse(
                message=Message(
                    id=str(context.get("timestamp", 0)),
                    timestamp=context.get("timestamp", 0),
                    user_id=self.agent_id,
                    type=MessageType.AGENT_TEACHING,
                    content=ai_message.content
                ),
                metadata={
                    "agent_name": self.agent_info["name"],
                    "agent_icon": self.agent_info["icon"]
                }
            )
        except Exception as e:
            raise AgentError(f"Failed to create lesson plan: {str(e)}")

    async def revise_lesson_plan(self, message: Message, context: Dict[str, Any]) -> ChatResponse:
        """Revise a lesson plan based on feedback"""
        try:
            # Get the lesson plan prompt
            prompt = await self.get_prompt('lesson_plan', context)
            
            # Add instruction to revise the lesson plan
            revision_instruction = HumanMessage(
                content=f"Please revise the lesson plan based on this feedback:\n\n{message.content}"
            )
            self.conversation_history.append(revision_instruction)
            
            # Get response from language model
            ai_message = await self.llm.ainvoke(self.conversation_history)
            
            # Add AI response to conversation history
            self.conversation_history.append(ai_message)
            
            return ChatResponse(
                message=Message(
                    id=message.id,
                    timestamp=message.timestamp,
                    user_id=self.agent_id,
                    type=MessageType.AGENT_TEACHING,
                    content=ai_message.content
                ),
                metadata={
                    "agent_name": self.agent_info["name"],
                    "agent_icon": self.agent_info["icon"]
                }
            )
        except Exception as e:
            raise AgentError(f"Failed to revise lesson plan: {str(e)}")
