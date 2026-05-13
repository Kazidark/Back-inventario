import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('colaboradores')
export class EntityMoculesColaborador {
  @PrimaryGeneratedColumn({ name: 'id_colaborador', type: 'int' })
  id_colaborador?: number;

  @Column({ name: 'nombre_completo', type: 'varchar', length: 120 })
  nombre_completo: string;

  @Column({ name: 'documento', type: 'varchar', length: 50, nullable: true })
  documento?: string | null;

  @Column({ name: 'email', type: 'varchar', length: 150 })
  email: string;

  @Column({ name: 'activo', type: 'int'})
  activo?:number;

  @Column({ name: 'fecha_creacion', type: 'datetime' })
  fecha_creacion: Date;
}
