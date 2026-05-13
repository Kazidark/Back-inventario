import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubirArchivoService } from './subir-archivo.service';
import { SubirArchivoController } from './subir-archivo.controller';
import {
  MarterDataArea,
  MasterDataAsignacion,
  MasterDataColaborador,
  MasterDataEstadoChip,
  MasterDataEstadoEquipo,
  MasterDataOperadores,
  MasterDataRole,
  MasterDataTipoChip,
  MasterDataUbicacion,
} from '../master-data/entities/master-datum.entity';
import { EntityMoculesModems } from '../module-modems/entities/module-modem.entity';
import { EntityMoculesChips } from '../module-chips/entities/module-chip.entity';
import { ModuleCelulare } from '../module-celulares/entities/module-celulare.entity';
import { Lapto } from '../module-pc/laptos/entities/lapto.entity';
import { ModuleTablet } from '../module-tablet/entities/module-tablet.entity';
import { ModuleMonitore } from '../module-monitores/entities/module-monitore.entity';
import { ModuleModemsModule } from '../module-modems/module-modems.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MarterDataArea,
      MasterDataRole,
      MasterDataUbicacion,
      MasterDataEstadoEquipo,
      MasterDataAsignacion,
      MasterDataColaborador,
      MasterDataTipoChip,
      MasterDataOperadores,
      MasterDataEstadoChip,
      EntityMoculesModems,
      EntityMoculesChips,
      ModuleCelulare,
      Lapto,
      ModuleTablet,
      ModuleMonitore,
    ]),
    ModuleModemsModule,
  ],
  controllers: [SubirArchivoController],
  providers: [SubirArchivoService],
})
export class SubirArchivoModule {}
