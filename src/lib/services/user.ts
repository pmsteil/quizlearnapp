import { UserModel } from '../db/models/user';
import type { User } from '../types/database';

export class UserService {
  static async login(email: string, password: string): Promise<User> {
    return UserModel.authenticate(email, password);
  }

  static async signup(email: string, password: string, name: string): Promise<User> {
    return UserModel.create(email, password, name);
  }
}
