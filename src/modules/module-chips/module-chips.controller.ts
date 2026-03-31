import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ModuleChipsService } from './module-chips.service';
import { CreateModuleChipDto } from './dto/create-module-chip.dto';
import { UpdateModuleChipDto } from './dto/update-module-chip.dto';

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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.moduleChipsService.findOneChip(Number(id));
  }

  @Post()
  create(@Body() createModuleChipDto: CreateModuleChipDto) {
    return this.moduleChipsService.createChip(createModuleChipDto);
  }

  @Post('createChip')
  createChip(@Body() createModuleChipDto: CreateModuleChipDto) {
    return this.moduleChipsService.createChip(createModuleChipDto);
  }

  @Patch('chip/:id')
  updateChip(
    @Param('id') id: string,
    @Body() updateModuleChipDto: UpdateModuleChipDto,
  ) {
    return this.moduleChipsService.updateChip(Number(id), updateModuleChipDto);
  }
}
