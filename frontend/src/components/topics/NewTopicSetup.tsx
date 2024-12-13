import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/contexts/auth.context';
import { useToast } from '@/lib/contexts/toast.context';
import { topicsService } from '@/lib/services';

export default function NewTopicSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTopic = async () => {
    if (!user?.id || !title.trim()) return;

    setIsCreating(true);
    try {
      const topic = await topicsService.createTopic({
        userId: user.id,
        title: title.trim(),
        description: title.trim()
      });
      showToast('Topic created successfully', 'success');
      navigate(`/topic/${topic.id}`);
    } catch (error) {
      console.error('Failed to create topic:', error);
      showToast('Failed to create topic', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Create New Topic</h1>
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Topic Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="Enter topic title"
            />
          </div>
          <button
            onClick={handleCreateTopic}
            disabled={isCreating || !title.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create Topic'}
          </button>
        </div>
      </Card>
    </div>
  );
}
