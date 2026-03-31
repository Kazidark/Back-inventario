import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'usuarios', schema: 'dbo' })
export class User {
  @PrimaryGeneratedColumn({ name: 'id_usuario' })
  id_usuario: number;

  @Column({ name: 'usuario', length: 100 })
  usuario: string;

  @Column({ name: 'password_hash', length: 255 })
  password_hash: string;

  @Column({ name: 'email', length: 150 })
  email: string;

  @Column({ name: 'rol', length: 50 })
  role: string;

  @Column({ name: 'activo', type: 'bit', default: true })
  isActive: boolean;

  @Column({ name: 'fecha_creacion', type: 'datetime', nullable: true })
  createdAt: Date | null;
}
