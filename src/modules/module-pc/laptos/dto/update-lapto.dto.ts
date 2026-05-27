import { PartialType } from '@nestjs/swagger';
import { CreateLaptoDto } from './create-lapto.dto';

export class UpdateLaptoDto extends PartialType(CreateLaptoDto) {}
