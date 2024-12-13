import { developmentConfig } from './env.development';
import { productionConfig } from './env.production';
import { testConfig } from './env.test';

interface Environment {
  apiUrl: string;
  nodeEnv: string;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  logLevel: string;
  tokenRefreshInterval: number;
  maxRetries: number;
  retryDelay: number;
}

function getEnvironment(): Environment {
  const nodeEnv = process.env.NODE_ENV || 'development';

  let envConfig;
  switch (nodeEnv) {
    case 'production':
      envConfig = productionConfig;
      break;
    case 'test':
      envConfig = testConfig;
      break;
    default:
      envConfig = developmentConfig;
  }

  return {
    ...envConfig,
    nodeEnv,
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production',
    isTest: nodeEnv === 'test',
  };
}

export const env = getEnvironment();
