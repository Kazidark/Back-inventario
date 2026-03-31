import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateModuleTabletDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  marca: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  modelo: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  imei_tablet: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  estado_tablet?: number;

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
  num_chips?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  fecha_registro?: Date;
}
