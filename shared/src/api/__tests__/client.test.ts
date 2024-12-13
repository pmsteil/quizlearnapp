import { ApiClient, ApiError } from '../client';

describe('ApiClient', () => {
  let client: ApiClient;
  const mockBaseUrl = 'http://api.example.com';

  beforeEach(() => {
    client = new ApiClient({ baseUrl: mockBaseUrl });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('constructor', () => {
    it('should remove trailing slash from baseUrl', () => {
      const clientWithSlash = new ApiClient({ baseUrl: 'http://api.example.com/' });
      expect((clientWithSlash as any).baseUrl).toBe('http://api.example.com');
    });

    it('should set default headers', () => {
      expect((client as any).headers['Content-Type']).toBe('application/json');
    });
  });

  describe('authentication', () => {
    it('should set auth token', () => {
      client.setAuthToken('test-token');
      expect((client as any).headers['Authorization']).toBe('Bearer test-token');
    });

    it('should clear auth token', () => {
      client.setAuthToken('test-token');
      client.clearAuthToken();
      expect((client as any).headers['Authorization']).toBeUndefined();
    });
  });

  describe('request methods', () => {
    const mockResponse = { data: 'test' };
    const mockJsonPromise = Promise.resolve(mockResponse);
    const mockFetchPromise = Promise.resolve({
      ok: true,
      json: () => mockJsonPromise,
    } as Response);

    beforeEach(() => {
      (global.fetch as jest.Mock).mockImplementation(() => mockFetchPromise);
    });

    it('should make GET request', async () => {
      const result = await client.get('/test');
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://api.example.com/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.any(Object),
          credentials: 'include',
        })
      );
    });

    it('should make POST request with body', async () => {
      const body = { test: 'data' };
      const result = await client.post('/test', body);
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://api.example.com/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
          headers: expect.any(Object),
          credentials: 'include',
        })
      );
    });

    it('should handle error responses', async () => {
      const errorResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Resource not found' }),
      } as Response;

      (global.fetch as jest.Mock).mockImplementation(() => Promise.resolve(errorResponse));

      await expect(client.get('/test')).rejects.toThrow(ApiError);
    });
  });
});
