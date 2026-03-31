import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * SECTION : APUNTO AL NOMBRE DE  LA  BASE DE DATOS Y  LE AGREGO ESTO 
|
 */
@Entity('loginUsers')
export class LoginUserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @CreateDateColumn()
  createdAt: Date;
}
