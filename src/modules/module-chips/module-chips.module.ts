import { Module } from '@nestjs/common';
import { ModuleChipsService } from './module-chips.service';
import { ModuleChipsController } from './module-chips.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityMoculesChips } from './entities/module-chip.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EntityMoculesChips])],
  controllers: [ModuleChipsController],
  providers: [ModuleChipsService],
  exports: [ModuleChipsService],
})
export class ModuleChipsModule {}
