export class CreateUserDto {
  email: string;
  password: string;
  nickname: string;
  firstName: string;
  lastName?: string;
  avatar?: string;
}
