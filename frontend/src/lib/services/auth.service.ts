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
  user_id: string;
  email: string;
  name: string;
  roles: string[];
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
    // Convert credentials to URLSearchParams for OAuth2 compatibility
    const formData = new URLSearchParams();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);

    try {
      console.log('Attempting login with:', { email: credentials.email });
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
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
    const response = await this.post<TokenResponse>('/auth/register', {
      username: data.email,  // Backend expects username
      password: data.password,
      name: data.name,
    });
    TokenManager.setTokenData(response);
    return response;
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
