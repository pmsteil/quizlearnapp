import { useEffect, useState } from 'react';
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

  useEffect(() => {
    setEditedTitle(topic.title);
    setEditedDescription(topic.description || '');
  }, [topic]);

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
      const updatedTopic = await topicsService.updateTopic(topic.id, {
        title: editedTitle,
        description: topic.description,
        lessonPlan: topic.lessonPlan
      });
      onUpdate?.(updatedTopic);
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
      const updatedTopic = await topicsService.updateTopic(topic.id, {
        title: topic.title,
        description: editedDescription,
        lessonPlan: topic.lessonPlan
      });
      onUpdate?.(updatedTopic);
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

  // Calculate completion percentage based on completed topics
  const completedTopics = topic.lessonPlan.completedTopics.length;
  const totalTopics = topic.lessonPlan.mainTopics.reduce(
    (total, mainTopic) => total + mainTopic.subtopics.length,
    0
  );
  const completionPercentage = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-4 flex-1 mr-4">
          <div>
            {isEditingTitle ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => handleKeyDown(e, handleTitleSave)}
                className="text-2xl font-semibold"
                disabled={isUpdating}
                autoFocus
              />
            ) : (
              <h2
                className="text-2xl font-semibold cursor-pointer hover:text-primary"
                onClick={() => setIsEditingTitle(true)}
              >
                {topic.title}
              </h2>
            )}
          </div>

          <div>
            {isEditingDescription ? (
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                onBlur={handleDescriptionSave}
                onKeyDown={(e) => handleKeyDown(e, handleDescriptionSave)}
                className="text-muted-foreground resize-none"
                placeholder="Add a description..."
                disabled={isUpdating}
                autoFocus
              />
            ) : (
              <p
                className="text-muted-foreground cursor-pointer hover:text-foreground min-h-[1.5rem]"
                onClick={() => setIsEditingDescription(true)}
              >
                {topic.description || 'Click to add a description...'}
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
            <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Title
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsEditingDescription(true)}>
              <Square className="mr-2 h-4 w-4" />
              Edit Description
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
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
