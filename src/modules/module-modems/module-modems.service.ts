import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateModuleModemDto } from './dto/create-module-modem.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { EntityMoculesModems } from './entities/module-modem.entity';
import { EntityMoculesChips } from '../module-chips/entities/module-chip.entity';
import { UpdateModuleModemDto } from './dto/update-module-modem.dto';
import {
  MasterDataAsignacion,
  MasterDataEstadoEquipo,
} from '../master-data/entities/master-datum.entity';

@Injectable()
export class ModuleModemsService {
  constructor(
    @InjectRepository(EntityMoculesModems)
    readonly moduleModemsRepository: Repository<EntityMoculesModems>,
    @InjectRepository(EntityMoculesChips)
    readonly moduleChipsRepository: Repository<EntityMoculesChips>,
    @InjectRepository(MasterDataAsignacion)
    readonly masterDataAsignacionRepository: Repository<MasterDataAsignacion>,
    @InjectRepository(MasterDataEstadoEquipo)
    readonly masterDataEstadoEquipoRepository: Repository<MasterDataEstadoEquipo>,
  ) {}

  async create(createModuleModemDto: CreateModuleModemDto) {
    try {
      // console.log(createModuleModemDto);

      const modemData: DeepPartial<EntityMoculesModems> = {
        marca: createModuleModemDto.marca,
        modelo: createModuleModemDto.modelo,
        imei_modem: createModuleModemDto.imei_modem,
        estado_modem: createModuleModemDto.estado_modem ?? null,
        estado_equipo: createModuleModemDto.estado_equipo ?? null,
        id_area: createModuleModemDto.id_area ?? null,
        ticket: createModuleModemDto.ticket ?? null,
        usuario: this.toOptionalInt(createModuleModemDto.usuario),
        num_Chip: createModuleModemDto.id_chip ?? null,
        fecha_registro: createModuleModemDto.fecha_registro ?? new Date(),
        activo: createModuleModemDto.activo ?? true,
      };

      const modem = this.moduleModemsRepository.create(modemData);

      /**
       * actualizo el valor de  activo
       */
      // const cambioChip = modem.num_Chip;
      // if (cambioChip) {
      //   await this.moduleChipsRepository.update(cambioChip, { activo: false });
      // } else {
      //   throw new BadRequestException('El chip no existe');
      // }
      return await this.moduleModemsRepository.save(modem);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  async findAllModems() {
    try {
      const [modems, asignaciones, estadosModem] = await Promise.all([
        this.moduleModemsRepository.find({
          relations: {
            estadoModemRef: true,
            estadoEquipoRef: true,
            areaRef: true,
            colaboradorRef: true,
            chipsRef: true,
          },
          order: {
            id_modem: 'DESC',
          },
        }),
        this.masterDataAsignacionRepository.find(),
        this.masterDataEstadoEquipoRepository.find(),
      ]);

      const asignacionById = new Map(
        asignaciones.map((a) => [a.id_asignado, a.descripcion]),
      );
      const estadoModemById = new Map(
        estadosModem.map((e) => [e.id_estado, e.descripcion]),
      );

      return modems.map((m) => ({
        id_modem: m.id_modem,
        marca: m.marca,
        modelo: m.modelo,
        imei_modem: m.imei_modem,
        estado_modem: m.estado_modem,
        estado_modem_desc:
          m.estadoModemRef?.descripcion ??
          (m.estado_modem != null
            ? (estadoModemById.get(m.estado_modem) ?? null)
            : null),
        estado_equipo: m.estado_equipo,
        estado_equipo_desc:
          m.estadoEquipoRef?.descripcion ??
          (m.estado_equipo != null
            ? (asignacionById.get(m.estado_equipo) ?? null)
            : null),
        id_area: m.id_area,
        area_desc: m.areaRef?.nombre_area ?? null,
        usuario: m.usuario,
        usuario_desc: m.colaboradorRef?.nombre_completo ?? null,
        num_Chip: m.num_Chip,
        numero_chip:
          m.chipsRef?.numero_chip != null
            ? String(m.chipsRef.numero_chip).trim() || null
            : null,
        chip_desc:
          m.chipsRef?.numero_chip != null
            ? String(m.chipsRef.numero_chip).trim() || null
            : null,
        fecha_registro: m.fecha_registro,
        activo: m.activo,
        ticket: m.ticket,
      }));
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  async findModemById(id_modem: number) {
    try {
      return await this.moduleModemsRepository.findOneBy({ id_modem });
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  async updateModem(
    id_modem: number,
    updateModuleModemDto: UpdateModuleModemDto,
  ) {
    try {
      const modem = await this.moduleModemsRepository.findOneBy({ id_modem });
      if (!modem) {
        throw new BadRequestException('El modem no existe o no se encontro');
      }

      const patch = this.mapModemDtoToEntity(updateModuleModemDto);
      const merged = this.moduleModemsRepository.merge(modem, patch);

      if (merged.num_Chip) {
        await this.moduleChipsRepository.update(merged.num_Chip, {
          activo: false,
        });
      }

      return await this.moduleModemsRepository.save(merged);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  private toOptionalInt(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  private mapModemDtoToEntity(
    dto: CreateModuleModemDto | UpdateModuleModemDto,
  ): DeepPartial<EntityMoculesModems> {
    const patch: DeepPartial<EntityMoculesModems> = {};

    if ('marca' in dto && dto.marca !== undefined) patch.marca = dto.marca;
    if ('modelo' in dto && dto.modelo !== undefined) patch.modelo = dto.modelo;
    if ('imei_modem' in dto && dto.imei_modem !== undefined) {
      patch.imei_modem = dto.imei_modem;
    }
    if ('estado_modem' in dto && dto.estado_modem !== undefined) {
      patch.estado_modem = dto.estado_modem;
    }
    if ('estado_equipo' in dto && dto.estado_equipo !== undefined) {
      patch.estado_equipo = dto.estado_equipo;
    }
    if ('id_area' in dto && dto.id_area !== undefined) patch.id_area = dto.id_area;
    if ('ticket' in dto && dto.ticket !== undefined) patch.ticket = dto.ticket;
    if ('usuario' in dto && dto.usuario !== undefined) {
      patch.usuario = this.toOptionalInt(dto.usuario);
    }
    if ('id_chip' in dto && dto.id_chip !== undefined) {
      patch.num_Chip = dto.id_chip ?? null;
    }
    if ('activo' in dto && dto.activo !== undefined) patch.activo = dto.activo;

    return patch;
  }
}
