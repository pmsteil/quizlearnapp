export const productionConfig = {
  apiUrl: import.meta.env.VITE_API_URL,
  logLevel: 'error',
  tokenRefreshInterval: 15 * 60 * 1000, // 15 minutes
  maxRetries: 2,
  retryDelay: 2000,
};
