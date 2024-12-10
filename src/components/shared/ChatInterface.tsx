import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, User, Bot } from 'lucide-react';
import type { Message } from '@/lib/types';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
}

export function ChatInterface({ messages, onSendMessage }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
      inline: 'nearest'
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-focus the input on component mount
  useEffect(() => {
    const inputElement = document.querySelector<HTMLInputElement>('input[type="text"]');
    if (inputElement) {
      inputElement.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="h-[88%] flex flex-col">
      <div className="flex-1 overflow-y-auto min-h-0">
        <div
          ref={messagesContainerRef}
          className="p-4 space-y-4 pb-0"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] flex items-start gap-2 ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground ml-4'
                    : 'bg-muted mr-4'
                }`}
              >
                {message.type === 'user' ? (
                  <User className="h-5 w-5 mt-1 shrink-0" />
                ) : (
                  <Bot className="h-5 w-5 mt-1 shrink-0" />
                )}
                <span>{message.content}</span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} className="h-0" />
        </div>
      </div>

      <div className="border-t bg-background">
        <form
          onSubmit={handleSubmit}
          className="flex gap-2 p-4"
        >
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            autoFocus
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
