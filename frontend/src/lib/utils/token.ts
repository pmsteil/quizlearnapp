interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user?: any;
}

export class TokenManager {
  private static TOKEN_KEY = 'auth_token_data';

  static setTokenData(data: TokenData) {
    console.log('Setting token data:', { ...data, access_token: '[REDACTED]' });
    localStorage.setItem(this.TOKEN_KEY, JSON.stringify(data));
  }

  static setTokens(accessToken: string, refreshToken: string | null, user: any) {
    console.log('Setting tokens:', { accessToken: '[REDACTED]', refreshToken: refreshToken ? '[REDACTED]' : null });
    this.setTokenData({
      access_token: accessToken,
      refresh_token: refreshToken || undefined,
      user
    });
  }

  static getTokenData(): TokenData | null {
    const data = localStorage.getItem(this.TOKEN_KEY);
    if (!data) {
      console.log('No token data found in storage');
      return null;
    }
    try {
      const parsed = JSON.parse(data);
      console.log('Got token data:', { 
        ...parsed, 
        access_token: parsed.access_token ? '[REDACTED]' : undefined,
        refresh_token: parsed.refresh_token ? '[REDACTED]' : undefined 
      });
      return parsed;
    } catch (e) {
      console.error('Error parsing token data:', e);
      localStorage.removeItem(this.TOKEN_KEY);
      return null;
    }
  }

  static getAccessToken(): string | null {
    const data = this.getTokenData();
    const token = data?.access_token || null;
    console.log('Getting access token:', token ? '[REDACTED]' : null);
    return token;
  }

  static getRefreshToken(): string | null {
    const data = this.getTokenData();
    const token = data?.refresh_token || null;
    console.log('Getting refresh token:', token ? '[REDACTED]' : null);
    return token;
  }

  static clearTokens() {
    console.log('Clearing tokens');
    localStorage.removeItem(this.TOKEN_KEY);
  }

  static isTokenExpired(): boolean {
    const data = this.getTokenData();
    if (!data?.access_token) {
      console.log('No token found');
      return true;
    }
    
    try {
      // Check if token is expired by decoding it
      const base64Url = data.access_token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const payload = JSON.parse(jsonPayload);
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const isExpired = currentTime >= expirationTime;
      
      console.log('Token expiration check:', {
        expirationTime: new Date(expirationTime).toISOString(),
        currentTime: new Date(currentTime).toISOString(),
        isExpired
      });
      
      return isExpired;
    } catch (e) {
      console.error('Error checking token expiration:', e);
      return true;
    }
  }
}
