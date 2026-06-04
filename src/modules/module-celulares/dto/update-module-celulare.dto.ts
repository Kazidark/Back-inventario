import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/** DTO explícito para PATCH (PartialType de Swagger a veces no hereda campos nuevos). */
export class UpdateModuleCelulareDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  marca?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  modelo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(25)
  imei_celular?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  estado_celular?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  estado_equipo?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_area?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  usuario?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  numero_chip?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ticket?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  correo_electronico?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  observacion?: string | null;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  fecha_registro?: Date;
}
