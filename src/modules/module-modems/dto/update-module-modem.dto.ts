import { PartialType } from '@nestjs/swagger';
import { CreateModuleModemDto } from './create-module-modem.dto';

export class UpdateModuleModemDto extends PartialType(CreateModuleModemDto) {}
