import { PartialType } from '@nestjs/swagger';
import { CreateModuleCelulareDto } from './create-module-celulare.dto';

export class UpdateModuleCelulareDto extends PartialType(
  CreateModuleCelulareDto,
) {}
