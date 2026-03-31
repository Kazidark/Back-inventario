import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { loginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginUserEntity } from './entity/login-user-entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entity/user.entity';
import { JwtService } from '@nestjs/jwt';
import { LoginRequestDto } from './dto/login-request.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(LoginUserEntity)
    private readonly loginUserRespository: Repository<LoginUserEntity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async postLogin(loginDto: loginDto) {
    if (!loginDto) {
      throw new BadRequestException('Login body requerido');
    }

    try {
      console.log(loginDto);
      const { email, password } = loginDto;

      //  encriptacion de  password
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = this.loginUserRespository.create({
        email,
        password: hashedPassword,
        createdAt: new Date(),
      });

      const savedUser = await this.loginUserRespository.save(user);

      return {
        data: {
          id: savedUser.id,
          email: savedUser.email,
          createdAt: savedUser.createdAt,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  async login(body: LoginRequestDto) {
    if (!body?.email || !body?.password) {
      throw new BadRequestException('Email and password are required');
    }

    try {
      const email = String(body.email).trim().toLowerCase();
      const password = String(body.password);

      // Consulta a BD usando ORM (por email). No se puede filtrar por password
      // porque está hasheado con bcrypt (usa salt).
      const user = await this.userRepository.findOne({
        where: { email },
        select: [
          'id_usuario',
          'email',
          'usuario',
          'password_hash',
          'role',
          'isActive',
          'createdAt',
        ],
      });
      if (!user) {
        throw new UnauthorizedException('Email o password incorrectos');
      }

      // Validación de password (no loguear password)
      const isValidPassword = await bcrypt.compare(
        password,
        user.password_hash,
      );
      if (!isValidPassword) {
        throw new UnauthorizedException('Email o password incorrectos');
      }

      const payload = {
        sub: user.id_usuario,
        email: user.email,
        username: user.usuario,
        role: user.role,
      };

      // No pasar `subject` aquí porque `payload` ya trae `sub`
      const token = await this.jwtService.signAsync(payload);

      return {
        id: user.id_usuario,
        email: user.email,
        username: user.usuario,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        token: token,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  async changePassword(changePasswordDto: ChangePasswordDto) {
    if (!changePasswordDto?.email || !changePasswordDto?.newPassword) {
      throw new BadRequestException('Email and new password are required');
    }

    try {
      const user = await this.userRepository.findOne({
        where: { email: changePasswordDto.email },
      });

      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      const hashedPassword = await bcrypt.hash(
        changePasswordDto.newPassword,
        10,
      );
      user.password_hash = hashedPassword;

      await this.userRepository.save(user);

      return {
        data: {
          id: user.id_usuario,
          email: user.email,
          updated: true,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }
}
