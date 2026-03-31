import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModuleMonitoresService } from './module-monitores.service';
import { ModuleMonitoresController } from './module-monitores.controller';
import { ModuleMonitore } from './entities/module-monitore.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ModuleMonitore])],
  controllers: [ModuleMonitoresController],
  providers: [ModuleMonitoresService],
  exports: [ModuleMonitoresService],
})
export class ModuleMonitoresModule {}
