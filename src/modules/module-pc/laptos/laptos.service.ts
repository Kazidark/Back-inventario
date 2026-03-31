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
  ];

  async findAllPc() {
    try {
      const pcs = await this.pcRepository.find({
        relations: this.pcRelations,
        order: { id_pc: 'DESC' },
      });

      return pcs.map((p) => ({
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
        nombre_area: p.areaRef?.nombre_area ?? null,
        usuario: p.usuario,
        nombre_colaborador: p.colaboradorRef?.nombre_completo ?? null,
        ubicacion: p.ubicacion,
        observaciones: p.observaciones,
        fecha_registro: p.fecha_registro,
        activo: p.activo,
        anexo: p.anexo,
      }));
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  async findPcById(id: number) {
    try {
      return await this.pcRepository.findOneBy({ id_pc: id });
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  async createPc(dto: CreateLaptoDto) {
    try {
      const pc = this.pcRepository.create({
        ...dto,
        activo: dto.activo ?? true,
        fecha_registro: dto.fecha_registro ?? new Date(),
      });
      return await this.pcRepository.save(pc);
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

      const merged = this.pcRepository.merge(
        pc,
        dto as DeepPartial<Lapto>,
      );

      return await this.pcRepository.save(merged);
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
