import {
  IsBoolean,
  IsInt,
 
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateModuleCelulareDto {
  @IsString()
  
  @MaxLength(50)
  marca: string;

  @IsString()
  @MaxLength(50)
  modelo: string;

  
  @IsString()
  @MaxLength(25)
  imei_celular: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  estado_celular?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  estado_equipo?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_area?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  usuario?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  numero_chip?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ticket?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  observacion?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  fecha_registro?: Date;
}
