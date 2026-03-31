import { Test, TestingModule } from '@nestjs/testing';
import { ModuleAsignacionService } from './module-asignacion.service';

describe('ModuleAsignacionService', () => {
  let service: ModuleAsignacionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ModuleAsignacionService],
    }).compile();

    service = module.get<ModuleAsignacionService>(ModuleAsignacionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
