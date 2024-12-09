import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Brain, MoreVertical, Trash2 } from 'lucide-react';
import { PageLayout } from '../shared/PageLayout';
import { ChatInterface } from '../shared/ChatInterface';
import { LearningTree } from '../shared/LearningTree';
import { LearningProgress } from './LearningProgress';
import { TopicService } from '@/lib/services/topic';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/db/client';
import type { Message } from '@/lib/types';
import type { Topic } from '@/lib/types/database';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
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
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const loadTopic = async () => {
      if (!id) return;

      try {
        const loadedTopic = await TopicService.getTopic(id);
        console.log('Loaded topic:', loadedTopic); // Debug log

        if (!loadedTopic) {
          toast({
            title: "Topic Not Found",
            description: "The requested topic could not be found.",
            variant: "destructive"
          });
          navigate('/dashboard');
          return;
        }

        setTopic(loadedTopic);

        // Initialize chat with a welcome message
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
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{topic.title}</h1>
              <p className="text-muted-foreground">{topic.description}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Topic
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <LearningProgress topicId={topic.id} />

        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2">
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
            />
          </div>

          <div className="space-y-6">
            <LearningTree
              topics={[{
                name: topic.lessonPlan?.mainTopics?.[0]?.name || "Learning Path",
                icon: Brain,
                subtopics: topic.lessonPlan?.mainTopics?.[0]?.subtopics || [
                  { name: 'Introduction', status: 'current' },
                  { name: 'Basic Concepts', status: 'upcoming' },
                  { name: 'Practice Exercises', status: 'upcoming' },
                  { name: 'Advanced Topics', status: 'upcoming' },
                  { name: 'Final Review', status: 'upcoming' }
                ]
              }]}
            />
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
    </PageLayout>
  );
}
