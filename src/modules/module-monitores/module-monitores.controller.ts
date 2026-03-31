import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ModuleMonitoresService } from './module-monitores.service';
import { CreateModuleMonitoreDto } from './dto/create-module-monitore.dto';
import { UpdateModuleMonitoreDto } from './dto/update-module-monitore.dto';

@Controller('module-monitores')
export class ModuleMonitoresController {
  constructor(
    private readonly moduleMonitoresService: ModuleMonitoresService,
  ) {}

  @Get('GetAllMonitores')
  findAllMonitores() {
    return this.moduleMonitoresService.findAllMonitores();
  }

  @Get('GetAllbyId/:id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.moduleMonitoresService.findMonitorById(id);
  }

  @Post('create-monitor')
  create(@Body() dto: CreateModuleMonitoreDto) {
    return this.moduleMonitoresService.createMonitor(dto);
  }

  @Patch('monitor/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateModuleMonitoreDto,
  ) {
    return this.moduleMonitoresService.updateMonitor(Number(id), dto);
  }
}
