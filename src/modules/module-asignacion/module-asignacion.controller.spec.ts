import { Test, TestingModule } from '@nestjs/testing';
import { ModuleAsignacionController } from './module-asignacion.controller';
import { ModuleAsignacionService } from './module-asignacion.service';

describe('ModuleAsignacionController', () => {
  let controller: ModuleAsignacionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModuleAsignacionController],
      providers: [ModuleAsignacionService],
    }).compile();

    controller = module.get<ModuleAsignacionController>(
      ModuleAsignacionController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
