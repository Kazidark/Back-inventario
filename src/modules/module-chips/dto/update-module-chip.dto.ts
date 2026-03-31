import { PartialType } from '@nestjs/mapped-types';
import { CreateModuleChipDto } from './create-module-chip.dto';

export class UpdateModuleChipDto extends PartialType(CreateModuleChipDto) {}
