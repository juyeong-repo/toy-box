import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/postgresql';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

/**
 * 인증 서비스
 * - 회원가입: 이메일 중복 검사 후 비밀번호를 bcrypt로 해시하여 저장
 * - 로그인: 이메일/비밀번호 검증 후 JWT 토큰 발급
 * - JWT 토큰에는 사용자 ID와 이메일을 포함하여 이후 요청에서 사용자 식별에 활용
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly em: EntityManager,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 회원가입 처리
   * 1. 동일 이메일로 가입된 사용자가 있는지 확인
   * 2. 비밀번호를 bcrypt로 해시 (salt rounds: 10)
   * 3. 새 사용자를 생성하고 데이터베이스에 저장
   * 4. JWT 토큰을 발급하여 즉시 로그인 상태로 전환
   */
  async signup(dto: SignupDto) {
    const existing = await this.em.findOne(User, { email: dto.email });
    if (existing) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.em.create(User, {
      email: dto.email,
      name: dto.name,
      password: hashedPassword,
    });
    await this.em.persistAndFlush(user);

    return this.generateToken(user);
  }

  /**
   * 로그인 처리
   * 1. 이메일로 사용자를 조회
   * 2. bcrypt.compare로 비밀번호 일치 여부 확인
   * 3. 인증 성공 시 JWT 토큰 발급
   *
   * 보안: 이메일이 존재하지 않는 경우와 비밀번호가 틀린 경우
   * 동일한 오류 메시지를 반환하여 이메일 존재 여부 노출을 방지
   */
  async login(dto: LoginDto) {
    const user = await this.em.findOne(User, { email: dto.email });
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    return this.generateToken(user);
  }

  /** 사용자 정보를 기반으로 JWT 토큰 생성 */
  private generateToken(user: User) {
    // JWT payload에 사용자 식별 정보를 포함
    // sub: JWT 표준 클레임으로 사용자 ID를 사용
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  /** JWT 토큰의 사용자 ID로 사용자 정보 조회 */
  async validateUser(userId: string): Promise<User | null> {
    return this.em.findOne(User, { id: userId });
  }
}
