import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { PageLayout } from '../shared/PageLayout';
import { ChatInterface } from '../shared/ChatInterface';
import { LearningTree } from '../shared/LearningTree';
import { LearningProgress } from './LearningProgress';
import { Topic, topicsService } from '@/lib/services/topics.service';
import { useToast } from '@/lib/contexts/toast.context';
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
  console.log('RENDER - TopicLearning component');
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
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
        const loadedTopic = await topicsService.getTopic(id);
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
        showToast('Failed to load the topic. Please try again.', 'error');
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadTopic();
  }, [id, navigate, showToast]);

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
      await topicsService.updateTopic(topic.id, {
        description: editedDescription
      });

      setTopic(prev => prev ? { ...prev, description: editedDescription } : null);
      setIsEditingDescription(false);
      setCursorPosition(null);
      showToast('Description updated successfully', 'success');
    } catch (error) {
      console.error('Error updating topic description:', error);
      showToast('Failed to update description', 'error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleDescriptionSave();
    }
  };

  const handleDeleteTopic = async () => {
    if (!id) return;

    try {
      await topicsService.deleteTopic(id);
      showToast('Topic deleted successfully', 'success');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting topic:', error);
      showToast('Failed to delete topic', 'error');
    }
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
          <div className="bg-card rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{topic.title}</h1>
                {isEditingDescription ? (
                  <textarea
                    ref={textareaRef}
                    value={editedDescription}
                    onChange={handleDescriptionChange}
                    onKeyDown={handleKeyDown}
                    onBlur={handleDescriptionSave}
                    className="w-full p-2 rounded-md border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={2}
                  />
                ) : (
                  <p
                    className="text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={startEditingDescription}
                  >
                    {topic.description || 'Click to add a description...'}
                  </p>
                )}
              </div>
              <button
                className="px-4 py-2 text-destructive hover:bg-destructive/10 rounded-md"
                onClick={() => setShowDeleteDialog(true)}
              >
                Delete Topic
              </button>
            </div>
            <LearningProgress topic={topic} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 container mx-auto px-4 min-h-0">
          <div className="grid grid-cols-3 gap-8 h-full">
            {/* Chat Interface */}
            <div className="col-span-2 h-full">
              <ChatInterface messages={messages} onSendMessage={() => {}} />
            </div>

            {/* Topic Tree */}
            <div className="h-full overflow-auto">
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
