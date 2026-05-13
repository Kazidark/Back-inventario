import {
  BadRequestException,
  Body,
  Controller,
  HttpException,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { loginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyRecoveryCodeDto } from './dto/verify-recovery-code.dto';
import { ResetPasswordWithCodeDto } from './dto/reset-password-with-code.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * aqui genero el  login  controller
   */
  @Post('create-login')
  @HttpCode(HttpStatus.CREATED)
  async createLogin(@Body() body: loginDto) {
     console.log(body)
    try {
      if (!body.email || !body.password) {
        throw new BadRequestException('Email and password are required');
      } else {
        return this.authService.postLogin(body);
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginRequestDto) {
    try {
      if (!body.email || !body.password) {
        throw new BadRequestException('Email and password are required');
      }
      // Traza del request (no imprime password)
      // console.log('[BACK][AUTH][POST /api/auth/login] body:', {
      //   email: body.email,
      // });
      return this.authService.login(body);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async me(@Req() req: { user?: unknown }) {
    return { data: req.user };
  }

  // cambio contraseña controller
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@Body() body: ChangePasswordDto) {
    try {
      if (!body.email || !body.newPassword) {
        throw new BadRequestException('Email and new password are required');
      } else {
        return this.authService.changePassword(body);
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    try {
      return await this.authService.forgotPassword(body);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  @Post('verify-recovery-code')
  @HttpCode(HttpStatus.OK)
  async verifyRecoveryCode(@Body() body: VerifyRecoveryCodeDto) {
    try {
      return await this.authService.verifyRecoveryCode(body);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: ResetPasswordWithCodeDto) {
    try {
      return await this.authService.resetPasswordWithCode(body);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error inesperado',
      );
    }
  }
}
