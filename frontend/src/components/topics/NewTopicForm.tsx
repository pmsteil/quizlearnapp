import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
      <div className="flex items-center gap-2 px-4">
        <textarea
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="Create a New Topic..."
          className="flex-1 min-w-0 px-4 py-3 rounded-lg border border-input bg-background text-lg resize-none focus:border-primary leading-none overflow-hidden"
          style={{ height: '44px' }}
          disabled={isCreating}
        />
        <div className={`flex-shrink-0 transition-all duration-500 ease-in-out ${showButton ? 'opacity-100 translate-x-0 w-auto' : 'opacity-0 translate-x-4 w-0'}`}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="submit" 
                  disabled={isCreating || !title.trim()} 
                  className="h-[44px] w-[44px] p-0"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create Topic</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </form>
  );
}
