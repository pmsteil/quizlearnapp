import * as dotenv from 'dotenv';

// Load .env file in Node.js environment
if (typeof process !== 'undefined') {
  dotenv.config();
}

interface Env {
  LIBSQL_DB_URL: string;
  LIBSQL_DB_AUTH_TOKEN: string;
  IS_PRODUCTION: boolean;
}

// Get environment variables from either Vite or Node.js process
export const env: Env = {
  LIBSQL_DB_URL:
    typeof process !== 'undefined'
      ? process.env.VITE_LIBSQL_DB_URL || ''
      : import.meta.env.VITE_LIBSQL_DB_URL || '',

  LIBSQL_DB_AUTH_TOKEN:
    typeof process !== 'undefined'
      ? process.env.VITE_LIBSQL_DB_AUTH_TOKEN || ''
      : import.meta.env.VITE_LIBSQL_DB_AUTH_TOKEN || '',

  IS_PRODUCTION:
    typeof process !== 'undefined'
      ? process.env.NODE_ENV === 'production'
      : import.meta.env.PROD
};

// Validate required env vars
const requiredEnvVars: (keyof Env)[] = ['LIBSQL_DB_URL', 'LIBSQL_DB_AUTH_TOKEN'];

for (const envVar of requiredEnvVars) {
  if (!env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
  }
}
