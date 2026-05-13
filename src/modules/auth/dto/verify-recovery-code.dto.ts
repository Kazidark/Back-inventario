import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class VerifyRecoveryCodeDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /** Código de 6 dígitos enviado por correo */
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: 'El código debe ser de 6 dígitos' })
  code: string;
}
