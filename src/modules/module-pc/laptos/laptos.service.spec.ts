import { Test, TestingModule } from '@nestjs/testing';
import { LaptosService } from './laptos.service';

describe('LaptosService', () => {
  let service: LaptosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LaptosService],
    }).compile();

    service = module.get<LaptosService>(LaptosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
