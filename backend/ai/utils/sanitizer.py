import re
import html
from typing import Dict, Any
from ..models.message import Message

class MessageSanitizer:
    @staticmethod
    def sanitize_content(content: str) -> str:
        """Sanitize message content"""
        # Escape HTML entities
        content = html.escape(content)
        
        # Remove any potential script tags (even if escaped)
        content = re.sub(r'&lt;script.*?&gt;.*?&lt;/script&gt;', '', content, flags=re.DOTALL)
        
        # Remove any potential iframe tags
        content = re.sub(r'&lt;iframe.*?&gt;.*?&lt;/iframe&gt;', '', content, flags=re.DOTALL)
        
        # Remove excessive whitespace
        content = ' '.join(content.split())
        
        return content

    @staticmethod
    def sanitize_message(message: Message) -> Message:
        """Sanitize entire message object"""
        if message.content:
            message.content = MessageSanitizer.sanitize_content(message.content)
        return message
