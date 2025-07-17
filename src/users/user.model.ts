import { Role } from './role.enum';

export class User {
  constructor(
    public id: string,
    public email: string,
    public role: Role,
    public firstName: string,
    public lastName: string
  ) {}

  static fromPrisma(data: any): User {
    return new User(data.id, data.email, data.role, data.firstName, data.lastName);
  }
}
