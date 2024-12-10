import { User } from '@/types/user';

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hashedPassword;
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): boolean {
  return password.length >= 6;
}

export const hasRole = (user: User | null, requiredRole: string): boolean => {
  if (!user || !user.roles) return false;
  return user.roles.includes(requiredRole);
};

export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, 'role_admin');
};
