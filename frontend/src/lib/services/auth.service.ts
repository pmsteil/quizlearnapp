import { api } from '../api';
import { TokenManager } from '../utils/token';
import { AppError } from '../error';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  name: string;
}

interface User {
  id: number;
  email: string;
  name: string;
  roles: string[];
}

interface LoginResponse {
  token: string;
  user: User;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: User;
}

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: User;
}

export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginCredentials) {
    try {
      console.log('Attempting login with:', { email: credentials.email });
      const response = await api.post<TokenResponse>('/auth/login', {
        email: credentials.email,
        password: credentials.password
      });
      console.log('Login response:', {
        ...response,
        access_token: '[REDACTED]',
        refresh_token: '[REDACTED]'
      });
      
      try {
        TokenManager.setTokenData(response);
        console.log('Token data set successfully');
        return response;
      } catch (tokenError) {
        console.error('Error setting token data:', tokenError);
        throw new AppError('TOKEN_ERROR', 'Failed to store authentication token');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('AUTH_ERROR', 'Failed to login. Please check your credentials.');
    }
  }

  async register(data: RegisterData): Promise<TokenResponse> {
    const requestData = {
      email: data.email,
      password: data.password,
      name: data.name,
    };
    console.log('Sending registration request:', {
      url: '/auth/register',
      data: { ...requestData, password: '***' },
    });

    const response = await api.post<TokenResponse>('/auth/register', requestData);

    if (!response.ok) {
      let errorMessage = 'Registration failed';
      let errorCode = 'REGISTRATION_FAILED';
      try {
        const error = await response.json();

        // sample error.detail:
        // {
        //   "error_code": "400",
        //   "message": {
        //       "error_code": "USER_EXISTS",
        //       "message": "User already exists"
        //   }
        // }

        if (error.detail?.message?.message) {
          errorMessage = error.detail.message.message;
          errorCode = error.detail.message.error_code;
        }

        if (error.detail?.message?.error_code === 'USER_EXISTS') {
          errorMessage = 'This email is already registered. Please use a different email address or try logging in.';
          errorCode = 'USER_EXISTS';
        } else {
          errorMessage = error.detail?.message || error.detail || errorMessage;
          errorCode = error.detail?.error_code || errorCode;
        }
      } catch (e) {
        console.error('Failed to parse error response:', e);
        console.error('Response status:', response.status);
        console.error('Response text:', await response.text());
      }
      throw new AppError(errorMessage, response.status, errorCode);
    }

    try {
      const tokenData = await response.json();
      if (!tokenData) {
        throw new Error('Empty response from server');
      }
      console.log('Registration successful:', { ...tokenData, access_token: '***', refresh_token: '***' });
      TokenManager.setTokenData(tokenData);
      return tokenData;
    } catch (e) {
      console.error('Failed to parse response:', e);
      throw new AppError('Invalid response from server', 500);
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      console.log('Attempting to refresh token');
      const response = await api.post<TokenResponse>('/auth/refresh', { refresh_token: refreshToken }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Token refresh error:', error);
        console.error('Token refresh error status:', response.status);
        console.error('Token refresh error detail:', error.detail);
        throw new AppError('Token refresh failed', response.status, 'TOKEN_REFRESH_FAILED');
      }

      const data = await response.json();
      console.log('Token refresh successful');
      TokenManager.setTokenData(data);
      return data;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      console.log('Getting current user');
      const response = await api.get<User>('/auth/me');
      console.log('Got current user:', response);
      return response;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (refreshToken) {
        await api.post('/auth/logout', { refresh_token: refreshToken }, {
          headers: {
            'Content-Type': 'application/json',
          },
        }).catch(() => {
          // Ignore logout API errors since we want to clear tokens anyway
          console.log('Ignoring logout API error');
        });
      }
    } finally {
      TokenManager.clearTokens();
    }
  }
}

export const authService = AuthService.getInstance();
