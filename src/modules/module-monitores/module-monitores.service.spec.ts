import { Test, TestingModule } from '@nestjs/testing';
import { ModuleMonitoresService } from './module-monitores.service';

describe('ModuleMonitoresService', () => {
  let service: ModuleMonitoresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ModuleMonitoresService],
    }).compile();

    service = module.get<ModuleMonitoresService>(ModuleMonitoresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
