import { ApiClient } from '../client';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '../auth';

export class AuthService {
  constructor(private client: ApiClient) {}

  async login(request: LoginRequest): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>('/auth/login', request);
    this.client.setAuthToken(response.token);
    return response;
  }

  async register(request: RegisterRequest): Promise<RegisterResponse> {
    const response = await this.client.post<RegisterResponse>('/auth/register', request);
    this.client.setAuthToken(response.token);
    return response;
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout');
    this.client.clearAuthToken();
  }

  async refreshToken(): Promise<string> {
    const response = await this.client.post<{ token: string }>('/auth/refresh');
    this.client.setAuthToken(response.token);
    return response.token;
  }
}
