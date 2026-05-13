import { PartialType } from '@nestjs/mapped-types';
import { CreateSubirArchivoDto } from './create-subir-archivo.dto';

export class UpdateSubirArchivoDto extends PartialType(CreateSubirArchivoDto) {}
