import { Module } from '@nestjs/common';
import { LaptosService } from './laptos.service';
import { LaptosController } from './laptos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lapto } from './entities/lapto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lapto])],
  controllers: [LaptosController],
  providers: [LaptosService],
  exports: [LaptosService],
})
export class LaptosModule {}
