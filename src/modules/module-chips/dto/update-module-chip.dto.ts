import { PartialType } from '@nestjs/swagger';
import { CreateModuleChipDto } from './create-module-chip.dto';

export class UpdateModuleChipDto extends PartialType(CreateModuleChipDto) {}
