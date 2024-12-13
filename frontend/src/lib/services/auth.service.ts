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
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly USER_KEY = 'auth_user';

  private constructor() {
    super('http://localhost:3000/api/v1');
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private saveToStorage(token: string, user: User) {
    localStorage.setItem(AuthService.TOKEN_KEY, token);
    localStorage.setItem(AuthService.USER_KEY, JSON.stringify(user));
  }

  private clearStorage() {
    localStorage.removeItem(AuthService.TOKEN_KEY);
    localStorage.removeItem(AuthService.USER_KEY);
  }

  public getStoredAuth(): { token: string; user: User } | null {
    const token = localStorage.getItem(AuthService.TOKEN_KEY);
    const userStr = localStorage.getItem(AuthService.USER_KEY);
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        return { token, user };
      } catch (e) {
        this.clearStorage();
      }
    }
    return null;
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
        if (error.detail?.message) {
          throw new AppError(error.detail.message, response.status, error.detail.error_code);
        }
        throw new AppError('Login failed', response.status, 'LOGIN_FAILED');
      }

      const data = await response.json();
      console.log('Login successful, setting tokens');
      this.saveToStorage(data.access_token, data.user);
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
    this.saveToStorage(response.access_token, response.user);
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
    this.saveToStorage(data.access_token, data.user);
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
    this.clearStorage();
    TokenManager.clearTokens();
  }

  async getCurrentUser(): Promise<User> {
    return this.get('/auth/me');
  }
}

export const authService = AuthService.getInstance();
