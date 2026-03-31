import { Test, TestingModule } from '@nestjs/testing';
import { ModuleTabletController } from './module-tablet.controller';
import { ModuleTabletService } from './module-tablet.service';

describe('ModuleTabletController', () => {
  let controller: ModuleTabletController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModuleTabletController],
      providers: [ModuleTabletService],
    }).compile();

    controller = module.get<ModuleTabletController>(ModuleTabletController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
