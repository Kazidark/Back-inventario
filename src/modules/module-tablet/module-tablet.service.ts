import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, In, Repository } from 'typeorm';
import { ModuleTablet } from './entities/module-tablet.entity';
import { CreateModuleTabletDto } from './dto/create-module-tablet.dto';
import { UpdateModuleTabletDto } from './dto/update-module-tablet.dto';
import { EntityMoculesChips } from '../module-chips/entities/module-chip.entity';
import {
  MarterDataArea,
  MasterDataAsignacion,
  MasterDataColaborador,
  MasterDataEstadoEquipo,
  MasterDataUbicacion,
} from '../master-data/entities/master-datum.entity';

type TabletCatalogLookups = {
  colaboradorById: Map<number, string>;
  ubicacionById: Map<number, string>;
  estadoTabletById: Map<number, string>;
  estadoEquipoById: Map<number, string>;
  areaById: Map<number, string>;
};

@Injectable()
export class ModuleTabletService {
  constructor(
    @InjectRepository(ModuleTablet)
    readonly moduleTabletRepository: Repository<ModuleTablet>,
    @InjectRepository(EntityMoculesChips)
    readonly moduleChipsRepository: Repository<EntityMoculesChips>,
    @InjectRepository(MasterDataColaborador)
    readonly colaboradorRepository: Repository<MasterDataColaborador>,
    @InjectRepository(MasterDataUbicacion)
    readonly ubicacionRepository: Repository<MasterDataUbicacion>,
    @InjectRepository(MasterDataEstadoEquipo)
    readonly estadoEquipoRepository: Repository<MasterDataEstadoEquipo>,
    @InjectRepository(MasterDataAsignacion)
    readonly asignacionRepository: Repository<MasterDataAsignacion>,
    @InjectRepository(MarterDataArea)
    readonly areaRepository: Repository<MarterDataArea>,
  ) {}

  private readonly tabletRelations = [
    'estadoTabletRef',
    'estadoEquipoRef',
    'areaRef',
    'colaboradorRef',
    'chipRef',
    'ubicacionRef',
  ];

  private async buildCatalogLookups(
    tablets: ModuleTablet[],
  ): Promise<TabletCatalogLookups> {
    const usuarioIds = new Set<number>();
    const ubicacionIds = new Set<number>();
    const estadoTabletIds = new Set<number>();
    const estadoEquipoIds = new Set<number>();
    const areaIds = new Set<number>();

    for (const t of tablets) {
      if (t.usuario != null) usuarioIds.add(t.usuario);
      if (t.ubicacion != null) ubicacionIds.add(t.ubicacion);
      if (t.estado_tablet != null) estadoTabletIds.add(t.estado_tablet);
      if (t.estado_equipo != null) estadoEquipoIds.add(t.estado_equipo);
      if (t.id_area != null) areaIds.add(t.id_area);
    }

    const [
      colaboradores,
      ubicaciones,
      estadosTablet,
      estadosEquipo,
      areas,
    ] = await Promise.all([
      usuarioIds.size
        ? this.colaboradorRepository.findBy({
            id_colaborador: In([...usuarioIds]),
          })
        : Promise.resolve([]),
      ubicacionIds.size
        ? this.ubicacionRepository.findBy({ id: In([...ubicacionIds]) })
        : Promise.resolve([]),
      estadoTabletIds.size
        ? this.estadoEquipoRepository.findBy({
            id_estado: In([...estadoTabletIds]),
          })
        : Promise.resolve([]),
      estadoEquipoIds.size
        ? this.asignacionRepository.findBy({
            id_asignado: In([...estadoEquipoIds]),
          })
        : Promise.resolve([]),
      areaIds.size
        ? this.areaRepository.findBy({ id_area: In([...areaIds]) })
        : Promise.resolve([]),
    ]);

    return {
      colaboradorById: new Map(
        colaboradores.map((c) => [c.id_colaborador, c.nombre_completo]),
      ),
      ubicacionById: new Map(
        ubicaciones.map((u) => [u.id, u.descripcion]),
      ),
      estadoTabletById: new Map(
        estadosTablet.map((e) => [e.id_estado, e.descripcion]),
      ),
      estadoEquipoById: new Map(
        estadosEquipo.map((a) => [a.id_asignado, a.descripcion]),
      ),
      areaById: new Map(areas.map((a) => [a.id_area, a.nombre_area])),
    };
  }

  private mapTabletToResponse(t: ModuleTablet, lookups: TabletCatalogLookups) {
    const nombreColaborador =
      t.colaboradorRef?.nombre_completo ??
      (t.usuario != null
        ? (lookups.colaboradorById.get(t.usuario) ?? null)
        : null);
    const nombreUbicacion =
      t.ubicacionRef?.descripcion ??
      (t.ubicacion != null
        ? (lookups.ubicacionById.get(t.ubicacion) ?? null)
        : null);
    const estadoTabletDesc =
      t.estadoTabletRef?.descripcion ??
      (t.estado_tablet != null
        ? (lookups.estadoTabletById.get(t.estado_tablet) ?? null)
        : null);
    const estadoEquipoDesc =
      t.estadoEquipoRef?.descripcion ??
      (t.estado_equipo != null
        ? (lookups.estadoEquipoById.get(t.estado_equipo) ?? null)
        : null);
    const areaDesc =
      t.areaRef?.nombre_area ??
      (t.id_area != null ? (lookups.areaById.get(t.id_area) ?? null) : null);

    return {
      id_tablet: t.id_tablet,
      marca: t.marca,
      modelo: t.modelo,
      imei_tablet: t.imei_tablet,
      estado_tablet: t.estado_tablet,
      estado_tablet_desc: estadoTabletDesc,
      estado_equipo: t.estado_equipo,
      estado_equipo_desc: estadoEquipoDesc,
      id_area: t.id_area,
      ticket: t.ticket,
      area_desc: areaDesc,
      usuario: t.usuario,
      usuario_desc: nombreColaborador,
      nombre_colaborador: nombreColaborador,
      num_chips: t.num_chips,
      chip_desc: t.chipRef?.numero_chip ?? t.chipRef?.iccid ?? null,
      id_ubicacion: t.ubicacion,
      ubicacion_desc: nombreUbicacion,
      nombre_ubicacion: nombreUbicacion,
      observaciones: t.observaciones,
      fecha_registro: t.fecha_registro,
      activo: t.activo,
    };
  }

  private mapDtoToTablet(
    dto: CreateModuleTabletDto | UpdateModuleTabletDto,
    partial = false,
  ): DeepPartial<ModuleTablet> {
    const mapped: DeepPartial<ModuleTablet> = {};

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
    if (dto.imei_tablet !== undefined) {
      mapped.imei_tablet = dto.imei_tablet?.trim() ?? '';
    }
    if (dto.estado_tablet !== undefined) {
      mapped.estado_tablet = dto.estado_tablet;
    }
    if (dto.estado_equipo !== undefined) {
      mapped.estado_equipo = dto.estado_equipo;
    }
    if (dto.id_area !== undefined) {
      mapped.id_area = dto.id_area;
    }
    if (dto.ticket !== undefined) {
      mapped.ticket = dto.ticket?.trim() || null;
    }
    if (dto.usuario !== undefined) {
      mapped.usuario = dto.usuario;
    }
    if (dto.ubicacion !== undefined) {
      mapped.ubicacion = dto.ubicacion;
    }
    if (dto.observaciones !== undefined) {
      mapped.observaciones = dto.observaciones?.trim() || null;
    }
    if (dto.num_chips !== undefined) {
      mapped.num_chips = dto.num_chips;
    }
    if (dto.activo !== undefined) {
      mapped.activo = dto.activo;
    }
    if (dto.fecha_registro !== undefined) {
      mapped.fecha_registro = dto.fecha_registro;
    }

    return mapped;
  }

  async findAllTablets() {
    try {
      const tablets = await this.moduleTabletRepository.find({
        relations: this.tabletRelations,
        order: { id_tablet: 'DESC' },
      });

      const lookups = await this.buildCatalogLookups(tablets);
      return tablets.map((t) => this.mapTabletToResponse(t, lookups));
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  async findAllTabletsForExcel() {
    const rows = await this.findAllTablets();
    return rows.map((t) => ({
      marca: t.marca ?? '',
      modelo: t.modelo ?? '',
      imei: t.imei_tablet ?? '',
      estado_tablet_desc: t.estado_tablet_desc ?? '',
      estado_equipo_desc: t.estado_equipo_desc ?? '',
      area_desc: t.area_desc ?? '',
      iccid: t.chip_desc ?? '',
      ubicacion_desc: t.nombre_ubicacion ?? '',
      observaciones: t.observaciones ?? '',
      ticket: t.ticket ?? '',
      activo: t.activo ? 'SI' : 'NO',
    }));
  }

  async findTabletById(id: number) {
    try {
      const tablet = await this.moduleTabletRepository.findOne({
        where: { id_tablet: id },
        relations: this.tabletRelations,
      });
      if (!tablet) {
        throw new BadRequestException('La tablet no existe o no se encontró');
      }
      const lookups = await this.buildCatalogLookups([tablet]);
      return this.mapTabletToResponse(tablet, lookups);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  async createTablet(dto: CreateModuleTabletDto) {
    try {
      const tablet = this.moduleTabletRepository.create({
        ...this.mapDtoToTablet(dto, false),
        activo: dto.activo ?? true,
        fecha_registro: dto.fecha_registro ?? new Date(),
      });

      const saved = await this.moduleTabletRepository.save(tablet);
      return this.findTabletById(saved.id_tablet as number);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  async updateTablet(id: number, dto: UpdateModuleTabletDto) {
    try {
      const tablet = await this.moduleTabletRepository.findOneBy({
        id_tablet: id,
      });

      if (!tablet) {
        throw new BadRequestException(
          'La tablet no existe o no se encontró',
        );
      }

      const patch = this.mapDtoToTablet(dto, true);
      if (Object.keys(patch).length > 0) {
        await this.moduleTabletRepository.update({ id_tablet: id }, patch);
      }

      return this.findTabletById(id);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }
}
