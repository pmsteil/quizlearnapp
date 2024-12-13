interface TokenData {
  token: string;
  refreshToken?: string;
  expiresAt: number;
}

export class TokenManager {
  private static TOKEN_KEY = 'auth_token';
  private static REFRESH_TOKEN_KEY = 'refresh_token';
  private static EXPIRES_AT_KEY = 'token_expires_at';

  static setTokens(token: string, refreshToken?: string, expiresIn?: number) {
    const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : undefined;

    localStorage.setItem(this.TOKEN_KEY, token);
    if (refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
    if (expiresAt) {
      localStorage.setItem(this.EXPIRES_AT_KEY, expiresAt.toString());
    }
  }

  static getTokenData(): TokenData | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    const expiresAt = Number(localStorage.getItem(this.EXPIRES_AT_KEY));

    if (!token) return null;

    return {
      token,
      refreshToken: refreshToken || undefined,
      expiresAt: expiresAt || 0,
    };
  }

  static clearTokens() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.EXPIRES_AT_KEY);
  }

  static isTokenExpired(): boolean {
    const expiresAt = Number(localStorage.getItem(this.EXPIRES_AT_KEY));
    if (!expiresAt) return false;

    // Add 10-second buffer
    return Date.now() > expiresAt - 10000;
  }
}
