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
} from '../../../master-data/entities/master-datum.entity';

@Entity('pcs_laptops')
export class Lapto {
  @PrimaryGeneratedColumn({ name: 'id_pc', type: 'int' })
  id_pc: number;

  @Column({ name: 'tipo_equipo', type: 'varchar', length: 50 })
  tipo_equipo: string;

  @Column({ name: 'marca', type: 'varchar', length: 50 })
  marca: string;

  @Column({ name: 'modelo', type: 'varchar', length: 50 })
  modelo: string;

  @Column({ name: 'serie', type: 'varchar', length: 60 })
  serie: string;

  @Column({ name: 'estado_equipo', type: 'int', nullable: true })
  estado_equipo: number | null;

  @Column({ name: 'estado_pc', type: 'int', nullable: true })
  estado_pc: number | null;

  @Column({ name: 'id_area', type: 'int', nullable: true })
  id_area: number | null;

  @Column({ name: 'usuario', type: 'int', nullable: true })
  usuario: number | null;

  @Column({ name: 'ubicacion', type: 'int', nullable: true })
  ubicacion: number | null;

  @Column({
    name: 'observaciones',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  observaciones: string | null;

  @Column({ name: 'fecha_registro', type: 'datetime' })
  fecha_registro: Date;

  @Column({ name: 'activo', type: 'bit' })
  activo: boolean;

  @Column({ name: 'anexo', type: 'int', nullable: true })
  anexo: number | null;

  @ManyToOne(() => MasterDataEstadoEquipo, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'estado_pc', referencedColumnName: 'id_estado' })
  estadoPcRef?: MasterDataEstadoEquipo;

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

  @ManyToOne(() => MasterDataUbicacion, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'ubicacion', referencedColumnName: 'id' })
  ubicacionRef?: MasterDataUbicacion;
}
