import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import {
  MarterDataArea,
  MasterDataColaborador,
  MasterDataEstadoChip,
  MasterDataOperadores,
  MasterDataTipoChip,
} from '../../master-data/entities/master-datum.entity';
import { IsOptional } from 'class-validator';

@Entity('chips')
export class EntityMoculesChips {
  @PrimaryGeneratedColumn({ name: 'id_chip', type: 'int' })
  id_chip: number;

  @IsOptional()
  @Column({ name: 'numero_chip', type: 'char', length: 9 })
  numero_chip: string;

  @Column({ name: 'iccid', type: 'varchar', length: 25 })
  iccid: string;

  @Column({ name: 'tipo_chip', type: 'int', nullable: true })
  tipo_chip: number | null;

  @ManyToOne(() => MasterDataTipoChip, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'tipo_chip', referencedColumnName: 'id_tipo_chip' })
  tipoChipRel: MasterDataTipoChip;

  @Column({ name: 'estado_chip', type: 'int' })
  estado_chip: number;

  @ManyToOne(() => MasterDataEstadoChip, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'estado_chip', referencedColumnName: 'id_estadoChip' })
  estadoChipRel: MasterDataEstadoChip;

  @Column({ name: 'operador', type: 'int' })
  operador: number;

  @ManyToOne(() => MasterDataOperadores, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'operador', referencedColumnName: 'id_operador' })
  operadorRel: MasterDataOperadores;

  @Column({ name: 'fecha_registro', type: 'datetime' })
  fecha_registro: Date;

  @Column({ name: 'activo', type: 'bit' })
  activo: boolean;

  @Column({ name: 'area', type: 'int', nullable: true })
  area: number | null;

  @ManyToOne(() => MarterDataArea, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'area', referencedColumnName: 'id_area' })
  areaRel: MarterDataArea;

  @Column({ name: 'usuario', type: 'int', nullable: true })
  usuario: number | null;

  @ManyToOne(() => MasterDataColaborador, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'usuario', referencedColumnName: 'id_colaborador' })
  colaboradorRel: MasterDataColaborador;
}
