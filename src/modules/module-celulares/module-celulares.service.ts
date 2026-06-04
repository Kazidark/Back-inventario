import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateModuleCelulareDto } from './dto/create-module-celulare.dto';
import { UpdateModuleCelulareDto } from './dto/update-module-celulare.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { ModuleCelulare } from './entities/module-celulare.entity';
import { EntityMoculesChips } from '../module-chips/entities/module-chip.entity';

@Injectable()
export class ModuleCelularesService {
  constructor(
    @InjectRepository(ModuleCelulare)
    readonly moduleCelularesRepository: Repository<ModuleCelulare>,
    @InjectRepository(EntityMoculesChips)
    readonly moduleChipsRepository: Repository<EntityMoculesChips>,
  ) {}

  private readonly celularRelations = [
    'estadoCelularRef',
    'estadoEquipoRef',
    'areaRef',
    'colaboradorRef',
    'chipRef',
  ];

  async findAllCelulares() {
    try {
      const celulares = await this.moduleCelularesRepository.find({
        relations: this.celularRelations,
        order: { id_celular: 'DESC' },
      });

      return celulares.map((c) => ({
        id_celular: c.id_celular,
        marca: c.marca,
        modelo: c.modelo,
        imei_celular: c.imei_celular,
        estado_celular: c.estado_celular,
        estado_celular_desc: c.estadoCelularRef?.descripcion ?? null,
        estado_equipo: c.estado_equipo,
        estado_equipo_desc: c.estadoEquipoRef?.descripcion ?? null,
        id_area: c.id_area,
        nombre_area: c.areaRef?.nombre_area ?? null,
        usuario: c.usuario,
        nombre_colaborador: c.colaboradorRef?.nombre_completo ?? null,
        numero_chip: c.numero_chip,
        numero_chip_desc:
          c.chipRef?.numero_chip != null
            ? String(c.chipRef.numero_chip).trim()
            : null,
        iccid_desc: c.chipRef?.iccid ?? null,
        ticket: c.ticket,
        correo_electronico: c.correo_electronico,
        observacion: c.observacion,
        fecha_registro: c.fecha_registro,
        activo: c.activo,
      }));
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  /** Filas con textos de catálogo para exportar / reimportar Excel. */
  async findAllCelularesForExcel() {
    const rows = await this.findAllCelulares();
    return rows.map((c) => ({
      marca: c.marca ?? '',
      modelo: c.modelo ?? '',
      imei_celular: c.imei_celular ?? '',
      estado_celular_desc: c.estado_celular_desc ?? '',
      estado_equipo_desc: c.estado_equipo_desc ?? '',
      area_desc: c.nombre_area ?? '',
      usuario_desc: c.nombre_colaborador ?? '',
      iccid: c.iccid_desc ?? '',
      observacion: c.observacion ?? '',
      ticket: c.ticket ?? '',
      email: c.correo_electronico ?? '',
    }));
  }

  async findCelularById(id: number) {
    try {
      const celular = await this.moduleCelularesRepository.findOne({
        where: { id_celular: id },
        relations: this.celularRelations,
      });
      if (!celular) {
        throw new BadRequestException('El celular no existe o no se encontró');
      }
      return {
        id_celular: celular.id_celular,
        marca: celular.marca,
        modelo: celular.modelo,
        imei_celular: celular.imei_celular,
        estado_celular: celular.estado_celular,
        estado_equipo: celular.estado_equipo,
        id_area: celular.id_area,
        usuario: celular.usuario,
        numero_chip: celular.numero_chip,
        ticket: celular.ticket,
        correo_electronico: celular.correo_electronico,
        observacion: celular.observacion,
        activo: celular.activo,
        fecha_registro: celular.fecha_registro,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  /** Mapea DTO → entidad (correo_electronico ↔ columna email). */
  private mapDtoToCelular(
    dto: CreateModuleCelulareDto | UpdateModuleCelulareDto,
    partial = false,
  ): DeepPartial<ModuleCelulare> {
    const mapped: DeepPartial<ModuleCelulare> = {};

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
    if (dto.imei_celular !== undefined) {
      mapped.imei_celular = dto.imei_celular?.trim() ?? '';
    } else if (!partial) {
      mapped.imei_celular = '';
    }
    if (dto.estado_celular !== undefined) {
      mapped.estado_celular = dto.estado_celular;
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
    if (dto.numero_chip !== undefined) {
      mapped.numero_chip = dto.numero_chip;
    }
    if (dto.ticket !== undefined) {
      mapped.ticket = dto.ticket?.trim() || null;
    }
    if (dto.observacion !== undefined) {
      mapped.observacion = dto.observacion?.trim() || null;
    }
    const correo = this.resolveCorreoFromDto(dto);
    if (correo !== undefined) {
      mapped.correo_electronico = correo;
    }
    if (dto.activo !== undefined) {
      mapped.activo = dto.activo;
    }
    if (dto.fecha_registro !== undefined) {
      mapped.fecha_registro = dto.fecha_registro;
    }

    return mapped;
  }

  private resolveCorreoFromDto(
    dto: CreateModuleCelulareDto | UpdateModuleCelulareDto,
  ): string | null | undefined {
    const record = dto as CreateModuleCelulareDto & Record<string, unknown>;
    const hasCorreo =
      Object.prototype.hasOwnProperty.call(record, 'correo_electronico') ||
      Object.prototype.hasOwnProperty.call(record, 'email');
    if (!hasCorreo) return undefined;

    const raw =
      record.correo_electronico !== undefined
        ? record.correo_electronico
        : record.email;
    if (raw == null) return null;
    const text = String(raw).trim();
    return text === '' ? null : text;
  }

  async createCelular(dto: CreateModuleCelulareDto) {
    try {
      const celular = this.moduleCelularesRepository.create({
        ...this.mapDtoToCelular(dto, false),
        activo: dto.activo ?? true,
        fecha_registro: dto.fecha_registro ?? new Date(),
      });
     

        /**
       * actualizo el valor de  activo
       */
        // const cambioChip = celular.numero_chip;
        // if (cambioChip) {
        //   await this.moduleChipsRepository.update(cambioChip, { activo: false });
        // } else {
        //   throw new BadRequestException('El chip no existe');
        // }
        return await this.moduleCelularesRepository.save(celular);
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  async updateCelular(id: number, dto: UpdateModuleCelulareDto) {
    try {
      const celular = await this.moduleCelularesRepository.findOneBy({
        id_celular: id,
      });

      if (!celular) {
        throw new BadRequestException(
          'El celular no existe o no se encontró',
        );
      }

      const patch = this.mapDtoToCelular(dto, true);
      const correo = this.resolveCorreoFromDto(dto);
      if (correo !== undefined) {
        patch.correo_electronico = correo;
      }

      return await this.moduleCelularesRepository.save({
        ...celular,
        ...patch,
      });
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
