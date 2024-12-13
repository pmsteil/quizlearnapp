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
  const [error, setError] = useState<AppError | null>(null);
  const { startLoading, stopLoading } = useLoading();
  const { showToast: toast } = useToast();

  const execute = useCallback(
    async (...args: any[]) => {
      try {
        setError(null);
        if (loadingKey) {
          startLoading(loadingKey);
        }

        const result = await asyncFn(...args);

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
        if (loadingKey) {
          stopLoading(loadingKey);
        }
      }
    },
    [asyncFn, loadingKey, onSuccess, onError, showToast, successMessage, toast, startLoading, stopLoading]
  );

  return {
    execute,
    error,
    clearError: () => setError(null),
  };
}
