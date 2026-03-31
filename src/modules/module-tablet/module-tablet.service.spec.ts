import { Test, TestingModule } from '@nestjs/testing';
import { ModuleTabletService } from './module-tablet.service';

describe('ModuleTabletService', () => {
  let service: ModuleTabletService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ModuleTabletService],
    }).compile();

    service = module.get<ModuleTabletService>(ModuleTabletService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
