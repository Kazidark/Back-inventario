import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ColaboradorService } from './colaborador.service';
import { ColaboradorController } from './colaborador.controller';
import { EntityMoculesColaborador } from './entities/colaborador.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EntityMoculesColaborador])],
  controllers: [ColaboradorController],
  providers: [ColaboradorService],
  exports: [ColaboradorService],
})
export class ColaboradorModule {}
