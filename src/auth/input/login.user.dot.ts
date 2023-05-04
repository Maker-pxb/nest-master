import { Length } from 'class-validator';

export class LoginUserDto {
  @Length(5)
  username: string;
  @Length(3)
  password: string;
}
