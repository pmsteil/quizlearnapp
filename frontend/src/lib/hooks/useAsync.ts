import { useState, useCallback } from 'react';
import { useLoading } from '../contexts/loading.context';
import { handleError, AppError } from '../utils/error';
import { useToast } from '../contexts/toast.context';

interface UseAsyncOptions {
  loadingKey?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: AppError) => void;
  showToast?: boolean;
  successMessage?: string;
}

export function useAsync<T = any>(
  asyncFn: (...args: any[]) => Promise<T>,
  options: UseAsyncOptions = {}
) {
  const {
    loadingKey,
    onSuccess,
    onError,
    showToast = true,
    successMessage
  } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [loading, setLoading] = useState(false);
  const { startLoading, stopLoading } = useLoading();
  const { showToast: toast } = useToast();

  const execute = useCallback(
    async (...args: any[]) => {
      try {
        setError(null);
        setLoading(true);
        if (loadingKey) {
          startLoading(loadingKey);
        }

        const result = await asyncFn(...args);
        console.log('useAsync result:', result);
        setData(result);

        if (showToast && successMessage) {
          toast(successMessage, 'success');
        }
        onSuccess?.(result);
        return result;
      } catch (err) {
        const appError = handleError(err);
        setError(appError);
        if (showToast) {
          toast(appError.message, 'error');
        }
        onError?.(appError);
        throw appError;
      } finally {
        setLoading(false);
        if (loadingKey) {
          stopLoading(loadingKey);
        }
      }
    },
    [asyncFn, loadingKey, onSuccess, onError, showToast, successMessage, toast, startLoading, stopLoading]
  );

  return {
    data,
    error,
    loading,
    execute,
  };
}
