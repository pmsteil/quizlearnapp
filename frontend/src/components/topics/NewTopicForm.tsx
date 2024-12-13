import { useState, memo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface NewTopicFormProps {
  onSubmit: (data: { title: string; description: string }) => Promise<void>;
  isCreating: boolean;
}

function NewTopicFormComponent({ onSubmit, isCreating }: NewTopicFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || isCreating) return;
    await onSubmit({ title, description });
    setTitle('');
    setDescription('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <Input
          className="w-full"
          placeholder="Enter a topic title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div>
        <Textarea
          className="w-full"
          placeholder="Enter a description of what you want to learn..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      <div className="flex justify-end">
        <Button
          type="submit"
          className="whitespace-nowrap"
          disabled={isCreating || !title.trim() || !description.trim()}
        >
          Start Learning
        </Button>
      </div>
    </form>
  );
}

export const NewTopicForm = memo(NewTopicFormComponent);
