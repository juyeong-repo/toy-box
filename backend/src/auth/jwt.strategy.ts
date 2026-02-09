import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';

/**
 * JWT 인증 전략 (Passport)
 * - Authorization 헤더의 Bearer 토큰에서 JWT를 추출
 * - 토큰 검증 후 payload의 사용자 ID로 실제 사용자를 DB에서 조회
 * - 유효한 사용자인 경우 request.user에 사용자 객체를 설정
 *
 * 왜 매 요청마다 DB 조회를 하는가?
 * - 토큰 발급 후 사용자가 삭제되었거나 비활성화된 경우를 감지하기 위함
 * - 토큰만으로는 현재 사용자 상태를 알 수 없으므로 DB 조회가 필요
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'kanban-jwt-secret-key',
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.authService.validateUser(payload.sub);
    if (!user) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
    return user;
  }
}
