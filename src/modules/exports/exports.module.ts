import { Module } from '@nestjs/common';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';
import { ModuleModemsModule } from '../module-modems/module-modems.module';
import { ModuleChipsModule } from '../module-chips/module-chips.module';
import { ModuleCelularesModule } from '../module-celulares/module-celulares.module';
import { LaptosModule } from '../module-pc/laptos/laptos.module';
import { ModuleMonitoresModule } from '../module-monitores/module-monitores.module';
import { ModuleTabletModule } from '../module-tablet/module-tablet.module';

@Module({
  imports: [
    ModuleModemsModule,
    ModuleChipsModule,
    ModuleCelularesModule,
    LaptosModule,
    ModuleMonitoresModule,
    ModuleTabletModule,
  ],
  controllers: [ExportsController],
  providers: [ExportsService],
})
export class ExportsModule {}
