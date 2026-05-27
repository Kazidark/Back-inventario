import { PartialType } from '@nestjs/swagger';
import { CreateSubirArchivoDto } from './create-subir-archivo.dto';

export class UpdateSubirArchivoDto extends PartialType(CreateSubirArchivoDto) {}
