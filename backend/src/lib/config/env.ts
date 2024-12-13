// We'll repurpose this file for API configuration later
export interface ApiConfig {
  baseUrl: string;
}

export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000'
};
