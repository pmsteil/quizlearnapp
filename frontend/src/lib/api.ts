import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { AppError } from './error';
import { TokenManager } from './utils/token';

// Types
export interface ApiConfig {
  baseURL: string;
  headers?: Record<string, string>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Base API client
export class ApiClient {
  protected baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  protected async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const tokenData = TokenManager.getTokenData();
    const headers = {
      'Content-Type': 'application/json',
      ...(tokenData?.access_token ? { Authorization: `Bearer ${tokenData.access_token}` } : {}),
      ...options.headers,
    };

    // Log request details
    console.log('API Request:', {
      url: `${this.baseUrl}${path}`,
      method: options.method || 'GET',
      hasAuth: !!tokenData?.access_token,
      body: options.body ? JSON.parse(options.body as string) : undefined
    });

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        console.error('API Error:', error);
        throw new AppError(error.detail || 'An unexpected error occurred', response.status);
      } else {
        const text = await response.text();
        console.error('API Error (non-JSON):', text);
        throw new AppError('An unexpected error occurred', response.status);
      }
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('API Response:', data);
      return data;
    }
    
    throw new AppError('Invalid response format', 500);
  }

  protected async get<T>(path: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  protected async post<T>(path: string, data: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  protected async put<T>(path: string, data: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  protected async delete<T>(path: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}
