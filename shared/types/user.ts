export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  created_at?: number;
  updated_at?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
