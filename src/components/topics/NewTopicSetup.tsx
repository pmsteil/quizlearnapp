import { useState } from 'react';
import { PageLayout } from '../shared/PageLayout';
import { ChatInterface } from '../shared/ChatInterface';
import { LearningTree } from '../shared/LearningTree';
import type { Message, SubtopicStatus } from '@/lib/types';
import { INITIAL_SETUP_MESSAGES, GUITAR_LEARNING_PLAN } from './constants';

export default function NewTopicSetup() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_SETUP_MESSAGES);

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: messages.length + 1,
      type: 'user',
      content
    };

    setMessages([...messages, newMessage]);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: messages.length + 2,
        type: 'ai',
        content: "Perfect! I recommend starting with 15-20 minutes of practice daily. This helps build muscle memory without overwhelming you. I've updated the learning plan with this schedule. Would you like to begin with your first lesson on guitar basics?"
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const topicsWithStatus = GUITAR_LEARNING_PLAN.mainTopics.map(topic => ({
    ...topic,
    subtopics: topic.subtopics.map(subtopic => ({
      ...subtopic,
      status: 'upcoming' as SubtopicStatus
    }))
  }));

  return (
    <PageLayout>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
          />
        </div>

        <div className="space-y-6">
          <LearningTree topics={topicsWithStatus} />
        </div>
      </div>
    </PageLayout>
  );
}
