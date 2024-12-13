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
  id: string;
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
    formData.append('grant_type', 'password');
    formData.append('username', credentials.email);  // OAuth2 uses username field
    formData.append('password', credentials.password);
    formData.append('scope', '');  // Required by OAuth2 spec

    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: formData,
        mode: 'cors',
        credentials: 'include',
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          console.error('Login error response:', error);
          throw new AppError(
            error.detail.message || 'Login failed',
            response.status,
            error.detail.error_code || 'LOGIN_FAILED'
          );
        } else {
          const text = await response.text();
          console.error('Login error text:', text);
          throw new AppError('Login failed', response.status, 'LOGIN_FAILED');
        }
      }

      const data = await response.json();
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
    TokenManager.setTokens(
      response.access_token,
      response.refresh_token,
      response.expires_in
    );
    return response;
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const formData = new URLSearchParams();
    formData.append('refresh_token', refreshToken);
    formData.append('grant_type', 'refresh_token');

    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      throw new AppError('Failed to refresh token', response.status, 'REFRESH_TOKEN_FAILED');
    }

    const data: TokenResponse = await response.json();
    TokenManager.setTokens(
      data.access_token,
      data.refresh_token,
      data.expires_in
    );
    return data;
  }

  async logout() {
    const refreshToken = TokenManager.getRefreshToken();
    if (refreshToken) {
      await this.post('/auth/logout', { refresh_token: refreshToken });
    }
    TokenManager.clearTokens();
  }

  async getCurrentUser(): Promise<User> {
    return this.get('/auth/me');
  }
}

export const authService = AuthService.getInstance();
