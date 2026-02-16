import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { User } from './user.entity';
import { User as SharedUser, AuthResponse } from '../../../shared/types';

/**
 * 인증 컨트롤러
 * - POST /auth/signup: 회원가입
 * - POST /auth/login: 로그인
 * - GET /auth/me: 현재 로그인한 사용자 정보 조회 (JWT 인증 필요)
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto): Promise<AuthResponse> {
    return this.authService.signup(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  /**
   * 현재 로그인한 사용자의 정보를 반환
   * - 프론트엔드에서 페이지 새로고침 시 JWT 토큰으로 사용자 상태를 복원하기 위해 사용
   * - JwtAuthGuard가 토큰을 검증하고, request.user에 사용자 객체를 설정
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: User): Promise<SharedUser> {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}
