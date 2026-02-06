import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT 인증 가드
 * - @UseGuards(JwtAuthGuard) 데코레이터로 컨트롤러/라우트에 적용
 * - JwtStrategy를 통해 토큰 검증을 수행
 * - 인증 실패 시 자동으로 401 Unauthorized 응답 반환
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
