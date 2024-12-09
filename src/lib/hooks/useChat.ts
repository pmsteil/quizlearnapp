import { useState } from 'react';
import type { ChatMessage } from '../types/chat';

export function useChat(initialMessages: ChatMessage[]) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  const sendMessage = (content: string) => {
    const newMessage: ChatMessage = {
      id: messages.length + 1,
      type: 'user',
      content
    };

    setMessages([...messages, newMessage]);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: messages.length + 2,
        type: 'ai',
        content: "Great! Let's explore that further. Can you tell me more about your thoughts on this?"
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  return {
    messages,
    sendMessage
  };
}