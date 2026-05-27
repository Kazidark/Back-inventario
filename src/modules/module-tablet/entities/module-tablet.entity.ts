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
import { EntityMoculesChips } from '../../module-chips/entities/module-chip.entity';

@Entity('tablets')
export class ModuleTablet {
  @PrimaryGeneratedColumn({ name: 'id_tablet', type: 'int' })
  id_tablet?: number;

  @Column({ name: 'marca', type: 'varchar', length: 50 })
  marca?: string;

  @Column({ name: 'modelo', type: 'varchar', length: 80 })
  modelo?: string;

  @Column({ name: 'imei_tablet', type: 'varchar', length: 50 })
  imei_tablet?: string;

  @Column({ name: 'estado_tablet', type: 'int', nullable: true })
  estado_tablet?: number | null;

  @Column({ name: 'estado_equipo', type: 'int', nullable: true })
  estado_equipo?: number | null;

  @Column({ name: 'id_area', type: 'int', nullable: true })
  id_area?: number | null;

  @Column({ name: 'ticket', type: 'varchar', nullable: true })
  ticket?: string | null;

  @Column({ name: 'usuario', type: 'int', nullable: true })
  usuario?: number | null;

  @Column({ name: 'num_chips', type: 'int', nullable: true })
  num_chips?: number | null;

  @Column({ name: 'ubicacion', type: 'varchar', length: 100, nullable: true })
  ubicacion?: string | null;

  @Column({
    name: 'observaciones',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  observaciones?: string | null;

  @Column({ name: 'fecha_registro', type: 'datetime', nullable: true })
  fecha_registro?: Date | null;

  @Column({ name: 'activo', type: 'bit', nullable: true })
  activo?: boolean | null;

  @ManyToOne(() => MasterDataEstadoEquipo, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'estado_tablet', referencedColumnName: 'id_estado' })
  estadoTabletRef?: MasterDataEstadoEquipo;

  @ManyToOne(() => MasterDataAsignacion, {
    createForeignKeyConstraints: false,
  })
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
  @JoinColumn({ name: 'num_chips', referencedColumnName: 'id_chip' })
  chipRef?: EntityMoculesChips;
}
