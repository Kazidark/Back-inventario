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

@Injectable()
export class ModuleModemsService {
  constructor(
    @InjectRepository(EntityMoculesModems)
    readonly moduleModemsRepository: Repository<EntityMoculesModems>,
    @InjectRepository(EntityMoculesChips)
    readonly moduleChipsRepository: Repository<EntityMoculesChips>,
  ) {}

  async create(createModuleModemDto: CreateModuleModemDto) {
    try {
      // console.log(createModuleModemDto);

      const modemData: DeepPartial<EntityMoculesModems> = {
        marca: createModuleModemDto.marca,
        modelo: createModuleModemDto.modelo,
        imei_modem: createModuleModemDto.imei_modem,
        estado_modem: createModuleModemDto.estado_modem,
        estado_equipo: createModuleModemDto.estado_equipo,
        id_area: createModuleModemDto.id_area,
        usuario: createModuleModemDto.usuario,
        num_Chip: createModuleModemDto.id_chip,
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
      const modems = await this.moduleModemsRepository.find({
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
      });

      return modems.map((m) => ({
        id_modem: m.id_modem,
        marca: m.marca,
        modelo: m.modelo,
        imei_modem: m.imei_modem,
        estado_modem: m.estado_modem,
        estado_modem_desc: m.estadoModemRef?.descripcion ?? null,
        estado_equipo: m.estado_equipo,
        estado_equipo_desc: m.estadoEquipoRef?.descripcion ?? null,
        id_area: m.id_area,
        area_desc: m.areaRef?.nombre_area ?? null,
        usuario: m.usuario,
        usuario_desc: m.colaboradorRef?.nombre_completo ?? null,
        num_Chip: m.num_Chip,
        chip_desc: m.chipsRef?.numero_chip ?? null,
        fecha_registro: m.fecha_registro,
        activo: m.activo,
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
      if (modem) {
        const buscarModen = await this.moduleModemsRepository.merge(
          modem,
          updateModuleModemDto as DeepPartial<EntityMoculesModems>,
        );
        // console.log(buscarModen);
        const cambbiarEstadoChip = buscarModen.num_Chip;
        if (cambbiarEstadoChip) {
          await this.moduleChipsRepository.update(cambbiarEstadoChip, {
            activo: false,
          });
        } else {
          throw new BadRequestException('El chip no existe');
        }
        return await this.moduleModemsRepository.save(buscarModen);
      } else {
        throw new BadRequestException('El modem no existe o no se encontro');
      }
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }
}
