from typing import Optional, Dict, Any
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from ..models.message import Message, MessageType, ChatResponse
from ..utils.errors import AgentError
from .base import BaseQuizLearnAgent

class LessonEvaluatorAgent(BaseQuizLearnAgent):
    async def get_prompt(self, prompt_type: str, context: Dict[str, Any]) -> str:
        """Get the appropriate prompt for the current context"""
        try:
            # Use the evaluation prompt for all interactions
            prompt = self.agent_info.get('about', {}).get('prompt', {}).get('evaluation')
            if not prompt:
                raise AgentError(f"No evaluation prompt found for agent {self.agent_id}")
            
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
            # Get the evaluation prompt
            prompt = await self.get_prompt('evaluation', context)
            
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

    async def evaluate_lesson(self, context: Dict[str, Any]) -> ChatResponse:
        """Evaluate a lesson's effectiveness"""
        try:
            # Get the evaluation prompt
            prompt = await self.get_prompt('evaluation', context)
            
            # Add instruction to evaluate the lesson
            eval_instruction = HumanMessage(
                content="Please evaluate the effectiveness of this lesson, considering student engagement, understanding, and areas for improvement."
            )
            self.conversation_history.append(eval_instruction)
            
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
            raise AgentError(f"Failed to evaluate lesson: {str(e)}")

    async def analyze_progress(self, context: Dict[str, Any]) -> ChatResponse:
        """Analyze student progress and provide recommendations"""
        try:
            # Get the evaluation prompt
            prompt = await self.get_prompt('evaluation', context)
            
            # Add instruction to analyze progress
            analysis_instruction = HumanMessage(
                content="Please analyze the student's progress and provide recommendations for improvement."
            )
            self.conversation_history.append(analysis_instruction)
            
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
            raise AgentError(f"Failed to analyze progress: {str(e)}")

    async def provide_recommendations(self, context: Dict[str, Any]) -> ChatResponse:
        """Provide recommendations for improving the lesson"""
        try:
            # Get the evaluation prompt
            prompt = await self.get_prompt('evaluation', context)
            
            # Add instruction to provide recommendations
            recommendations_instruction = HumanMessage(
                content="Please provide specific recommendations for improving this lesson based on your evaluation."
            )
            self.conversation_history.append(recommendations_instruction)
            
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
            raise AgentError(f"Failed to provide recommendations: {str(e)}")
