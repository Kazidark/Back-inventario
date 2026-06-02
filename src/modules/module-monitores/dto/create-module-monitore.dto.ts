import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateModuleMonitoreDto {
  @IsString()
  
  @MaxLength(60)
  serie?: string;

  @IsString()
  @MaxLength(50)
  marca?: string;

  @IsString()
  @MaxLength(50)
  modelo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  estado_monitor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status_monitor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_area?: number;

  @IsOptional()

  @IsString()
  ticket?:string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  usuario?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  ubicacion?: number;

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
