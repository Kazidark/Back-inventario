import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModuleTabletService } from './module-tablet.service';
import { ModuleTabletController } from './module-tablet.controller';
import { ModuleTablet } from './entities/module-tablet.entity';
import { EntityMoculesChips } from '../module-chips/entities/module-chip.entity';
import { MarterDataArea, MasterDataColaborador, MasterDataEstadoEquipo, MasterDataTipoChip } from '../master-data/entities/master-datum.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    ModuleTablet,
    EntityMoculesChips,
    MasterDataEstadoEquipo,
    MarterDataArea,
    MasterDataColaborador,
    MasterDataTipoChip,
  ])],
  controllers: [ModuleTabletController],
  providers: [ModuleTabletService],
  exports: [ModuleTabletService],
})
export class ModuleTabletModule {}
