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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const showButton = title.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`flex gap-6 transition-all duration-500 ease-in-out ${showButton ? 'pr-[160px]' : ''}`}>
        <textarea
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="Create a New Topic..."
          className="flex-1 px-4 py-3 rounded-lg border border-input bg-background text-lg resize-none focus:border-primary leading-none overflow-hidden"
          style={{ height: '44px' }}
          disabled={isCreating}
        />
        <div className={`absolute right-0 transition-all duration-500 ease-in-out ${showButton ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}>
          <Button 
            type="submit" 
            disabled={isCreating || !title.trim()} 
            className="h-[44px] px-8 text-lg whitespace-nowrap"
          >
            {isCreating ? 'Creating...' : 'Create Topic'}
          </Button>
        </div>
      </div>
    </form>
  );
}
