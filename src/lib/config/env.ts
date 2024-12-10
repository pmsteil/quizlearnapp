interface Env {
  LIBSQL_DB_URL: string;
  LIBSQL_DB_AUTH_TOKEN: string;
}

export const env: Env = {
  LIBSQL_DB_URL: import.meta.env.VITE_LIBSQL_DB_URL || '',
  LIBSQL_DB_AUTH_TOKEN: import.meta.env.VITE_LIBSQL_DB_AUTH_TOKEN || '',
};

// Validate required env vars
const requiredEnvVars: (keyof Env)[] = ['LIBSQL_DB_URL', 'LIBSQL_DB_AUTH_TOKEN'];

for (const envVar of requiredEnvVars) {
  if (!env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
  }
}
