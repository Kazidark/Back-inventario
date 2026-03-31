import { Module } from '@nestjs/common';
import { ModuleModemsService } from './module-modems.service';
import { ModuleModemsController } from './module-modems.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityMoculesModems } from './entities/module-modem.entity';
import { EntityMoculesChips } from '../module-chips/entities/module-chip.entity';
import {
  MarterDataArea,
  MasterDataAsignacion,
  MasterDataColaborador,
  MasterDataEstadoEquipo,
  MasterDataTipoChip,
} from '../master-data/entities/master-datum.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EntityMoculesModems,
      MasterDataEstadoEquipo,
      MasterDataAsignacion,
      MarterDataArea,
      MasterDataColaborador,
      EntityMoculesChips,
      MasterDataTipoChip,
    ]),
  ],
  controllers: [ModuleModemsController],
  providers: [ModuleModemsService],
  exports: [ModuleModemsService],
})
export class ModuleModemsModule {}
