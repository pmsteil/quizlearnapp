import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { AppError } from './utils/error';
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
  protected baseURL: string;
  protected headers: Record<string, string>;

  constructor(config: ApiConfig) {
    this.baseURL = config.baseURL;
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  protected async get<T = any>(path: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${path}`, {
      headers: this.headers,
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  }

  protected async post<T = any>(path: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  }

  protected async put<T = any>(path: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  }

  protected async delete<T = any>(path: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'DELETE',
      headers: this.headers,
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  }
}
