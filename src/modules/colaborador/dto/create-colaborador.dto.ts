import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateColaboradorDto {
  @IsString()
  @IsNotEmpty()
  nombre_completo: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  documento?: string;

  @IsNumber()
  activo: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fecha_creacion?: Date;
}
