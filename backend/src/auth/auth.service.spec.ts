import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/postgresql';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from './user.entity';

/**
 * AuthService 단위 테스트
 * - 회원가입, 로그인, 사용자 검증 로직을 테스트
 * - EntityManager와 JwtService를 모킹하여 외부 의존성 격리
 */
describe('AuthService', () => {
  let service: AuthService;
  let em: jest.Mocked<EntityManager>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockEm = {
      findOne: jest.fn(),
      create: jest.fn(),
      persistAndFlush: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn().mockReturnValue('test-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: EntityManager, useValue: mockEm },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    em = module.get(EntityManager);
    jwtService = module.get(JwtService);
  });

  describe('signup', () => {
    it('새로운 사용자가 정상적으로 회원가입되면 JWT 토큰과 사용자 정보를 반환한다.', async () => {
      // 동일 이메일의 기존 사용자가 없는 경우
      em.findOne.mockResolvedValue(null);
      em.create.mockReturnValue({
        id: 'test-id',
        email: 'test@example.com',
        name: '테스트',
        password: 'hashed',
      } as User);

      const result = await service.signup({
        email: 'test@example.com',
        name: '테스트',
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken', 'test-jwt-token');
      expect(result.user).toEqual({
        id: 'test-id',
        email: 'test@example.com',
        name: '테스트',
      });
      expect(em.persistAndFlush).toHaveBeenCalled();
    });

    it('이미 가입된 이메일로 회원가입 시 ConflictException이 발생한다.', async () => {
      // 동일 이메일의 기존 사용자가 존재하는 경우
      em.findOne.mockResolvedValue({ id: 'existing-id' } as User);

      await expect(
        service.signup({
          email: 'test@example.com',
          name: '테스트',
          password: 'password123',
        }),
      ).rejects.toThrow('이미 가입된 이메일입니다.');
    });
  });

  describe('login', () => {
    it('올바른 이메일과 비밀번호로 로그인하면 JWT 토큰을 반환한다.', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      em.findOne.mockResolvedValue({
        id: 'test-id',
        email: 'test@example.com',
        name: '테스트',
        password: hashedPassword,
      } as User);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken', 'test-jwt-token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('존재하지 않는 이메일로 로그인 시 UnauthorizedException이 발생한다.', async () => {
      em.findOne.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow('이메일 또는 비밀번호가 올바르지 않습니다.');
    });

    it('잘못된 비밀번호로 로그인 시 UnauthorizedException이 발생한다.', async () => {
      const hashedPassword = await bcrypt.hash('correct-password', 10);
      em.findOne.mockResolvedValue({
        id: 'test-id',
        email: 'test@example.com',
        name: '테스트',
        password: hashedPassword,
      } as User);

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow('이메일 또는 비밀번호가 올바르지 않습니다.');
    });
  });

  describe('validateUser', () => {
    it('유효한 사용자 ID로 조회하면 사용자 객체를 반환한다.', async () => {
      const user = { id: 'test-id', email: 'test@example.com' } as User;
      em.findOne.mockResolvedValue(user);

      const result = await service.validateUser('test-id');
      expect(result).toEqual(user);
    });

    it('존재하지 않는 사용자 ID로 조회하면 null을 반환한다.', async () => {
      em.findOne.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent-id');
      expect(result).toBeNull();
    });
  });
});
