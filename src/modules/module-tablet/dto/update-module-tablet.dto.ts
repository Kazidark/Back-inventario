import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/** DTO explícito para PATCH (evita que whitelist omita campos al editar). */
export class UpdateModuleTabletDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  marca?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  modelo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  imei_tablet?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  estado_tablet?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  estado_equipo?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_area?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ticket?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  usuario?: number | null;

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
  num_chips?: number | null;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  fecha_registro?: Date;
}
