import { Module } from '@nestjs/common';
import { MasterDataService } from './master-data.service';
import { MasterDataController } from './master-data.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  MarterDataArea,
  MasterDataAsignacion,
  MasterDataColaborador,
  MasterDataEstadoChip,
  MasterDataEstadoEquipo,
  MasterDataOperadores,
  MasterDataRole,
  MasterDataTipoChip,
  MasterDataTipoEquipo,
  MasterDataUbicacion,
} from './entities/master-datum.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MarterDataArea,
      MasterDataAsignacion,
      MasterDataEstadoEquipo,
      MasterDataColaborador,
      MasterDataOperadores,
      MasterDataEstadoChip,
      MasterDataTipoChip,
      MasterDataTipoEquipo,
      MasterDataRole,
      MasterDataUbicacion,
    ]),
  ],
  controllers: [MasterDataController],
  providers: [MasterDataService],
})
export class MasterDataModule {}
