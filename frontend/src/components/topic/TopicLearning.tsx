import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { PageLayout } from '../shared/PageLayout';
import { ChatInterface } from '../shared/ChatInterface';
import { LearningTree } from '../shared/LearningTree';
import { LearningProgress } from './LearningProgress';
import { Topic, topicsService } from '@/lib/services/topics.service';
import { useAuth } from '@/lib/contexts/auth.context';
import { toast } from '@/components/ui/use-toast';
import type { Message } from '@/lib/types';
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

export default function TopicLearning() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const loadTopic = async () => {
      if (!id) return;

      try {
        const loadedTopic = await topicsService.getTopic(id);
        if (!loadedTopic) {
          toast({
            title: "Error",
            description: "Topic not found",
            variant: "destructive",
          });
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
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTopic();
  }, [id, navigate]);

  const handleUpdateTopic = async (updates: Partial<Topic>) => {
    if (!id || !topic) return;

    try {
      const updatedTopic = await topicsService.updateTopic(id, updates);
      setTopic(updatedTopic);
      toast({
        title: "Success",
        description: "Topic updated successfully",
      });
    } catch (error) {
      console.error('Error updating topic:', error);
      toast({
        title: "Error",
        description: "Failed to update topic",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTopic = async () => {
    if (!id) return;

    try {
      await topicsService.deleteTopic(id);
      toast({
        title: "Success",
        description: "Topic deleted successfully",
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting topic:', error);
      toast({
        title: "Error",
        description: "Failed to delete topic",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!topic) return;

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      type: 'user',
      content
    };
    setMessages(prev => [...prev, userMessage]);

    // Simulate AI response (replace with actual AI integration)
    const aiMessage: Message = {
      id: messages.length + 2,
      type: 'ai',
      content: `I understand you want to learn about "${content}". Let me help you with that...`
    };
    setMessages(prev => [...prev, aiMessage]);
  };

  if (!id) {
    return null;
  }

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Brain className="w-8 h-8 animate-pulse" />
        </div>
      </PageLayout>
    );
  }

  if (!topic) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
          <h2 className="text-2xl font-semibold mb-2">Topic Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested topic could not be found.</p>
          <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            onClick={() => navigate('/dashboard')}
          >
            Return to Dashboard
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
        {/* Top Section */}
        <div className="container mx-auto px-4 py-2">
          <LearningProgress 
            topic={topic} 
            onUpdate={handleUpdateTopic}
            onDelete={() => setShowDeleteDialog(true)}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 container mx-auto px-4 min-h-0">
          <div className="grid grid-cols-3 gap-8 h-full">
            {/* Chat Interface */}
            <div className="col-span-2 h-full">
              <ChatInterface 
                messages={messages} 
                onSendMessage={handleSendMessage}
              />
            </div>

            {/* Topic Tree */}
            <div className="h-full overflow-auto bg-card rounded-xl p-4">
              <LearningTree topic={topic} />
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the topic
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTopic}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}
