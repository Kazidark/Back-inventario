import { Controller, Get } from '@nestjs/common';
import { MasterDataService } from './master-data.service';

@Controller('master-data')
export class MasterDataController {
  constructor(private readonly masterDataService: MasterDataService) {}

  @Get('area')
  finAllArea() {
    return this.masterDataService.findAllArea();
  }

  @Get('estadoEquipo')
  findAllEstadoEquipo() {
    return this.masterDataService.findAllEstadoEquipo();
  }

  @Get('colaborador')
  findAllColaborador() {
    return this.masterDataService.findAllColaborador();
  }

  @Get('asignacion')
  findAllAsignacion() {
    return this.masterDataService.findAllAsignacion();
  }

  @Get('operadores')
  findAllOperadoreMoviles() {
    return this.masterDataService.findAllOperadores();
  }
  @Get('estadoChips')
  findAllEstadoChips() {
    return this.masterDataService.findAllEstadoChips();
  }
  @Get('tipoChip')
  finAllTipoChip() {
    return this.masterDataService.findAllTipoChip();
  }
  @Get('tipoEquipo')
  findtipoEquipo() {
    return this.masterDataService.findAllTipoEquipo();
  }
}
