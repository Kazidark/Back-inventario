import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ModuleTabletService } from './module-tablet.service';
import { CreateModuleTabletDto } from './dto/create-module-tablet.dto';
import { UpdateModuleTabletDto } from './dto/update-module-tablet.dto';

@Controller('module-tablet')
export class ModuleTabletController {
  constructor(private readonly moduleTabletService: ModuleTabletService) {}

  @Get('GetAllTablets')
  findAllTablets() {
    return this.moduleTabletService.findAllTablets();
  }

  @Get('GetAllbyId/:id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.moduleTabletService.findTabletById(id);
  }

  @Post('create-tablet')
  create(@Body() dto: CreateModuleTabletDto) {
    return this.moduleTabletService.createTablet(dto);
  }

  @Patch('tablet/:id')
  update(@Param('id') id: string, @Body() dto: UpdateModuleTabletDto) {
    return this.moduleTabletService.updateTablet(Number(id), dto);
  }
}
