import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateModuleMonitoreDto } from './dto/create-module-monitore.dto';
import { UpdateModuleMonitoreDto } from './dto/update-module-monitore.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { ModuleMonitore } from './entities/module-monitore.entity';

@Injectable()
export class ModuleMonitoresService {
  constructor(
    @InjectRepository(ModuleMonitore)
    readonly moduleMonitoresRepository: Repository<ModuleMonitore>,
  ) {}

  private readonly monitorRelations = [
    'estadoMonitorRef',
    'statusMonitorRef',
    'areaRef',
    'colaboradorRef',
    'ubicacionRef',
  ];

  private mapMonitorToResponse(m: ModuleMonitore) {
    return {
      id_monitor: m.id_monitor,
      serie: m.serie,
      marca: m.marca,
      modelo: m.modelo,
      estado_monitor: m.estado_monitor,
      estado_monitor_desc: m.estadoMonitorRef?.descripcion ?? null,
      status_monitor: m.status_monitor,
      status_monitor_desc: m.statusMonitorRef?.descripcion ?? null,
      id_area: m.id_area,
      ticket: m.ticket,
      nombre_area: m.areaRef?.nombre_area ?? null,
      usuario: m.usuario,
      nombre_colaborador: m.colaboradorRef?.nombre_completo ?? null,
      id_ubicacion: m.ubicacion,
      ubicacion: m.ubicacionRef?.descripcion ?? null,
      nombre_ubicacion: m.ubicacionRef?.descripcion ?? null,
      observaciones: m.observaciones,
      fecha_registro: m.fecha_registro,
      activo: m.activo,
      anexo: m.anexo,
    };
  }

  private mapDtoToMonitor(
    dto: CreateModuleMonitoreDto | UpdateModuleMonitoreDto,
    partial = false,
  ): DeepPartial<ModuleMonitore> {
    const mapped: DeepPartial<ModuleMonitore> = {};

    if (dto.serie !== undefined) {
      mapped.serie = dto.serie?.trim() ?? '';
    } else if (!partial) {
      mapped.serie = '';
    }
    if (dto.marca !== undefined) {
      mapped.marca = dto.marca?.trim() ?? '';
    } else if (!partial) {
      mapped.marca = '';
    }
    if (dto.modelo !== undefined) {
      mapped.modelo = dto.modelo?.trim() ?? '';
    } else if (!partial) {
      mapped.modelo = '';
    }
    if (dto.estado_monitor !== undefined) {
      mapped.estado_monitor = dto.estado_monitor;
    }
    if (dto.status_monitor !== undefined) {
      mapped.status_monitor = dto.status_monitor;
    }
    if (dto.id_area !== undefined) {
      mapped.id_area = dto.id_area;
    }
    if (dto.usuario !== undefined) {
      mapped.usuario = dto.usuario;
    }
    if (dto.ubicacion !== undefined) {
      mapped.ubicacion = dto.ubicacion;
    }
    if (dto.ticket !== undefined) {
      mapped.ticket = dto.ticket?.trim() || null;
    }
    if (dto.observaciones !== undefined) {
      mapped.observaciones = dto.observaciones?.trim() || null;
    }
    if (dto.anexo !== undefined) {
      mapped.anexo = dto.anexo;
    }
    if (dto.activo !== undefined) {
      mapped.activo = dto.activo;
    }

    return mapped;
  }

  async findAllMonitores() {
    try {
      const monitores = await this.moduleMonitoresRepository.find({
        relations: this.monitorRelations,
        order: { id_monitor: 'DESC' },
      });

      return monitores.map((m) => this.mapMonitorToResponse(m));
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  async findMonitorById(id: number) {
    try {
      const m = await this.moduleMonitoresRepository.findOne({
        where: { id_monitor: id },
        relations: this.monitorRelations,
      });
      return m ? this.mapMonitorToResponse(m) : null;
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  async createMonitor(dto: CreateModuleMonitoreDto) {
    try {
      const created = await this.moduleMonitoresRepository.save(
        this.moduleMonitoresRepository.create({
          ...this.mapDtoToMonitor(dto, false),
          activo: dto.activo ?? true,
          fecha_registro: dto.fecha_registro ?? new Date(),
        }),
      );
      const full = await this.moduleMonitoresRepository.findOne({
        where: { id_monitor: created.id_monitor },
        relations: this.monitorRelations,
      });
      return full ? this.mapMonitorToResponse(full) : created;
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  async updateMonitor(id: number, dto: UpdateModuleMonitoreDto) {
    try {
      const monitor = await this.moduleMonitoresRepository.findOneBy({
        id_monitor: id,
      });

      if (!monitor) {
        throw new BadRequestException(
          'El monitor no existe o no se encontró',
        );
      }

      const patch = this.mapDtoToMonitor(dto, true);
      await this.moduleMonitoresRepository.save({ ...monitor, ...patch });

      const full = await this.moduleMonitoresRepository.findOne({
        where: { id_monitor: id },
        relations: this.monitorRelations,
      });
      return full ? this.mapMonitorToResponse(full) : null;
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
