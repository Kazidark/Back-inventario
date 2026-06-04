import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModuleTabletService } from './module-tablet.service';
import { ModuleTabletController } from './module-tablet.controller';
import { ModuleTablet } from './entities/module-tablet.entity';
import { EntityMoculesChips } from '../module-chips/entities/module-chip.entity';
import {
  MarterDataArea,
  MasterDataAsignacion,
  MasterDataColaborador,
  MasterDataEstadoEquipo,
  MasterDataTipoChip,
  MasterDataUbicacion,
} from '../master-data/entities/master-datum.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    ModuleTablet,
    EntityMoculesChips,
    MasterDataEstadoEquipo,
    MasterDataAsignacion,
    MarterDataArea,
    MasterDataColaborador,
    MasterDataUbicacion,
    MasterDataTipoChip,
  ])],
  controllers: [ModuleTabletController],
  providers: [ModuleTabletService],
  exports: [ModuleTabletService],
})
export class ModuleTabletModule {}
