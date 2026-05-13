import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoginUserEntity } from './entity/login-user-entity';
import { User } from '../users/entity/user.entity';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoginUserEntity, User]),
    PassportModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'dev-secret-change-me',
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') ?? '8h') as any,
        },
      }),
    }),

    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host:
            config.get<string>('MAIL_HOST') ??
            config.get<string>('SMTP_HOST', 'smtp.gmail.com'),
          port: Number(
            config.get<string>('MAIL_PORT') ??
              config.get<string>('SMTP_PORT', '587'),
          ),
          secure:
            config.get<string>('MAIL_SECURE') === 'true' ||
            config.get<string>('SMTP_SECURE') === 'true',
          auth: {
            user:
              config.get<string>('MAIL_USER') ??
              config.get<string>('SMTP_USER', ''),
            pass:
              config.get<string>('MAIL_PASSWORD') ??
              config.get<string>('SMTP_PASS', ''),
          },
        },
        defaults: {
          from:
            config.get<string>('MAIL_FROM') ??
            '"Sistema Inventario" <no-reply@inventario.com>',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
})
export class AuthModule { }
