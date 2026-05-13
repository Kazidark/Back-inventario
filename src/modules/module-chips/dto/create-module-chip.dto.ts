import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateModuleChipDto {
  @IsString()
 
  @MaxLength(9)
  numero_chip: string;

  @IsString()
  
  @MaxLength(25)
  iccid: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tipo_chip?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  operador: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  estado_chip: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  area?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  usuario?: number;

  @IsString()
  @MaxLength(255)
  ticket: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  observacion: string;

  @IsString()
  @MaxLength(255)
  correo_electronico: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
