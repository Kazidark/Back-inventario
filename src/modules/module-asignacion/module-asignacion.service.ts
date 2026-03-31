import { Injectable } from '@nestjs/common';
import { CreateModuleAsignacionDto } from './dto/create-module-asignacion.dto';
import { UpdateModuleAsignacionDto } from './dto/update-module-asignacion.dto';

@Injectable()
export class ModuleAsignacionService {
  create(createModuleAsignacionDto: CreateModuleAsignacionDto) {
    return 'This action adds a new moduleAsignacion';
  }

  findAll() {
    return `This action returns all moduleAsignacion`;
  }

  findOne(id: number) {
    return `This action returns a #${id} moduleAsignacion`;
  }

  update(id: number, updateModuleAsignacionDto: UpdateModuleAsignacionDto) {
    return `This action updates a #${id} moduleAsignacion`;
  }

  remove(id: number) {
    return `This action removes a #${id} moduleAsignacion`;
  }
}
