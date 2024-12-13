function validateEnv() {
  const requiredVars = {
    NODE_ENV: process.env.NODE_ENV,
    ...(process.env.NODE_ENV === 'production' ? {
      REACT_APP_API_URL: process.env.REACT_APP_API_URL,
    } : {}),
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }

  // Validate NODE_ENV value
  if (!['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
    throw new Error(
      `Invalid NODE_ENV value: ${process.env.NODE_ENV}. Must be one of: development, production, test`
    );
  }
}

export default validateEnv;
