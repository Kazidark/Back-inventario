import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { loginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginUserEntity } from './entity/login-user-entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entity/user.entity';
import { JwtService } from '@nestjs/jwt';
import { LoginRequestDto } from './dto/login-request.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyRecoveryCodeDto } from './dto/verify-recovery-code.dto';
import { ResetPasswordWithCodeDto } from './dto/reset-password-with-code.dto';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(LoginUserEntity)
    private readonly loginUserRespository: Repository<LoginUserEntity>,
    private readonly mailerService: MailerService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  private getResetCodeTtlMinutes(): number {
    const n = Number(
      this.config.get<string>('PASSWORD_RESET_CODE_TTL_MINUTES') ?? '60',
    );
    if (Number.isNaN(n)) return 60;
    return Math.min(24 * 60, Math.max(5, n));
  }

  private async findUserForRecovery(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      select: [
        'id_usuario',
        'email',
        'usuario',
        'password_hash',
        'roleId',
        'isActive',
        'createdAt',
        'passwordResetCodeHash',
        'passwordResetExpiresAt',
      ],
    });
  }

  /** Mismo mensaje si falta usuario, código o expiración (evita filtrar correos). */
  private async assertValidRecoveryCode(
    user: User | null,
    code: string,
  ): Promise<void> {
    const normalized = String(code).trim();
    if (!user?.passwordResetCodeHash || !user.passwordResetExpiresAt) {
      throw new BadRequestException('Código incorrecto o expirado.');
    }
    if (new Date() > new Date(user.passwordResetExpiresAt)) {
      throw new BadRequestException('Código incorrecto o expirado.');
    }
    const ok = await bcrypt.compare(normalized, user.passwordResetCodeHash);
    if (!ok) {
      throw new BadRequestException('Código incorrecto o expirado.');
    }
  }

  async postLogin(loginDto: loginDto) {
    if (!loginDto) {
      throw new BadRequestException('Login body requerido');
    }

    try {
      const { email, password } = loginDto;
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = this.userRepository.create({
        email,
        usuario: 'admin123',
        password_hash: hashedPassword,
        roleId: 2,
        isActive: true,
        createdAt: new Date(),
      });

      const savedUser = await this.userRepository.save(user);

      return {
        data: {
          id: savedUser.id_usuario,
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

      const user = await this.userRepository.findOne({
        where: { email },
        select: [
          'id_usuario',
          'email',
          'usuario',
          'password_hash',
          'roleId',
          'isActive',
          'createdAt',
        ],
      });

      if (!user) {
        throw new UnauthorizedException('Email o password incorrectos');
      }

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
        roleId: user.roleId,
      };

      const token = await this.jwtService.signAsync(payload);

      return {
        id: user.id_usuario,
        email: user.email,
        username: user.usuario,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        token: token,
        roles: user.roleId,
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

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = String(dto.email).trim().toLowerCase();
    const genericMessage =
      'Si tu correo está registrado, recibirás un código de recuperación.';

    try {
      const user = await this.findUserForRecovery(email);
      const ttlMin = this.getResetCodeTtlMinutes();

      if (user) {
        const codigoRecuperacion = Math.floor(
          100000 + Math.random() * 900000,
        ).toString();
        user.passwordResetCodeHash = await bcrypt.hash(
          codigoRecuperacion,
          10,
        );
        user.passwordResetExpiresAt = new Date(
          Date.now() + ttlMin * 60_000,
        );
        await this.userRepository.save(user);

        await this.mailerService.sendMail({
          to: email,
          subject: 'Código de recuperación - Inventario',
          text: `Tu código de recuperación es: ${codigoRecuperacion}\nVálido por ${ttlMin} minutos.`,
          html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                  <h2>Recuperación de contraseña</h2>
                  <p>Tu código de verificación es:</p>
                  <div style="background: #f0f0f0; padding: 10px; font-size: 24px; text-align: center; font-weight: bold;">
                    ${codigoRecuperacion}
                  </div>
                  <p>Este código expira en ${ttlMin} minutos.</p>
                  <p>Si no solicitaste esto, ignora este mensaje.</p>
                </div>
              `,
        });
      }

      return {
        data: {
          message: genericMessage,
          expiresInMinutes: ttlMin,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error en el servidor',
      );
    }
  }

  async verifyRecoveryCode(dto: VerifyRecoveryCodeDto) {
    const email = String(dto.email).trim().toLowerCase();
    try {
      const user = await this.findUserForRecovery(email);
      await this.assertValidRecoveryCode(user, dto.code);
      return {
        success: true,
        message: 'Código válido. Puedes establecer tu nueva contraseña.',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error en el servidor',
      );
    }
  }

  async resetPasswordWithCode(dto: ResetPasswordWithCodeDto) {
    const email = String(dto.email).trim().toLowerCase();
    try {
      const user = await this.findUserForRecovery(email);
      await this.assertValidRecoveryCode(user, dto.code);
      if (!user) {
        throw new BadRequestException('Código incorrecto o expirado.');
      }

      user.password_hash = await bcrypt.hash(dto.newPassword, 10);
      user.passwordResetCodeHash = null;
      user.passwordResetExpiresAt = null;
      await this.userRepository.save(user);

      return {
        success: true,
        message: 'Contraseña actualizada. Ya puedes iniciar sesión.',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error en el servidor',
      );
    }
  }
}
