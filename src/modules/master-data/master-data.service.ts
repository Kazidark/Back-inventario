import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  MarterDataArea,
  MasterDataAsignacion,
  MasterDataColaborador,
  MasterDataEstadoChip,
  MasterDataEstadoEquipo,
  MasterDataOperadores,
  MasterDataRole,
  MasterDataTipoChip,
  MasterDataTipoEquipo,
  MasterDataUbicacion,
} from './entities/master-datum.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MasterDataService {
  constructor(
    @InjectRepository(MarterDataArea)
    private readonly masterDataRepository: Repository<MarterDataArea>,
    @InjectRepository(MasterDataAsignacion)
    private readonly MasterDataAsignacion: Repository<MasterDataAsignacion>,
    @InjectRepository(MasterDataEstadoEquipo)
    private readonly MasterDataEstadoEquipo: Repository<MasterDataEstadoEquipo>,
    @InjectRepository(MasterDataColaborador)
    private readonly MasterDataColaborador: Repository<MasterDataColaborador>,
    @InjectRepository(MasterDataOperadores)
    private readonly MasterDataOperadores: Repository<MasterDataOperadores>,
    @InjectRepository(MasterDataEstadoChip)
    private readonly MasterDataEstadoChip: Repository<MasterDataEstadoChip>,
    @InjectRepository(MasterDataTipoChip)
    private readonly MasterDataTipoChip: Repository<MasterDataTipoChip>,
    @InjectRepository(MasterDataTipoEquipo)
    private readonly MasterDataTipoEquipo: Repository<MasterDataTipoEquipo>,
    @InjectRepository(MasterDataRole)
    private readonly MasterDataRole: Repository<MasterDataRole>,
    @InjectRepository(MasterDataUbicacion)
    private readonly MasterDataUbicacion: Repository<MasterDataUbicacion>,
  ) {}

  async findAllArea() {
    try {
      const areas = await this.masterDataRepository.find();
      return areas ?? [];
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Error al obtener las áreas');
    }
  }

  async findAllEstadoEquipo() {
    try {
      const estadoEquipo = await this.MasterDataEstadoEquipo.find();
      return estadoEquipo ?? [];
    } catch (error) {
      console.error(error);
      console.log(error);
      throw new InternalServerErrorException(
        'Error al obtener los estados de los equipos',
      );
    }
  }

  async findAllColaborador() {
    try {
      const colaborador = await this.MasterDataColaborador.find();
      return colaborador ?? [];
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Error al obtener los colaboradores',
      );
    }
  }

  async findAllAsignacion() {
    try {
      const asignacion = await this.MasterDataAsignacion.find();
      return asignacion ?? [];
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Error al obtener las asignaciones',
      );
    }
  }

  async findAllOperadores() {
    try {
      const operadores = await this.MasterDataOperadores.find();

      return operadores ?? [];
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Error al obtener los operadores moviles',
      );
    }
  }

  async findAllEstadoChips() {
    try {
      const estadoChips = await this.MasterDataEstadoChip.find();
      return estadoChips ?? [];
    } catch (error) {
      console.error(error);
      // Mantiene el mismo comportamiento de catálogos opcionales.
      return [];
    }
  }
  async findAllTipoChip() {
    try {
      const tipoChip = await this.MasterDataTipoChip.find();
      return tipoChip ?? [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async findAllTipoEquipo() {
    try {
      const tipoEquipo = await this.MasterDataTipoEquipo.find();
      return tipoEquipo ?? [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }

    async findAllRoles() {
      try {
        const roles = await this.MasterDataRole.find();
        return roles ?? [];
      } catch (error) {
        console.error(error);
        return [];
      }
    }
    async findAllUbicacion() {
      try {
        const ubicacion = await this.MasterDataUbicacion.find();
        return ubicacion ?? [];
      } catch (error) {
        console.error(error);
        return [];
      }
    }
}
