import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Save } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import type { TopicLesson } from '@/lib/types';

interface LessonContentProps {
  lesson: TopicLesson;
  onEdit: (content: string) => Promise<void>;
}

export function LessonContent({ lesson, onEdit }: LessonContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(lesson.content);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onEdit(content);
      setIsEditing(false);
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{lesson.title}</h2>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setContent(lesson.content);
                  setIsEditing(false);
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {isEditing ? (
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[400px] font-mono"
          placeholder="Enter lesson content here..."
        />
      ) : (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {content}
        </div>
      )}
    </div>
  );
}
