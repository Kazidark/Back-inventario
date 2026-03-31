import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('areas')
export class MarterDataArea {
  @PrimaryGeneratedColumn()
  id_area: number;
  @Column()
  nombre_area: string;
  @Column()
  activo: number;
}

@Entity('TBLM_estados_equipo')
export class MasterDataEstadoEquipo {
  @PrimaryGeneratedColumn()
  id_estado: number;
  @Column()
  descripcion: string;
}

@Entity('colaboradores')
export class MasterDataColaborador {
  @PrimaryGeneratedColumn()
  id_colaborador: number;
  @Column()
  nombre_completo: string;
}

@Entity('TBLM_asignacion')
export class MasterDataAsignacion {
  @PrimaryGeneratedColumn()
  id_asignado: number;
  @Column()
  descripcion: string;
}

@Entity({ name: 'TBLM_operadores_Moviles', schema: 'dbo' })
export class MasterDataOperadores {
  @PrimaryColumn({ name: 'id_operator' })
  id_operador: number;
  @Column({ name: 'nombre_operador' })
  nombre_operador: string;
}


@Entity({ name: 'TBLM_etado_chip', schema: 'dbo' })
export class MasterDataEstadoChip {
  @PrimaryColumn({ name: 'id_estadoChip' })
  id_estadoChip: number;
  @Column({ name: 'nombreChips' })
  nombreChips: string;
}

@Entity({ name: 'TBLM_tipo_chip', schema: 'dbo' })
export class MasterDataTipoChip {
  @PrimaryColumn({ name: 'id_tipo_chip' })
  id_tipo_chip: number;
  @Column({ name: 'descripcion_tipo_chip' })
  descripcion_tipo_chip: string;
}

@Entity('tipo_equipo')
export class MasterDataTipoEquipo {
  @PrimaryGeneratedColumn({ name: 'id_tipo_equipo' })
  id_tipo_equipo: number;
  @Column({ name: 'nombre_tipo_equipo' })
  nombre_tipo_equipo: string;
}