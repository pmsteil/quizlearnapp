import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { PageLayout } from '../shared/PageLayout';
import { ChatInterface } from '../shared/ChatInterface';
import { LearningTree } from '../shared/LearningTree';
import { LearningProgress } from './LearningProgress';
import { TopicService } from '@/lib/services/topic';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/db/client';
import type { Message } from '@/lib/types';
import type { Topic } from '@/lib/types/database';
import type { Subtopic } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Add this type conversion helper
function convertSubtopics(subtopics: any[]): Subtopic[] {
  return subtopics.map(s => ({
    name: s.name,
    status: s.status || 'upcoming'
  }));
}

export default function TopicLearning() {
  console.log('RENDER - TopicLearning component');
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    console.log('EFFECT - Topic changed:', topic?.description);
  }, [topic]);

  useEffect(() => {
    const loadTopic = async () => {
      if (!id) return;

      try {
        const loadedTopic = await TopicService.getTopic(id);
        if (!loadedTopic) {
          navigate('/dashboard');
          return;
        }
        setTopic(loadedTopic);
        setMessages([{
          id: 1,
          type: 'ai',
          content: `Welcome to ${loadedTopic.title}! I'm here to help you learn. What would you like to know about this topic?`
        }]);
      } catch (error) {
        console.error('Error loading topic:', error);
        toast({
          title: "Error",
          description: "Failed to load the topic. Please try again.",
          variant: "destructive"
        });
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadTopic();
  }, [id, navigate, toast]);

  // Effect to handle cursor position
  useEffect(() => {
    if (isEditingDescription && textareaRef.current && cursorPosition !== null) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
    }
  }, [isEditingDescription, cursorPosition]);

  const startEditingDescription = () => {
    if (!topic) return;
    const newValue = topic.description;
    setEditedDescription(newValue);
    setIsEditingDescription(true);
    setCursorPosition(newValue.length);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setEditedDescription(newValue);
    setCursorPosition(e.target.selectionStart);
  };

  const handleDescriptionSave = async () => {
    if (!topic) return;

    try {
      await db.execute({
        sql: 'UPDATE topics SET description = ? WHERE id = ?',
        args: [editedDescription, topic.id]
      });

      setTopic(prev => prev ? { ...prev, description: editedDescription } : null);
      setIsEditingDescription(false);
      setCursorPosition(null);
    } catch (error) {
      console.error('Error updating topic description:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleDescriptionSave();
    } else if (e.key === 'Escape') {
      setEditedDescription(topic?.description || '');
      setIsEditingDescription(false);
      setCursorPosition(null);
    }
  };

  const handleSendMessage = async (content: string) => {
    const newMessage: Message = {
      id: messages.length + 1,
      type: 'user',
      content
    };

    setMessages(prev => [...prev, newMessage]);

    // If this is the first user message (excluding the welcome message), update progress
    if (messages.length === 1 && topic?.progress === 0) {
      try {
        await db.execute({
          sql: 'UPDATE topics SET progress = 1, updated_at = ? WHERE id = ?',
          args: [Math.floor(Date.now() / 1000), topic.id]
        });

        // Update local state
        setTopic(prev => prev ? { ...prev, progress: 1 } : null);
      } catch (error) {
        console.error('Error updating topic progress:', error);
      }
    }

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: messages.length + 2,
        type: 'ai',
        content: `I understand you want to learn about "${content}". Let's explore that topic together. What specific aspects would you like to focus on?`
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleDeleteTopic = async () => {
    if (!topic) return;

    try {
      await db.execute({
        sql: 'DELETE FROM topics WHERE id = ?',
        args: [topic.id]
      });

      toast({
        title: "Topic Deleted",
        description: "The topic has been successfully deleted.",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting topic:', error);
      toast({
        title: "Error",
        description: "Failed to delete the topic. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-muted-foreground">Loading topic...</div>
        </div>
      </PageLayout>
    );
  }

  if (!topic) {
    return null;
  }

  return (
    <PageLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
        <div className="container mx-auto px-4 py-2">
          <LearningProgress
            topic={topic}
            onDelete={() => setShowDeleteDialog(true)}
          />
        </div>

        <div className="flex-1 container mx-auto px-4 min-h-0">
          <div className="grid grid-cols-3 gap-8 h-full">
            <div className="col-span-2 h-full flex flex-col min-h-0">
              <div className="flex-1 overflow-hidden">
                <ChatInterface
                  messages={messages}
                  onSendMessage={handleSendMessage}
                />
              </div>
            </div>

            <div className="overflow-y-auto">
              <LearningTree
                topics={[{
                  name: topic.lessonPlan?.mainTopics?.[0]?.name || "Learning Path",
                  icon: Brain,
                  subtopics: convertSubtopics(topic.lessonPlan?.mainTopics?.[0]?.subtopics || [
                    { name: 'Introduction', status: 'current' },
                    { name: 'Basic Concepts', status: 'upcoming' },
                    { name: 'Practice Exercises', status: 'upcoming' },
                    { name: 'Advanced Topics', status: 'upcoming' },
                    { name: 'Final Review', status: 'upcoming' }
                  ])
                }]}
              />
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Topic</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this topic? This action cannot be undone.
              All associated questions and progress will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTopic}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isEditingDescription ? (
        <textarea
          ref={textareaRef}
          name="description"
          className="w-full p-2 text-sm bg-background border rounded-md"
          value={editedDescription}
          onChange={handleDescriptionChange}
          onBlur={handleDescriptionSave}
          onKeyDown={handleKeyDown}
          onSelect={(e) => {
            const target = e.target as HTMLTextAreaElement;
            setCursorPosition(target.selectionStart);
          }}
        />
      ) : (
        <p
          className="text-sm text-muted-foreground cursor-pointer hover:text-foreground"
          onClick={startEditingDescription}
        >
          {topic?.description}
        </p>
      )}
    </PageLayout>
  );
}
