import { useState, memo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface NewTopicFormProps {
  onSubmit: (title: string) => Promise<void>;
  isCreating: boolean;
}

function NewTopicFormComponent({ onSubmit, isCreating }: NewTopicFormProps) {
  const [title, setTitle] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isCreating) return;
    await onSubmit(title);
    setTitle('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
      <Input
        className="flex-1"
        placeholder="Enter a topic to start learning..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Button
        type="submit"
        className="w-full sm:w-auto whitespace-nowrap"
        disabled={isCreating || !title.trim()}
      >
        Start Learning
      </Button>
    </form>
  );
}

export const NewTopicForm = memo(NewTopicFormComponent);
