declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    REACT_APP_API_URL?: string;
    REACT_APP_LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error' | 'silent';
    REACT_APP_TOKEN_REFRESH_INTERVAL?: string;
    REACT_APP_MAX_RETRIES?: string;
    REACT_APP_RETRY_DELAY?: string;
  }
}
