import { Test, TestingModule } from '@nestjs/testing';
import { LaptosController } from './laptos.controller';
import { LaptosService } from './laptos.service';

describe('LaptosController', () => {
  let controller: LaptosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LaptosController],
      providers: [LaptosService],
    }).compile();

    controller = module.get<LaptosController>(LaptosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
