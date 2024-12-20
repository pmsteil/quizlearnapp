from typing import Optional, Dict, Any
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from ..models.message import Message, MessageType, ChatResponse
from ..utils.errors import AgentError
from .base import BaseQuizLearnAgent

class LessonTeacherAgent(BaseQuizLearnAgent):
    async def get_prompt(self, prompt_type: str, context: Dict[str, Any]) -> str:
        """Get the appropriate prompt for the current context"""
        try:
            # Use the teaching prompt for all interactions
            prompt = self.agent_info.get('about', {}).get('prompt', {}).get('teaching')
            if not prompt:
                raise AgentError(f"No teaching prompt found for agent {self.agent_id}")
            
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
            # Get the teaching prompt
            prompt = await self.get_prompt('teaching', context)
            
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

    async def ask_question(self, context: Dict[str, Any]) -> ChatResponse:
        """Generate a question for the student"""
        try:
            # Get the teaching prompt
            prompt = await self.get_prompt('teaching', context)
            
            # Add instruction to generate a question
            question_instruction = HumanMessage(content="Please generate a question for the student based on the current lesson.")
            self.conversation_history.append(question_instruction)
            
            # Get response from language model
            ai_message = await self.llm.ainvoke(self.conversation_history)
            
            # Add AI response to conversation history
            self.conversation_history.append(ai_message)
            
            # Update context with the current question
            context["current_question"] = ai_message.content
            
            return ChatResponse(
                message=Message(
                    id=str(context.get("question_number", 1)),
                    timestamp=context.get("timestamp", 0),
                    user_id=self.agent_id,
                    type=MessageType.AGENT_QUESTION,
                    content=ai_message.content
                ),
                metadata={
                    "agent_name": self.agent_info["name"],
                    "agent_icon": self.agent_info["icon"],
                    "question_number": context.get("question_number", 1)
                }
            )
        except Exception as e:
            raise AgentError(f"Failed to generate question: {str(e)}")

    async def evaluate_answer(self, answer: Message, context: Dict[str, Any]) -> ChatResponse:
        """Evaluate the student's answer"""
        try:
            # Get the teaching prompt
            prompt = await self.get_prompt('teaching', context)
            
            # Add instruction to evaluate the answer
            eval_instruction = HumanMessage(
                content=f"Please evaluate the student's answer to the current question:\n\nQuestion: {context.get('current_question', '')}\nAnswer: {answer.content}"
            )
            self.conversation_history.append(eval_instruction)
            
            # Get response from language model
            ai_message = await self.llm.ainvoke(self.conversation_history)
            
            # Add AI response to conversation history
            self.conversation_history.append(ai_message)
            
            return ChatResponse(
                message=Message(
                    id=answer.id,
                    timestamp=answer.timestamp,
                    user_id=self.agent_id,
                    type=MessageType.AGENT_EVALUATION,
                    content=ai_message.content
                ),
                metadata={
                    "agent_name": self.agent_info["name"],
                    "agent_icon": self.agent_info["icon"],
                    "is_correct": context.get("is_correct", False)
                }
            )
        except Exception as e:
            raise AgentError(f"Failed to evaluate answer: {str(e)}")

    async def summarize_lesson(self, context: Dict[str, Any]) -> ChatResponse:
        """Generate a summary of the lesson"""
        try:
            # Get the teaching prompt
            prompt = await self.get_prompt('teaching', context)
            
            # Add instruction to summarize the lesson
            summary_instruction = HumanMessage(
                content="Please provide a summary of what we've covered in this lesson, highlighting key points and concepts."
            )
            self.conversation_history.append(summary_instruction)
            
            # Get response from language model
            ai_message = await self.llm.ainvoke(self.conversation_history)
            
            # Add AI response to conversation history
            self.conversation_history.append(ai_message)
            
            return ChatResponse(
                message=Message(
                    id=str(context.get("timestamp", 0)),
                    timestamp=context.get("timestamp", 0),
                    user_id=self.agent_id,
                    type=MessageType.AGENT_SUMMARY,
                    content=ai_message.content
                ),
                metadata={
                    "agent_name": self.agent_info["name"],
                    "agent_icon": self.agent_info["icon"]
                }
            )
        except Exception as e:
            raise AgentError(f"Failed to generate summary: {str(e)}")
