import { Module } from '@nestjs/common';
import { ModuleAsignacionService } from './module-asignacion.service';
import { ModuleAsignacionController } from './module-asignacion.controller';

@Module({
  controllers: [ModuleAsignacionController],
  providers: [ModuleAsignacionService],
})
export class ModuleAsignacionModule {}
