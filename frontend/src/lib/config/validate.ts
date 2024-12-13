export class ConfigurationError extends Error {
  constructor(message: string, public details?: string[]) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export function validateConfig() {
  const requiredEnvVars = ['VITE_API_URL'];
  const missingVars = requiredEnvVars.filter(
    (varName) => !import.meta.env[varName]
  );

  if (missingVars.length > 0) {
    throw new ConfigurationError(
      'Missing required environment variables',
      missingVars
    );
  }

  return true;
}
