import { PartialType } from '@nestjs/swagger';
import { CreateModuleTabletDto } from './create-module-tablet.dto';

export class UpdateModuleTabletDto extends PartialType(CreateModuleTabletDto) {}
