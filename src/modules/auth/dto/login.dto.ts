import { IsEmail, IsStrongPassword } from 'class-validator';

export class loginDto {
  @IsEmail()
  email: string;

  @IsStrongPassword()
  password: string;
}
