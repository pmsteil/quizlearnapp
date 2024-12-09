import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, MoreVertical, Trash2, Square, Pencil } from 'lucide-react';
import { TopicService, type TopicProgress } from '@/lib/services/topic';
import { formatDuration } from '@/lib/utils/learning';
import type { Topic } from '@/lib/types/database';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { db } from '@/lib/db/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface LearningProgressProps {
  topic: Topic;
  onDelete: () => void;
}

export function LearningProgress({ topic, onDelete }: LearningProgressProps) {
  const [progress, setProgress] = useState<TopicProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedTitle, setEditedTitle] = useState(topic.title);
  const [editedDescription, setEditedDescription] = useState(topic.description);

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const data = await TopicService.getTopicProgress(topic.id);
        setProgress(data);
      } catch (error) {
        console.error('Error loading progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [topic.id]);

  const handleUpdateTopic = async () => {
    try {
      await db.execute({
        sql: 'UPDATE topics SET title = ?, description = ?, updated_at = ? WHERE id = ?',
        args: [editedTitle, editedDescription, Math.floor(Date.now() / 1000), topic.id]
      });
      setIsEditingTitle(false);
      setIsEditingDescription(false);
      // Update the topic in parent component if needed
    } catch (error) {
      console.error('Error updating topic:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: 'title' | 'description') => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUpdateTopic();
    } else if (e.key === 'Escape') {
      if (field === 'title') {
        setEditedTitle(topic.title);
        setIsEditingTitle(false);
      } else {
        setEditedDescription(topic.description);
        setIsEditingDescription(false);
      }
    }
  };

  if (isLoading || !progress) {
    return (
      <Card className="p-6 mb-8">
        <div className="text-muted-foreground">Loading progress...</div>
      </Card>
    );
  }

  const totalAnswered = progress.correctAnswers + progress.incorrectAnswers;
  const remainingQuestions = Math.max(0, progress.totalQuestions - totalAnswered);
  const accuracy = totalAnswered > 0
    ? Math.round((progress.correctAnswers / totalAnswered) * 100)
    : 0;
  const progressPercentage = totalAnswered > 0
    ? Math.round((totalAnswered / progress.totalQuestions) * 100)
    : 0;

  return (
    <Card className="p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 mr-4">
          <div className="flex items-start gap-2 mb-2">
            {isEditingTitle ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleUpdateTopic}
                onKeyDown={(e) => handleKeyDown(e, 'title')}
                className="text-3xl font-bold h-auto py-1"
                autoFocus
              />
            ) : (
              <h1
                className="text-3xl font-bold cursor-pointer hover:text-muted-foreground transition-colors flex items-center gap-2"
                onClick={() => setIsEditingTitle(true)}
              >
                {editedTitle}
                <Pencil className="h-4 w-4 opacity-0 group-hover:opacity-100" />
              </h1>
            )}
          </div>
          {isEditingDescription ? (
            <Textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              onBlur={handleUpdateTopic}
              onKeyDown={(e) => handleKeyDown(e, 'description')}
              className="text-muted-foreground resize-none"
              autoFocus
            />
          ) : (
            <p
              className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors flex items-center gap-2"
              onClick={() => setIsEditingDescription(true)}
            >
              {editedDescription}
              <Pencil className="h-4 w-4 opacity-0 group-hover:opacity-100" />
            </p>
          )}
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
              onClick={onDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Topic
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Current Progress</div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-500 font-medium">
                {progress.correctAnswers}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-500 font-medium">
                {progress.incorrectAnswers}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Square className="w-5 h-5 text-muted-foreground" />
              <span className="text-muted-foreground">
                {remainingQuestions} remaining
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-8 text-sm text-muted-foreground">
          <div>
            <span className="block text-foreground text-lg">
              {formatDuration(progress.timeSpentMinutes)}
            </span>
            <span>Time spent</span>
          </div>
          <div>
            <span className="block text-foreground text-lg">
              {accuracy}%
            </span>
            <span>Accuracy</span>
          </div>
        </div>
      </div>
      <Progress value={progressPercentage} className="h-2" />
    </Card>
  );
}
