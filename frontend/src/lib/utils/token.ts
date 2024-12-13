interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: any;
}

export class TokenManager {
  private static TOKEN_KEY = 'auth_token_data';

  static setTokenData(data: TokenData) {
    localStorage.setItem(this.TOKEN_KEY, JSON.stringify(data));
  }

  static getTokenData(): TokenData | null {
    const data = localStorage.getItem(this.TOKEN_KEY);
    return data ? JSON.parse(data) : null;
  }

  static getAccessToken(): string | null {
    const data = this.getTokenData();
    return data ? data.access_token : null;
  }

  static clearTokens() {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  static isTokenExpired(): boolean {
    const data = this.getTokenData();
    if (!data || !data.expires_in) return true;
    
    const expirationTime = new Date(data.expires_in * 1000);
    return new Date() > expirationTime;
  }
}
