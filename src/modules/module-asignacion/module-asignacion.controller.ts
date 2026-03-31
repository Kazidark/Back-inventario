import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ModuleAsignacionService } from './module-asignacion.service';
import { CreateModuleAsignacionDto } from './dto/create-module-asignacion.dto';
import { UpdateModuleAsignacionDto } from './dto/update-module-asignacion.dto';

@Controller('module-asignacion')
export class ModuleAsignacionController {
  constructor(
    private readonly moduleAsignacionService: ModuleAsignacionService,
  ) {}

  @Post()
  create(@Body() createModuleAsignacionDto: CreateModuleAsignacionDto) {
    return this.moduleAsignacionService.create(createModuleAsignacionDto);
  }

  @Get()
  findAll() {
    return this.moduleAsignacionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.moduleAsignacionService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateModuleAsignacionDto: UpdateModuleAsignacionDto,
  ) {
    return this.moduleAsignacionService.update(+id, updateModuleAsignacionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.moduleAsignacionService.remove(+id);
  }
}
