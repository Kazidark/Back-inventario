import { PartialType } from '@nestjs/mapped-types';
import { CreateModuleCelulareDto } from './create-module-celulare.dto';

export class UpdateModuleCelulareDto extends PartialType(
  CreateModuleCelulareDto,
) {}
