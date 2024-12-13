import { useEffect, useState, useRef, useCallback } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, MoreVertical, Trash2, Square, Pencil } from 'lucide-react';
import { formatDuration } from '@/lib/utils/learning';
import type { Topic } from '@/lib/types/database';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/lib/contexts/toast.context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { topicsService } from '@/lib/services/topics.service';

interface LearningProgressProps {
  topic: Topic;
  onDelete?: () => void;
  onUpdate?: (topic: Topic) => void;
}

export function LearningProgress({ topic, onDelete, onUpdate }: LearningProgressProps) {
  const { showToast } = useToast();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedTitle, setEditedTitle] = useState(topic.title);
  const [editedDescription, setEditedDescription] = useState(topic.description || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditedTitle(topic.title);
    setEditedDescription(topic.description || '');
  }, [topic]);

  // Handle clicks outside of the editing area
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Ignore clicks if we're not in edit mode
      if (!isEditingTitle && !isEditingDescription) return;
      
      // Get the clicked element
      const target = event.target as HTMLElement;
      
      // If we clicked an input/textarea that we're currently editing, ignore it
      if (isEditingTitle && titleInputRef.current?.contains(target)) return;
      if (isEditingDescription && descriptionTextareaRef.current?.contains(target)) return;
      
      // If we clicked outside our container, save and exit edit mode
      if (!containerRef.current?.contains(target)) {
        if (isEditingTitle) handleTitleSave();
        if (isEditingDescription) handleDescriptionSave();
      }
    }

    // Add listener with a slight delay to avoid menu conflicts
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditingTitle, isEditingDescription]);

  const handleTitleSave = async () => {
    if (!editedTitle.trim()) {
      showToast('Title cannot be empty', 'error');
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdate({ title: editedTitle });
      setIsEditingTitle(false);
    } catch (error) {
      showToast('Failed to update title', 'error');
    }
    setIsUpdating(false);
  };

  const handleDescriptionSave = async () => {
    setIsUpdating(true);
    try {
      await onUpdate({ description: editedDescription });
      setIsEditingDescription(false);
    } catch (error) {
      showToast('Failed to update description', 'error');
    }
    setIsUpdating(false);
  };

  // Handle focus management
  const startEditing = useCallback((type: 'title' | 'description') => {
    if (type === 'title') {
      // If we're editing description, save it first
      if (isEditingDescription) {
        handleDescriptionSave();
      }
      setIsEditingTitle(true);
      setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.focus();
          titleInputRef.current.selectionStart = titleInputRef.current.value.length;
          titleInputRef.current.selectionEnd = titleInputRef.current.value.length;
        }
      }, 0);
    } else {
      // If we're editing title, save it first
      if (isEditingTitle) {
        handleTitleSave();
      }
      setIsEditingDescription(true);
      setTimeout(() => {
        if (descriptionTextareaRef.current) {
          descriptionTextareaRef.current.focus();
          descriptionTextareaRef.current.selectionStart = descriptionTextareaRef.current.value.length;
          descriptionTextareaRef.current.selectionEnd = descriptionTextareaRef.current.value.length;
        }
      }, 0);
    }
  }, [isEditingTitle, isEditingDescription, handleTitleSave, handleDescriptionSave]);

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    saveHandler: () => void
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveHandler();
    }
  };

  // Calculate completion percentage based on completed topics
  const completedTopics = topic.lessonPlan?.completedTopics?.length ?? 0;
  const totalTopics = topic.lessonPlan?.mainTopics?.reduce(
    (acc, mainTopic) => acc + (mainTopic.subtopics?.length ?? 0) + 1,
    0
  ) ?? 0;
  const completionPercentage = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <div className="space-y-6" ref={containerRef}>
      <div className="flex items-start justify-between">
        <div className="space-y-4 flex-1 mr-4">
          <div>
            {isEditingTitle ? (
              <Input
                ref={titleInputRef}
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleTitleSave)}
                className="text-2xl font-semibold"
                disabled={isUpdating}
              />
            ) : (
              <h2
                className="text-2xl font-semibold cursor-pointer hover:text-primary"
                onClick={() => startEditing('title')}
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
                onKeyDown={(e) => handleKeyDown(e, handleDescriptionSave)}
                className="text-muted-foreground resize-none"
                placeholder="Add a description..."
                disabled={isUpdating}
              />
            ) : (
              <p
                className="text-muted-foreground cursor-pointer hover:text-foreground min-h-[1.5rem]"
                onClick={() => startEditing('description')}
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

      <div className="space-y-4">
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <div className="flex items-center space-x-8">
            <div>
              <span className="block text-foreground text-lg font-medium">
                {completionPercentage}%
              </span>
              <span>Completion</span>
            </div>
            <div>
              <span className="block text-foreground text-lg font-medium">
                {completedTopics} / {totalTopics}
              </span>
              <span>Topics Completed</span>
            </div>
          </div>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>
    </div>
  );
}
