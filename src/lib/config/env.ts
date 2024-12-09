console.log('Loading environment variables...');
console.log('Environment:', {
  API_URL: import.meta.env.VITE_API_URL,
  DATABASE_URL: import.meta.env.VITE_DATABASE_URL,
  DATABASE_TOKEN: import.meta.env.VITE_DATABASE_TOKEN ? '[REDACTED]' : undefined,
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD,
});

export const ENV = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  DATABASE_URL: import.meta.env.VITE_DATABASE_URL || 'file:local.db',
  DATABASE_AUTH_TOKEN: import.meta.env.VITE_DATABASE_TOKEN,
  ENVIRONMENT: import.meta.env.MODE,
  IS_PRODUCTION: import.meta.env.PROD,
} as const;

// Validate required environment variables in production
const requiredEnvVars = ['DATABASE_URL', 'DATABASE_AUTH_TOKEN'];

if (ENV.IS_PRODUCTION) {
  requiredEnvVars.forEach(envVar => {
    if (!import.meta.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  });
}
