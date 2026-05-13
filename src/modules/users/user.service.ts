import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entity/user.entity';
import { FormDate } from 'src/utils/ultil.fomate';
import { CreateUserDto } from './dto/create-users.dto';
import * as bcrypt from 'bcrypt';

/** Valores de `usuarios.rol` según `TBLM_permiso.id_permisos` (ajusta si tu maestro difiere). */
const ROL_NOMBRE_A_ID: Record<string, number> = {
  administrador: 1,
  usuario: 2,
};

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async AllgetUsers() {
    try {
      const users = await this.userRepository.find({
        relations: ['role'],
      });

      const usersResponse = users.map((user) => ({
        ...user,
        role: user.role?.nombre_permisos ?? null,
        descripcion_rol: user.role?.descripcion ?? null,
        created_at: FormDate(user?.createdAt),
      }));

      return usersResponse;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async createUser(dto: CreateUserDto) {
    const email = String(dto.email).trim().toLowerCase();
    const usuario = String(dto.usuario).trim();
    const roleKey = String(dto.rol).trim().toLowerCase();
    const roleId = ROL_NOMBRE_A_ID[roleKey] ?? 2;

    const existeCorreo = await this.userRepository.exists({
      where: { email },
    });
    if (existeCorreo) {
      throw new ConflictException('El correo ya está registrado');
    }

    try {
      const password_hash = await bcrypt.hash(dto.password, 10);
      const entity = this.userRepository.create({
        usuario,
        email,
        password_hash,
        roleId,
        isActive: true,
        createdAt: new Date(),
      });
      const saved = await this.userRepository.save(entity);

      return {
        message: 'Usuario creado correctamente',
        data: {
          id_usuario: saved.id_usuario,
          usuario: saved.usuario,
          email: saved.email,
          roleId: saved.roleId,
          isActive: saved.isActive,
          createdAt: saved.createdAt,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error al crear usuario',
      );
    }
  }
}
