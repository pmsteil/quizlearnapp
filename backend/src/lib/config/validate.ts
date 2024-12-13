export class ConfigurationError extends Error {
  constructor(
    public title: string,
    message: string,
    public details?: string[]
  ) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export function validateConfig() {
  console.log('=== Validating Configuration ===');
  const missingVars: string[] = [];

  const requiredVars = [
    'VITE_LIBSQL_DB_URL',
    'VITE_LIBSQL_DB_AUTH_TOKEN'
  ];

  for (const varName of requiredVars) {
    console.log(`Checking ${varName}:`, !!import.meta.env[varName]);
    if (!import.meta.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    throw new ConfigurationError(
      'Application Configuration Required',
      'The application is not properly configured. Required environment variables are missing.',
      missingVars
    );
  }

  console.log('Configuration validation successful');
}
