import { PartialType } from '@nestjs/mapped-types';
import { CreateModuleModemDto } from './create-module-modem.dto';

export class UpdateModuleModemDto extends PartialType(CreateModuleModemDto) {}
