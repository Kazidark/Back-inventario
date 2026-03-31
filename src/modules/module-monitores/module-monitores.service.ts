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
  ];

  async findAllMonitores() {
    try {
      const monitores = await this.moduleMonitoresRepository.find({
        relations: this.monitorRelations,
        order: { id_monitor: 'DESC' },
      });

      return monitores.map((m) => ({
        id_monitor: m.id_monitor,
        serie: m.serie,
        marca: m.marca,
        modelo: m.modelo,
        estado_monitor: m.estado_monitor,
        estado_monitor_desc: m.estadoMonitorRef?.descripcion ?? null,
        status_monitor: m.status_monitor,
        status_monitor_desc: m.statusMonitorRef?.descripcion ?? null,
        id_area: m.id_area,
        nombre_area: m.areaRef?.nombre_area ?? null,
        usuario: m.usuario,
        nombre_colaborador: m.colaboradorRef?.nombre_completo ?? null,
        ubicacion: m.ubicacion,
        observaciones: m.observaciones,
        fecha_registro: m.fecha_registro,
        activo: m.activo,
        anexo: m.anexo,
      }));
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  async findMonitorById(id: number) {
    try {
      return await this.moduleMonitoresRepository.findOneBy({
        id_monitor: id,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  async createMonitor(dto: CreateModuleMonitoreDto) {
    try {
      const monitor = this.moduleMonitoresRepository.create({
        ...dto,
        activo: dto.activo ?? true,
        fecha_registro: dto.fecha_registro ?? new Date(),
      });
      return await this.moduleMonitoresRepository.save(monitor);
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

      const merged = this.moduleMonitoresRepository.merge(
        monitor,
        dto as DeepPartial<ModuleMonitore>,
      );

      return await this.moduleMonitoresRepository.save(merged);
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
