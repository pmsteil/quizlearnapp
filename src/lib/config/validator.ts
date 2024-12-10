interface ConfigRequirement {
  name: string;
  description: string;
  required: boolean;
}

interface ConfigValidationError {
  title: string;
  message: string;
  details: string;
}

interface ConfigValidationResult {
  isValid: boolean;
  error?: ConfigValidationError;
}

const CONFIG_REQUIREMENTS: ConfigRequirement[] = [
  {
    name: 'VITE_LIBSQL_DB_URL',
    description: 'Turso/LibSQL database URL (should start with libsql:// or https://)',
    required: true
  },
  {
    name: 'VITE_LIBSQL_DB_AUTH_TOKEN',
    description: 'Turso/LibSQL authentication token',
    required: true
  },
  {
    name: 'VITE_API_URL',
    description: 'API base URL',
    required: false
  }
];

export function validateConfig(): ConfigValidationResult {
  console.log('validateConfig: Starting validation');
  console.log('validateConfig: Current env vars:', {
    LIBSQL_DB_URL: import.meta.env.VITE_LIBSQL_DB_URL ? 'set' : 'not set',
    LIBSQL_DB_AUTH_TOKEN: import.meta.env.VITE_LIBSQL_DB_AUTH_TOKEN ? 'set' : 'not set',
    API_URL: import.meta.env.VITE_API_URL ? 'set' : 'not set'
  });

  const missingVars = CONFIG_REQUIREMENTS.filter(req => {
    const isSet = !!import.meta.env[req.name];
    console.log(`validateConfig: Checking ${req.name}: ${isSet ? 'set' : 'not set'}`);
    return req.required && !isSet;
  });

  if (missingVars.length > 0) {
    console.error('validateConfig: Missing required environment variables:', missingVars);
    console.table(CONFIG_REQUIREMENTS.map(req => ({
      Variable: req.name,
      Description: req.description,
      Required: req.required,
      Set: !!import.meta.env[req.name]
    })));

    return {
      isValid: false,
      error: {
        title: 'Application Configuration Required',
        message: 'The application is not properly configured. Required environment variables are missing.',
        details: missingVars.map(v => v.name).join(', ')
      }
    };
  }

  console.log('validateConfig: All required vars present');
  return { isValid: true };
}
