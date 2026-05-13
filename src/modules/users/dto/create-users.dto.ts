import { IsEmail, IsIn, IsNotEmpty, IsString, MinLength } from 'class-validator';

/** Coincide con el body que envía `UsuarioForm.jsx` (usuario, email, password, rol). */
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  usuario: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['Administrador', 'Usuario'], {
    message: 'El rol debe ser Administrador o Usuario',
  })
  rol: string;
}
