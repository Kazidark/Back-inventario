import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  MarterDataArea,
  MasterDataAsignacion,
  MasterDataColaborador,
  MasterDataEstadoEquipo,
} from '../../master-data/entities/master-datum.entity';
import { EntityMoculesChips } from 'src/modules/module-chips/entities/module-chip.entity';
import { IsOptional } from 'class-validator';

@Entity('modems')
export class EntityMoculesModems {
  @PrimaryGeneratedColumn({ name: 'id_modem', type: 'int' })
  id_modem?: number;


  @IsOptional()
  @Column({ name: 'marca', type: 'varchar', nullable: true })
  marca?: string | null;

  @IsOptional()
  @Column({ name: 'modelo', type: 'varchar', nullable: true })
  modelo?: string | null;

  @IsOptional()
  @Column({ name: 'imei_modem', type: 'varchar', nullable: true })
  imei_modem?: string | null;

  @Column({ name: 'estado_modem', type: 'int', nullable: true })
  estado_modem?: number | null;

  @Column({ name: 'estado_equipo', type: 'int', nullable: true })
  estado_equipo?: number | null;

  @Column({ name: 'id_area', type: 'int', nullable: true })
  id_area?: number | null;

  @Column({ name: 'ticket', type: 'varchar', nullable: true })
  ticket?: string | null;

  @Column({ name: 'usuario', type: 'int', nullable: true })
  usuario?: number | null;

  @Column({ name: 'num_Chip', type: 'int', nullable: true })
  num_Chip?: number | null;

  @Column({ name: 'fecha_registro', type: 'datetime' })
  fecha_registro?: Date;

  @Column({ name: 'activo', type: 'bit' })
  activo?: boolean | null;

  /*
   * RELACIONES DE  TABLAS MAESTROS
   */

  @ManyToOne(() => MasterDataEstadoEquipo, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'estado_modem', referencedColumnName: 'id_estado' })
  estadoModemRef?: MasterDataEstadoEquipo;

  @ManyToOne(() => MasterDataAsignacion, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'estado_equipo', referencedColumnName: 'id_asignado' })
  estadoEquipoRef?: MasterDataAsignacion;

  @ManyToOne(() => MarterDataArea, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'id_area', referencedColumnName: 'id_area' })
  areaRef?: MarterDataArea;

  @ManyToOne(() => MasterDataColaborador, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'usuario', referencedColumnName: 'id_colaborador' })
  colaboradorRef?: MasterDataColaborador;

  @ManyToOne(() => EntityMoculesChips, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'num_Chip', referencedColumnName: 'id_chip' })
  chipsRef?: EntityMoculesChips;
}
