import { useState, memo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface NewTopicFormProps {
  onSubmit: (topic: string) => Promise<void>;
  isCreating: boolean;
}

function NewTopicFormComponent({ onSubmit, isCreating }: NewTopicFormProps) {
  const [newTopic, setNewTopic] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim() || isCreating) return;
    await onSubmit(newTopic);
    setNewTopic('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
      <Input
        className="flex-1"
        placeholder="Enter a topic to start learning..."
        value={newTopic}
        onChange={(e) => setNewTopic(e.target.value)}
      />
      <Button
        type="submit"
        className="w-full sm:w-auto whitespace-nowrap"
        disabled={isCreating || !newTopic.trim()}
      >
        Start Learning
      </Button>
    </form>
  );
}

export const NewTopicForm = memo(NewTopicFormComponent);
