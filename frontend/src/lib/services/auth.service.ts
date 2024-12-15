import { ApiClient } from '../api';
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

export class AuthService extends ApiClient {
  private static instance: AuthService;

  private constructor() {
    super('http://localhost:3000/api/v1');
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginCredentials) {
    try {
      console.log('Attempting login with:', { email: credentials.email });
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Login error response:', error);
        console.error('Login error status:', response.status);
        console.error('Login error detail:', error.detail);

        // Handle the error based on the actual structure
        if (error.detail?.error_code) {
          throw new AppError(
            error.detail.message || 'Login failed',
            response.status,
            error.detail.error_code
          );
        } else if (typeof error.detail === 'string') {
          throw new AppError(error.detail, response.status, 'LOGIN_FAILED');
        }
        throw new AppError('Login failed', response.status, 'LOGIN_FAILED');
      }

      const data = await response.json();
      console.log('Login successful, setting tokens');
      TokenManager.setTokenData(data);
      return data;
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Login failed', 500, 'LOGIN_FAILED');
    }
  }

  async register(data: RegisterData): Promise<TokenResponse> {
    const requestData = {
      email: data.email,
      password: data.password,
      name: data.name,
    };
    console.log('Sending registration request:', {
      url: `${this.baseUrl}/auth/register`,
      data: { ...requestData, password: '***' },
    });

    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

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
      const formData = new URLSearchParams();
      formData.append('refresh_token', refreshToken);

      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
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
      const response = await this.request<User>('/auth/me', {
        method: 'GET',
      });
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
        await this.post('/auth/logout', { refresh_token: refreshToken }, {
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
