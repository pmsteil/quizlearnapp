import { ApiClient } from '../api';
import { TokenManager } from '../utils/token';

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
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export class AuthService extends ApiClient {
  async login(credentials: LoginCredentials) {
    const response = await this.post<TokenResponse>('/auth/login', credentials);
    TokenManager.setTokens(
      response.token,
      response.refreshToken,
      response.expiresIn
    );
    return response;
  }

  async register(data: RegisterData) {
    const response = await this.post<TokenResponse>('/auth/register', data);
    TokenManager.setTokens(
      response.token,
      response.refreshToken,
      response.expiresIn
    );
    return response;
  }

  async refreshToken() {
    const tokenData = TokenManager.getTokenData();
    if (!tokenData?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.post<TokenResponse>('/auth/refresh', {
      refreshToken: tokenData.refreshToken,
    });

    TokenManager.setTokens(
      response.token,
      response.refreshToken,
      response.expiresIn
    );
    return response;
  }

  async logout() {
    const tokenData = TokenManager.getTokenData();
    if (tokenData?.refreshToken) {
      await this.post('/auth/logout', {
        refreshToken: tokenData.refreshToken,
      });
    }
    TokenManager.clearTokens();
  }

  async getMe() {
    return this.get<User>('/auth/me');
  }
}
