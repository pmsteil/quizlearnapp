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

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        throw new AppError(error.detail.message, response.status, error.detail.error_code);
      } else {
        throw new AppError('An unexpected error occurred', response.status, 'UNKNOWN_ERROR');
      }
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    throw new AppError('Invalid response format', 500, 'INVALID_RESPONSE_FORMAT');
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
