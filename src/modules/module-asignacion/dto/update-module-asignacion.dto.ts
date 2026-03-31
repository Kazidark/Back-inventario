import { PartialType } from '@nestjs/mapped-types';
import { CreateModuleAsignacionDto } from './create-module-asignacion.dto';

export class UpdateModuleAsignacionDto extends PartialType(
  CreateModuleAsignacionDto,
) {}
