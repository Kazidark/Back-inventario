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
  estado_modem: number;

  @IsOptional()
  @IsInt()
  estado_equipo: number;

  @IsOptional()
  @IsInt()
  id_area: number;

  @IsOptional()
  usuario: number;

  @IsOptional()
  @IsInt()
  id_chip: number;

  @IsOptional()
  @IsDateString()
  fecha_registro?: Date;

  @IsOptional()
  @IsBoolean()
  activo?: boolean | null;
}
