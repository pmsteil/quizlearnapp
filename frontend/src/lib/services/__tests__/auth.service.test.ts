import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../auth.service';
import { TokenManager } from '../../utils/token';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock TokenManager
vi.mock('../../utils/token', () => ({
  TokenManager: {
    setTokenData: vi.fn(),
  },
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = AuthService.getInstance();
    vi.clearAllMocks();
  });

  describe('register', () => {
    const testUser = {
      email: 'test@example.com',
      password: 'testpassword',
      name: 'Test User',
    };

    it('should successfully register a new user', async () => {
      const mockResponse = {
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        token_type: 'bearer',
        expires_in: 3600,
        user: {
          user_id: '123',
          email: testUser.email,
          name: testUser.name,
          roles: ['role_user'],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await authService.register(testUser);

      // Check fetch was called correctly
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: testUser.email,
            password: testUser.password,
            name: testUser.name,
          }),
        }
      );

      // Check response handling
      expect(result).toEqual(mockResponse);
      expect(TokenManager.setTokenData).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle registration error with error message', async () => {
      const errorResponse = {
        detail: {
          error_code: 'USER_EXISTS',
          message: 'User already exists',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve(errorResponse),
      });

      await expect(authService.register(testUser)).rejects.toThrow('User already exists');
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(authService.register(testUser)).rejects.toThrow();
    });

    it('should handle invalid JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(authService.register(testUser)).rejects.toThrow('Invalid response from server');
    });

    it('should handle empty response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(null),
      });

      await expect(authService.register(testUser)).rejects.toThrow('Empty response from server');
    });
  });
});
