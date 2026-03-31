import {
  IsBoolean,
  IsInt,

  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLaptoDto {
  @IsString()
  @MaxLength(50)
  tipo_equipo: string;

  @IsString()
  @MaxLength(50)
  marca: string;

  @IsString()
  @MaxLength(50)
  modelo: string;

  @IsString()
  @MaxLength(60)
  serie: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  estado_equipo?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  estado_pc?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_area?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  usuario?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ubicacion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  observaciones?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  anexo?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  fecha_registro?: Date;
}
