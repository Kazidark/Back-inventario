import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateModuleModemDto {
  @IsOptional()
  @IsString()
  marca?: string | null;

  @IsOptional()
  @IsString()
  modelo?: string | null;

  @IsOptional()
  @IsString()
  imei_modem?: string | null;

  @IsOptional()
  @IsInt()
  estado_modem?: number | null;

  @IsOptional()
  @IsInt()
  estado_equipo?: number | null;

  @IsOptional()
  @IsInt()
  id_area?: number | null;

  @IsOptional()
  @IsInt()
  usuario?: number | null;

  @IsOptional()
  @IsInt()
  id_chip?: number | null;

  @IsOptional()
  @IsDateString()
  fecha_registro?: Date;

  @IsOptional()
  @IsBoolean()
  activo?: boolean | null;
}
