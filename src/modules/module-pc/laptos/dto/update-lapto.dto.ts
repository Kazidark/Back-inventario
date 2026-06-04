import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/** DTO explícito para PATCH (PartialType de Swagger a veces omite campos con whitelist). */
export class UpdateLaptoDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  tipo_equipo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  marca?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  modelo?: string;

  /** HOST; en edición el front no lo envía (serie es clave). */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  serie?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  estado_equipo?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  estado_pc?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_area?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  usuario?: number | null;

  @IsOptional()
  @IsString()
  ticket?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  ubicacion?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  observaciones?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  anexo?: number | null;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  fecha_registro?: Date;
}
