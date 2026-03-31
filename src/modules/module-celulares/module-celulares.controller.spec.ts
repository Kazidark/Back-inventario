import { Test, TestingModule } from '@nestjs/testing';
import { ModuleCelularesController } from './module-celulares.controller';
import { ModuleCelularesService } from './module-celulares.service';

describe('ModuleCelularesController', () => {
  let controller: ModuleCelularesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModuleCelularesController],
      providers: [ModuleCelularesService],
    }).compile();

    controller = module.get<ModuleCelularesController>(
      ModuleCelularesController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
