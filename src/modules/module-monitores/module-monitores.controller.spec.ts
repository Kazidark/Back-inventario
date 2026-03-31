import { Test, TestingModule } from '@nestjs/testing';
import { ModuleMonitoresController } from './module-monitores.controller';
import { ModuleMonitoresService } from './module-monitores.service';

describe('ModuleMonitoresController', () => {
  let controller: ModuleMonitoresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModuleMonitoresController],
      providers: [ModuleMonitoresService],
    }).compile();

    controller = module.get<ModuleMonitoresController>(
      ModuleMonitoresController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
