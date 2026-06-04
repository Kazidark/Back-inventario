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
  MasterDataUbicacion,
} from '../../master-data/entities/master-datum.entity';

@Entity('monitores')
export class ModuleMonitore {
  @PrimaryGeneratedColumn({ name: 'id_monitor', type: 'int' })
  id_monitor?: number;

  @Column({ name: 'serie', type: 'varchar', length: 60 })
  serie?: string;

  @Column({ name: 'marca', type: 'varchar', length: 50 })
  marca?: string;

  @Column({ name: 'modelo', type: 'varchar', length: 50 })
  modelo?: string;

  @Column({ name: 'estado_monitor', type: 'int', nullable: true })
  estado_monitor?: number | null;

  @Column({ name: 'status_monitor', type: 'int', nullable: true })
  status_monitor?: number | null;

  @Column({ name: 'id_area', type: 'int', nullable: true })
  id_area?: number | null;

  
  @Column({ name: 'ticket', type: 'varchar', nullable: true })
  ticket?: string | null;

  
  @Column({ name: 'usuario', type: 'int', nullable: true })
  usuario?: number | null;

  @Column({ name: 'ubicacion', type: 'int', nullable: true })
  ubicacion?: number | null;

  @Column({
    name: 'observaciones',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  observaciones?: string | null;

  @Column({ name: 'activo', type: 'bit' })
  activo?: boolean;

  @Column({ name: 'fecha_registro', type: 'datetime' })
  fecha_registro?: Date;

  @Column({ name: 'anexo', type: 'int', nullable: true })
  anexo?: number | null;

  @ManyToOne(() => MasterDataEstadoEquipo, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'estado_monitor', referencedColumnName: 'id_estado' })
  estadoMonitorRef?: MasterDataEstadoEquipo;

  @ManyToOne(() => MasterDataAsignacion, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'status_monitor', referencedColumnName: 'id_asignado' })
  statusMonitorRef?: MasterDataAsignacion;

  @ManyToOne(() => MarterDataArea, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'id_area', referencedColumnName: 'id_area' })
  areaRef?: MarterDataArea;

  @ManyToOne(() => MasterDataColaborador, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'usuario', referencedColumnName: 'id_colaborador' })
  colaboradorRef?: MasterDataColaborador;

  @ManyToOne(() => MasterDataUbicacion, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'ubicacion', referencedColumnName: 'id' })
  ubicacionRef?: MasterDataUbicacion;
}
