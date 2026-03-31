import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class registesUsers {
  @IsNumber()
  @IsNotEmpty()
  idUser: number;

  @IsString()
  nameUser: string;

  @IsString()
  passwordUser: string;

  @IsEmail()
  emailUser: string;

  @IsString()
  roleUser: string;

  @IsBoolean()
  activoUser: boolean;

  @IsDate()
  fechaCreacionUser: Date;
}
