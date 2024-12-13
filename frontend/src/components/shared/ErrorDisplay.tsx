import React from 'react';

interface ErrorDisplayProps {
  error?: Error;
  message?: string;
}

export function ErrorDisplay({ error, message }: ErrorDisplayProps) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
      <h3 className="text-lg font-semibold text-red-800">Error</h3>
      <p className="text-red-600">{message || error?.message || 'An unknown error occurred'}</p>
    </div>
  );
}
