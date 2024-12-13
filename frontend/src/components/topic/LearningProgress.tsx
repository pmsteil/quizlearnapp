import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, MoreVertical, Trash2, Square, Pencil } from 'lucide-react';
import { formatDuration } from '@/lib/utils/learning';
import type { Topic } from '@/lib/types/database';
import type { TopicProgress } from '@/lib/services/progress.service';
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
  progress: TopicProgress;
  onDelete: () => void;
  onUpdate?: (topic: Topic) => void;
}

export function LearningProgress({ topic, progress, onDelete, onUpdate }: LearningProgressProps) {
  const { showToast } = useToast();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedTitle, setEditedTitle] = useState(topic.title);
  const [editedDescription, setEditedDescription] = useState(topic.description);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setEditedTitle(topic.title);
    setEditedDescription(topic.description);
  }, [topic]);

  const handleTitleSave = async () => {
    if (editedTitle === topic.title) {
      setIsEditingTitle(false);
      return;
    }

    setIsUpdating(true);
    try {
      const updatedTopic = await topicsService.updateTopic(topic.id, {
        title: editedTitle,
        description: topic.description,
        lesson_plan: topic.lesson_plan
      });
      onUpdate?.(updatedTopic);
      showToast('Title updated successfully', 'success');
    } catch (error) {
      if (error instanceof Error) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to update title', 'error');
      }
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
        lesson_plan: topic.lesson_plan
      });
      onUpdate?.(updatedTopic);
      showToast('Description updated successfully', 'success');
    } catch (error) {
      if (error instanceof Error) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to update description', 'error');
      }
      setEditedDescription(topic.description);
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
      setEditedDescription(topic.description);
      setIsEditingTitle(false);
      setIsEditingDescription(false);
    }
  };

  return (
    <Card className="p-6">
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
                className="text-muted-foreground"
                disabled={isUpdating}
                autoFocus
              />
            ) : (
              <p
                className="text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => setIsEditingDescription(true)}
              >
                {topic.description}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-6">
              <Progress value={progress.completion_percentage} className="flex-1" />
              <span className="text-sm font-medium">
                {progress.completion_percentage}% Complete
              </span>
            </div>

            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-500 font-medium">
                    {progress.correct_answers}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-500 font-medium">
                    {progress.incorrect_answers}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Square className="w-5 h-5" />
                  <span>
                    {progress.total_questions - (progress.correct_answers + progress.incorrect_answers)} remaining
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-8">
                <div>
                  <span className="block text-foreground text-lg">
                    {formatDuration(progress.time_spent_minutes)}
                  </span>
                  <span>Time spent</span>
                </div>
                <div>
                  <span className="block text-foreground text-lg">
                    {Math.round((progress.correct_answers / (progress.correct_answers + progress.incorrect_answers || 1)) * 100)}%
                  </span>
                  <span>Accuracy</span>
                </div>
              </div>
            </div>
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
    </Card>
  );
}
