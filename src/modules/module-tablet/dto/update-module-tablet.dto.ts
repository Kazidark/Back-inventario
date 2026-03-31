import { PartialType } from '@nestjs/mapped-types';
import { CreateModuleTabletDto } from './create-module-tablet.dto';

export class UpdateModuleTabletDto extends PartialType(CreateModuleTabletDto) {}
