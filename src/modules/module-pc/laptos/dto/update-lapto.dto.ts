import { PartialType } from '@nestjs/mapped-types';
import { CreateLaptoDto } from './create-lapto.dto';

export class UpdateLaptoDto extends PartialType(CreateLaptoDto) {}
