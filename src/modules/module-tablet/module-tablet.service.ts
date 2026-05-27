import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { ModuleTablet } from './entities/module-tablet.entity';
import { CreateModuleTabletDto } from './dto/create-module-tablet.dto';
import { UpdateModuleTabletDto } from './dto/update-module-tablet.dto';
import { EntityMoculesChips } from '../module-chips/entities/module-chip.entity';

@Injectable()
export class ModuleTabletService {
  constructor(
    @InjectRepository(ModuleTablet)
    readonly moduleTabletRepository: Repository<ModuleTablet>,
    @InjectRepository(EntityMoculesChips)
    readonly moduleChipsRepository: Repository<EntityMoculesChips>,
  ) {}

  private readonly tabletRelations = [
    'estadoTabletRef',
    'estadoEquipoRef',
    'areaRef',
    'colaboradorRef',
    'chipRef',
  ];

  async findAllTablets() {
    try {
      const tablets = await this.moduleTabletRepository.find({
        relations: this.tabletRelations,
        order: { id_tablet: 'DESC' },
      });

      return tablets.map((t) => ({
        id_tablet: t.id_tablet,
        marca: t.marca,
        modelo: t.modelo,
        imei_tablet: t.imei_tablet,
        estado_tablet: t.estado_tablet,
        estado_tablet_desc: t.estadoTabletRef?.descripcion ?? null,
        estado_equipo: t.estado_equipo,
        estado_equipo_desc: t.estadoEquipoRef?.descripcion ?? null,
        id_area: t.id_area,
        ticket:t.ticket,
        area_desc: t.areaRef?.nombre_area ?? null,
        usuario: t.usuario,
        usuario_desc: t.colaboradorRef?.nombre_completo ?? null,
        num_chips: t.num_chips,
        chip_desc: t.chipRef?.numero_chip ?? null,
        ubicacion: t.ubicacion,
        observaciones: t.observaciones,
        fecha_registro: t.fecha_registro,
        activo: t.activo,
      }));

      
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  async findTabletById(id: number) {
    try {
      return await this.moduleTabletRepository.findOneBy({
        id_tablet: id,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  async createTablet(dto: CreateModuleTabletDto) {
    try {
      const tablet = this.moduleTabletRepository.create({
        ...dto,
        activo: dto.activo ?? true,
        fecha_registro: dto.fecha_registro ?? new Date(),
      });

      
        /**
       * actualizo el valor de  activo
       */
        // const cambioChip = tablet.num_chips;
        // if (cambioChip) {
        //   await this.moduleChipsRepository.update(cambioChip, { activo: false });
        // } else {
        //   throw new BadRequestException('El chip no existe');
        // }
      return await this.moduleTabletRepository.save(tablet);
    } catch (error) {
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

      const merged = this.moduleTabletRepository.merge(
        tablet,
        dto as DeepPartial<ModuleTablet>,
      );

      return await this.moduleTabletRepository.save(merged);
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
