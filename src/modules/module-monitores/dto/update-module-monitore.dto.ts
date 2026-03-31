import { PartialType } from '@nestjs/mapped-types';
import { CreateModuleMonitoreDto } from './create-module-monitore.dto';

export class UpdateModuleMonitoreDto extends PartialType(
  CreateModuleMonitoreDto,
) {}
