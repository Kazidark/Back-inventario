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

@Entity('celulares')
export class ModuleCelulare {
  @PrimaryGeneratedColumn({ name: 'id_celular', type: 'int' })
  id_celular: number;

  @Column({ name: 'marca', type: 'varchar', length: 50 })
  marca: string;

  @Column({ name: 'modelo', type: 'varchar', length: 50 })
  modelo: string;

  @Column({ name: 'imei_celular', type: 'varchar', length: 25 })
  imei_celular: string;

  @Column({ name: 'estado_celular', type: 'int', nullable: true })
  estado_celular: number | null;

  @Column({ name: 'estado_equipo', type: 'int', nullable: true })
  estado_equipo: number | null;

  @Column({ name: 'id_area', type: 'int', nullable: true })
  id_area: number | null;

  @Column({ name: 'usuario', type: 'int', nullable: true })
  usuario: number | null;

  @Column({ name: 'numero_chip', type: 'int', nullable: true })
  numero_chip: number | null;

  @Column({ name: 'fecha_registro', type: 'datetime' })
  fecha_registro: Date;

  @Column({ name: 'activo', type: 'bit' })
  activo: boolean;

  @ManyToOne(() => MasterDataEstadoEquipo, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'estado_celular', referencedColumnName: 'id_estado' })
  estadoCelularRef?: MasterDataEstadoEquipo;

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
  @JoinColumn({ name: 'numero_chip', referencedColumnName: 'id_chip' })
  chipRef?: EntityMoculesChips;
}
