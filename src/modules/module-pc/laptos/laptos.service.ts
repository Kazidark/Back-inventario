import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateLaptoDto } from './dto/create-lapto.dto';
import { UpdateLaptoDto } from './dto/update-lapto.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Lapto } from './entities/lapto.entity';
import { mapLaptopEstadoPcToStatusExport } from '../../subir-archivo/laptop-excel.util';

@Injectable()
export class LaptosService {
  constructor(
    @InjectRepository(Lapto)
    readonly pcRepository: Repository<Lapto>,
  ) {}

  private readonly pcRelations = [
    'estadoPcRef',
    'estadoEquipoRef',
    'areaRef',
    'colaboradorRef',
    'ubicacionRef',
  ];

  private mapPcToResponse(p: Lapto) {
    return {
      id_pc: p.id_pc,
      tipo_equipo: p.tipo_equipo,
      marca: p.marca,
      modelo: p.modelo,
      serie: p.serie,
      estado_pc: p.estado_pc,
      estado_pc_desc: p.estadoPcRef?.descripcion ?? null,
      estado_equipo: p.estado_equipo,
      estado_equipo_desc: p.estadoEquipoRef?.descripcion ?? null,
      id_area: p.id_area,
      ticket:p.ticket,
      nombre_area: p.areaRef?.nombre_area ?? null,
      usuario: p.usuario,
      nombre_colaborador: p.colaboradorRef?.nombre_completo ?? null,
      id_ubicacion: p.ubicacion,
      ubicacion: p.ubicacionRef?.descripcion ?? null,
      nombre_ubicacion: p.ubicacionRef?.descripcion ?? null,
      observaciones: p.observaciones,
      fecha_registro: p.fecha_registro,
      activo: p.activo,
      anexo: p.anexo,
    };
  }

  async findAllPc() {
    try {
      const pcs = await this.pcRepository.find({
        relations: this.pcRelations,
        order: { id_pc: 'DESC' },
      });

      return pcs.map((p) => this.mapPcToResponse(p));
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  /** Filas con textos de catálogo para exportar / reimportar Excel (formato laptos.xlsx). */
  async findAllPcsForExcel() {
    const rows = await this.findAllPc();
    return rows.map((p) => ({
      tipo_equipo: p.tipo_equipo ?? '',
      marca: p.marca ?? '',
      modelo: p.modelo ?? '',
      serie: p.serie ?? '',
      estado_pc_status: mapLaptopEstadoPcToStatusExport(p.estado_pc_desc),
      estado_equipo_desc: p.estado_equipo_desc ?? '',
      area_desc: p.nombre_area ?? '',
      usuario_desc: p.nombre_colaborador ?? '',
      ticket: p.ticket ?? '',
      ubicacion_desc: p.nombre_ubicacion ?? p.ubicacion ?? '',
      observaciones: p.observaciones ?? '',
      anexo: p.anexo != null ? String(p.anexo) : '',
      activo: p.activo ? 'SI' : 'NO',
    }));
  }

  async findPcById(id: number) {
    try {
      const p = await this.pcRepository.findOne({
        where: { id_pc: id },
        relations: this.pcRelations,
      });
      return p ? this.mapPcToResponse(p) : null;
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  private mapDtoToLaptop(
    dto: CreateLaptoDto | UpdateLaptoDto,
    partial = false,
  ): DeepPartial<Lapto> {
    const mapped: DeepPartial<Lapto> = {};

    if (dto.tipo_equipo !== undefined) {
      mapped.tipo_equipo = dto.tipo_equipo?.trim() ?? '';
    } else if (!partial) {
      mapped.tipo_equipo = '';
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
    if (dto.serie !== undefined) {
      mapped.serie = dto.serie?.trim() ?? '';
    } else if (!partial) {
      mapped.serie = '';
    }
    if (dto.estado_pc !== undefined) {
      mapped.estado_pc = dto.estado_pc;
    }
    if (dto.estado_equipo !== undefined) {
      mapped.estado_equipo = dto.estado_equipo;
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

  async createPc(dto: CreateLaptoDto) {
    try {
      const created = await this.pcRepository.save(
        this.pcRepository.create({
          ...this.mapDtoToLaptop(dto, false),
          activo: dto.activo ?? true,
          fecha_registro: dto.fecha_registro ?? new Date(),
        }),
      );
      const full = await this.pcRepository.findOne({
        where: { id_pc: created.id_pc },
        relations: this.pcRelations,
      });
      return full ? this.mapPcToResponse(full) : created;
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  async updatePc(id: number, dto: UpdateLaptoDto) {
    try {
      const pc = await this.pcRepository.findOneBy({ id_pc: id });

      if (!pc) {
        throw new BadRequestException(
          'El equipo no existe o no se encontró',
        );
      }

      const patch = this.mapDtoToLaptop(dto, true);
      await this.pcRepository.save({ ...pc, ...patch });

      const full = await this.pcRepository.findOne({
        where: { id_pc: id },
        relations: this.pcRelations,
      });
      return full ? this.mapPcToResponse(full) : null;
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
