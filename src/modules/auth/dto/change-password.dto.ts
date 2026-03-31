import { IsEmail, IsStrongPassword } from 'class-validator';

export class ChangePasswordDto {
  @IsEmail()
  email: string;

  @IsStrongPassword()
  newPassword: string;
}
