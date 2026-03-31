import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ModuleCelularesService } from './module-celulares.service';
import { CreateModuleCelulareDto } from './dto/create-module-celulare.dto';
import { UpdateModuleCelulareDto } from './dto/update-module-celulare.dto';

@Controller('module-celulares')
export class ModuleCelularesController {
  constructor(
    private readonly moduleCelularesService: ModuleCelularesService,
  ) {}

  @Get('GetAllCelulares')
  findAll() {
    return this.moduleCelularesService.findAllCelulares();
  }

  @Get('GetAllbyId/:id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.moduleCelularesService.findCelularById(id);
  }

  @Post('create-celular')
  create(@Body() dto: CreateModuleCelulareDto) {
    return this.moduleCelularesService.createCelular(dto);
  }

  @Patch('celular/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateModuleCelulareDto,
  ) {
    return this.moduleCelularesService.updateCelular(Number(id), dto);
  }
}
