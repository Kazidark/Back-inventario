import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateModuleChipDto } from './dto/create-module-chip.dto';
import { UpdateModuleChipDto } from './dto/update-module-chip.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityMoculesChips } from './entities/module-chip.entity';
import { DeepPartial, Repository } from 'typeorm';

@Injectable()
export class ModuleChipsService {
  constructor(
    @InjectRepository(EntityMoculesChips)
    readonly moduleChipsRepository: Repository<EntityMoculesChips>,
  ) {}

  // create(createModuleChipDto: CreateModuleChipDto) {
  //   return 'This action adds a new moduleChip';
  // }

  private readonly chipRelations = [
    'operadorRel',
    'areaRel',
    'colaboradorRel',
    'estadoChipRel',
    'tipoChipRel',
  ];

  async findOneChip(id: number) {
    try {
      const chip = await this.moduleChipsRepository.findOne({
        where: { id_chip: id },
        // relations: this.chipRelations,
      });

      if (!chip) {
        throw new InternalServerErrorException(
          `Chip con id ${id} no encontrado`,
        );
      }

      return chip;
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  async findAllChips() {
    try {
      return await this.moduleChipsRepository.find({
        relations: this.chipRelations,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  async AllChipsDisponibles() {
    try {
      const chipActive = await this.moduleChipsRepository.find({
        where: { activo: true },
      });
      return chipActive;
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  async createChip(createModuleChipDto: CreateModuleChipDto) {
    try {
      const chipToCreate = this.moduleChipsRepository.create({
        ...createModuleChipDto,
        activo: createModuleChipDto.activo ?? true,
        fecha_registro: new Date(),
      });

      return await this.moduleChipsRepository.save(chipToCreate);
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  async updateChip(id: number, updateModuleChipDto: UpdateModuleChipDto) {
    try {
      const chip = await this.moduleChipsRepository.findOneBy({ id_chip: id });

      if (!chip) {
        throw new BadRequestException(
          'El chip no existe o no se encontró',
        );
      }

      const chipMerged = this.moduleChipsRepository.merge(
        chip,
        updateModuleChipDto as DeepPartial<EntityMoculesChips>,
      );

      return await this.moduleChipsRepository.save(chipMerged);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }
}
