import { MasterDataRole } from 'src/modules/master-data/entities/master-datum.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column({ name: 'rol', type: 'int' })
  roleId: number;

   @ManyToOne(()=> MasterDataRole)
   @JoinColumn ({name:'rol'})
   role: MasterDataRole;

  @Column({ name: 'activo', type: 'bit', default: true })
  isActive: boolean;

  @Column({ name: 'fecha_creacion', type: 'datetime', nullable: true })
  createdAt: Date | null;

  @Column({
    name: 'password_reset_code_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  passwordResetCodeHash: string | null;

  @Column({
    name: 'password_reset_expires_at',
    type: 'datetime',
    nullable: true,
  })
  passwordResetExpiresAt: Date | null;
}


