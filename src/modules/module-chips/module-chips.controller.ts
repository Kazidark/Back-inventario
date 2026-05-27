import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ModuleChipsService } from './module-chips.service';
import { CreateModuleChipDto } from './dto/create-module-chip.dto';
import { UpdateModuleChipDto } from './dto/update-module-chip.dto';

@ApiTags('module-chips')
@Controller('module-chips')
export class ModuleChipsController {
  constructor(private readonly moduleChipsService: ModuleChipsService) {}

  @Get()
  findAll() {
    return this.moduleChipsService.findAllChips();
  }

  // Alias para mantener compatibilidad con consumo actual
  @Get('GetAllChips')
  findAllLegacy() {
    return this.moduleChipsService.findAllChips();
  }

  @Get('ChipDisponibles')
  findAllChipsDisponibles() {
    return this.moduleChipsService.AllChipsDisponibles();
  }

  @ApiOperation({ summary: 'Obtener chip por id' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.moduleChipsService.findOneChip(Number(id));
  }

  @Post()
  create(@Body() createModuleChipDto: CreateModuleChipDto) {
    return this.moduleChipsService.createChip(createModuleChipDto);
  }

  @ApiOperation({ summary: 'Crear chip' })
  @Post('createChip')
  createChip(@Body() createModuleChipDto: CreateModuleChipDto) {
    return this.moduleChipsService.createChip(createModuleChipDto);
  }

  @ApiOperation({ summary: 'Actualizar chip' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @Patch('chip/:id')
  updateChip(
    @Param('id') id: string,
    @Body() updateModuleChipDto: UpdateModuleChipDto,
  ) {
    return this.moduleChipsService.updateChip(Number(id), updateModuleChipDto);
  }
}
