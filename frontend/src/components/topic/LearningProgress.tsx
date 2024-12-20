import { useEffect, useState, useRef } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, MoreVertical, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/lib/contexts/toast.context';
import { Topic } from '@/lib/types/database';

interface LearningProgressProps {
  topic: Topic;
  onDelete: () => void;
  onUpdate: (updates: Partial<Topic>) => Promise<void>;
}

export function LearningProgress({ topic, onDelete, onUpdate }: LearningProgressProps) {
  console.log('LearningProgress rendered with:', { 
    topic, 
    isEditingTitle: false,
    editedTitle: topic.title 
  });
  const { showToast } = useToast();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedTitle, setEditedTitle] = useState(topic.title);
  const [editedDescription, setEditedDescription] = useState(topic.description || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditedTitle(topic.title);
    setEditedDescription(topic.description || '');
  }, [topic]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.selectionStart = titleInputRef.current.value.length;
      titleInputRef.current.selectionEnd = titleInputRef.current.value.length;
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingDescription && descriptionTextareaRef.current) {
      descriptionTextareaRef.current.focus();
      descriptionTextareaRef.current.selectionStart = descriptionTextareaRef.current.value.length;
      descriptionTextareaRef.current.selectionEnd = descriptionTextareaRef.current.value.length;
    }
  }, [isEditingDescription]);

  const handleTitleSave = async () => {
    if (!editedTitle.trim()) {
      showToast('Title cannot be empty', 'error');
      setEditedTitle(topic.title);
      setIsEditingTitle(false);
      return;
    }

    if (editedTitle === topic.title) {
      setIsEditingTitle(false);
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdate({ title: editedTitle });
      showToast('Title updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update title', 'error');
      setEditedTitle(topic.title);
    } finally {
      setIsUpdating(false);
      setIsEditingTitle(false);
    }
  };

  const handleDescriptionSave = async () => {
    if (editedDescription === topic.description) {
      setIsEditingDescription(false);
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdate({ description: editedDescription });
      showToast('Description updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update description', 'error');
      setEditedDescription(topic.description || '');
    } finally {
      setIsUpdating(false);
      setIsEditingDescription(false);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    saveFunction: () => void
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveFunction();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditedTitle(topic.title);
      setEditedDescription(topic.description || '');
      setIsEditingTitle(false);
      setIsEditingDescription(false);
    }
  };

  const handleTitleBlur = () => {
    handleTitleSave();
  };

  const handleDescriptionBlur = () => {
    handleDescriptionSave();
  };

  // Calculate completion percentage based on completed topics
  const lessonPlan = topic.lessonPlan ?? {
    mainTopics: [],
    currentTopic: '',
    completedTopics: []
  };
  const completedTopics = lessonPlan.completedTopics.length;
  const totalTopics = lessonPlan.mainTopics.reduce(
    (total, mainTopic) => total + (mainTopic.subtopics?.length ?? 0) + 1,
    0
  );
  const completionPercentage = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-4 flex-1 mr-4">
            <div>
              {isEditingTitle ? (
                <Input
                  ref={titleInputRef}
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => handleKeyDown(e, handleTitleSave)}
                  className="text-2xl font-semibold"
                  disabled={isUpdating}
                />
              ) : (
                <h2
                  className="text-2xl font-semibold cursor-pointer hover:text-primary"
                  onClick={() => {
                    console.log('Title clicked, setting isEditingTitle to true');
                    setIsEditingTitle(true);
                  }}
                >
                  {editedTitle}
                </h2>
              )}
            </div>

            <div>
              {isEditingDescription ? (
                <Textarea
                  ref={descriptionTextareaRef}
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  onBlur={handleDescriptionBlur}
                  onKeyDown={(e) => handleKeyDown(e, handleDescriptionSave)}
                  className="text-muted-foreground resize-none"
                  placeholder="Add a description..."
                  disabled={isUpdating}
                />
              ) : (
                <p
                  className="text-muted-foreground cursor-pointer hover:text-foreground min-h-[1.5rem]"
                  onClick={() => setIsEditingDescription(true)}
                >
                  {editedDescription || 'Click to add a description...'}
                </p>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onSelect={() => onDelete()}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Topic
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {completionPercentage === 100 ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
            <span className="font-medium">
              {completionPercentage === 100 ? 'Completed' : 'In Progress'}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {completedTopics} of {totalTopics} topics completed
          </span>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </Card>
    </div>
  );
}
