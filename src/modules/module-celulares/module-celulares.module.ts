import { Module } from '@nestjs/common';
import { ModuleCelularesService } from './module-celulares.service';
import { ModuleCelularesController } from './module-celulares.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModuleCelulare } from './entities/module-celulare.entity';
import { EntityMoculesChips } from '../module-chips/entities/module-chip.entity';
import { MarterDataArea, MasterDataEstadoEquipo } from '../master-data/entities/master-datum.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    ModuleCelulare,
    EntityMoculesChips,
    MasterDataEstadoEquipo,
    MarterDataArea,
  ])],
  controllers: [ModuleCelularesController],
  providers: [ModuleCelularesService],
  exports: [ModuleCelularesService],
})
export class ModuleCelularesModule {}
