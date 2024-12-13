import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface NewTopicFormProps {
  onSubmit: (title: string) => Promise<void>;
  isCreating: boolean;
}

export function NewTopicForm({ onSubmit, isCreating }: NewTopicFormProps) {
  const [title, setTitle] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmit(title.trim());
      setTitle('');
      setIsFocused(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-4">
        <textarea
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Create a New Topic..."
          className="flex-1 p-4 rounded-lg border border-input bg-background text-lg resize-none focus:border-primary"
          style={{ height: '52px', minHeight: '52px', maxHeight: '52px' }}
          disabled={isCreating}
        />
        {(title.trim() || isFocused) && (
          <Button 
            type="submit" 
            disabled={isCreating || !title.trim()} 
            className="px-8 text-lg whitespace-nowrap"
          >
            {isCreating ? 'Creating...' : 'Create Topic'}
          </Button>
        )}
      </div>
    </form>
  );
}
