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
        numero_chip_desc: c.chipRef?.numero_chip ?? null,
        fecha_registro: c.fecha_registro,
        activo: c.activo,
      }));

      
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  async findCelularById(id: number) {
    try {
      return await this.moduleCelularesRepository.findOneBy({
        id_celular: id,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  async createCelular(dto: CreateModuleCelulareDto) {
    try {
      const celular = this.moduleCelularesRepository.create({
        ...dto,
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

      const merged = this.moduleCelularesRepository.merge(
        celular,
        dto as DeepPartial<ModuleCelulare>,
      );

      return await this.moduleCelularesRepository.save(merged);
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
