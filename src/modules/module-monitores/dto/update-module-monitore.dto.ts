import { PartialType } from '@nestjs/swagger';
import { CreateModuleMonitoreDto } from './create-module-monitore.dto';

export class UpdateModuleMonitoreDto extends PartialType(
  CreateModuleMonitoreDto,
) {}
