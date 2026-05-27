import { PartialType } from '@nestjs/swagger';
import { CreateModuleAsignacionDto } from './create-module-asignacion.dto';

export class UpdateModuleAsignacionDto extends PartialType(
  CreateModuleAsignacionDto,
) {}
