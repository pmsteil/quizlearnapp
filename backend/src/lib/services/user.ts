import { UserModel } from '../db/models/user';
import { User } from '@/types/user';

export class UserService {
  static async login(email: string, password: string): Promise<User | null> {
    return UserModel.authenticate(email, password);
  }

  static async signup(email: string, password: string, name: string): Promise<User> {
    return UserModel.create(email, password, name);
  }
}
