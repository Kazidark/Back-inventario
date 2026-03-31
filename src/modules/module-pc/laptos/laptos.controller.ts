import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { LaptosService } from './laptos.service';
import { CreateLaptoDto } from './dto/create-lapto.dto';
import { UpdateLaptoDto } from './dto/update-lapto.dto';

@Controller('module-pc')
export class LaptosController {
  constructor(private readonly laptosService: LaptosService) {}

  @Get('GetAllPc')
  findAll() {
    return this.laptosService.findAllPc();
  }

  @Get('GetAllbyId/:id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.laptosService.findPcById(id);
  }

  @Post('create-pc')
  create(@Body() dto: CreateLaptoDto) {
    return this.laptosService.createPc(dto);
  }

  @Patch('pc/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLaptoDto,
  ) {
    return this.laptosService.updatePc(Number(id), dto);
  }
}
