import React from 'react';
import { useAsync } from '../lib/hooks/useAsync';
import { topicsService } from '../lib/services';
import { useLoading } from '../lib/contexts/loading.context';

export function ExampleComponent() {
  const { isLoading } = useLoading();
  const { execute: fetchTopics, error } = useAsync(
    () => topicsService.getTopics(),
    {
      loadingKey: 'fetchTopics',
      onError: (error) => {
        console.error('Failed to fetch topics:', error.message);
      },
    }
  );

  return (
    <div>
      {isLoading('fetchTopics') && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      <button onClick={() => fetchTopics()}>Fetch Topics</button>
    </div>
  );
}
