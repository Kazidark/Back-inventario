import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ModuleModemsService } from './module-modems.service';
import { CreateModuleModemDto } from './dto/create-module-modem.dto';
import { UpdateModuleModemDto } from './dto/update-module-modem.dto';

@Controller('module-modems')
export class ModuleModemsController {
  constructor(private readonly moduleModemsService: ModuleModemsService) {}

  @Post('create-modem')
  create(@Body() createModuleModemDto: CreateModuleModemDto) {
    return this.moduleModemsService.create(createModuleModemDto);
  }

  @Get('GetAllModems')
  findAll() {
    return this.moduleModemsService.findAllModems();
  }

  // Alias para mantener compatibilidad con consumo actual
  @Get('GetAllbyId/:id_moden')
  getodemById(@Param('id_moden', ParseIntPipe) id_moden: number) {
    return this.moduleModemsService.findModemById(+id_moden);
  }

  @Put('updateModems/:id_moden')
  UpdateModems(
    @Param('id_moden') id_modem: string,
    @Body() updateModuleModemDto: UpdateModuleModemDto,
  ) {
    return this.moduleModemsService.updateModem(
      +id_modem,
      updateModuleModemDto,
    );
  }
}
