import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateColaboradorDto } from './dto/create-colaborador.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { EntityMoculesColaborador } from './entities/colaborador.entity';

@Injectable()
export class ColaboradorService {
  constructor(
    @InjectRepository(EntityMoculesColaborador)
    private readonly colaboradorRepository: Repository<EntityMoculesColaborador>,
  ) {}

  async create(createColaboradorDto: CreateColaboradorDto) {
    try {
      const colaboradorData: DeepPartial<EntityMoculesColaborador> = {
        nombre_completo: createColaboradorDto.nombre_completo,
        documento: createColaboradorDto.documento?.trim() || null,
        email: createColaboradorDto.email,
        activo: createColaboradorDto.activo,
        fecha_creacion: createColaboradorDto.fecha_creacion ?? new Date(),
      };

      const colaborador = this.colaboradorRepository.create(colaboradorData);
      return await this.colaboradorRepository.save(colaborador);
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  async getColaboradores() {
    try {
      return await this.colaboradorRepository.find();
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }
}
