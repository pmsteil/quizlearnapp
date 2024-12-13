export const developmentConfig = {
  apiUrl: 'http://localhost:3000/api/v1',
  logLevel: 'debug',
  tokenRefreshInterval: 5 * 60 * 1000, // 5 minutes
  maxRetries: 3,
  retryDelay: 1000,
};
