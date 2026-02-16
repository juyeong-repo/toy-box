import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { OptimisticLockError } from '@mikro-orm/core';
import { TasksService } from './tasks.service';
import { Task, TaskStatus } from './task.entity';
import { User } from '../auth/user.entity';

/**
 * TasksService 단위 테스트
 * - 태스크 CRUD 및 동시성 제어(낙관적 잠금) 로직을 테스트
 * - EntityManager를 모킹하여 데이터베이스 의존성 격리
 */
describe('TasksService', () => {
  let service: TasksService;
  let em: jest.Mocked<EntityManager>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    name: '테스트 사용자',
    password: 'hashed',
    createdAt: new Date(),
  };

  const mockTask: Task = {
    id: 'task-1',
    title: '테스트 TASK',
    status: TaskStatus.TODO,
    version: 1,
    creator: mockUser,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockEm = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      persistAndFlush: jest.fn(),
      flush: jest.fn(),
      removeAndFlush: jest.fn(),
      lock: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: EntityManager, useValue: mockEm },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    em = module.get(EntityManager);
  });

  describe('findAll', () => {
    it('모든 태스크를 생성일 기준 오름차순으로 반환한다.', async () => {
      em.find.mockResolvedValue([mockTask]);

      const result = await service.findAll();

      expect(result).toEqual([mockTask]);
      expect(em.find).toHaveBeenCalledWith(
        Task,
        {},
        { orderBy: { createdAt: 'ASC' } },
      );
    });
  });

  describe('search', () => {
    it('검색어가 제목에 포함된 태스크를 반환한다.', async () => {
      em.find.mockResolvedValue([mockTask]);

      const result = await service.search('테스트');

      expect(result).toEqual([mockTask]);
      expect(em.find).toHaveBeenCalledWith(
        Task,
        {
          $or: [
            { title: { $ilike: '%테스트%' } },
            { creator: { name: { $ilike: '%테스트%' } } },
          ],
        },
        { orderBy: { createdAt: 'ASC' } },
      );
    });

    it('검색 결과가 없으면 빈 배열을 반환한다.', async () => {
      em.find.mockResolvedValue([]);

      const result = await service.search('존재하지않는검색어');

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('새 태스크를 생성하고 반환한다.', async () => {
      em.create.mockReturnValue(mockTask);

      const result = await service.create(
        { title: '테스트 태스크' },
        mockUser,
      );

      expect(result).toEqual(mockTask);
      expect(em.persistAndFlush).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('version이 일치하면 태스크를 정상적으로 수정한다.', async () => {
      const task = { ...mockTask, version: 1 };
      em.findOne.mockResolvedValue(task);

      const result = await service.update('task-1', {
        version: 1,
        title: '수정된 제목',
        status: TaskStatus.DOING,
      });

      expect(result.title).toBe('수정된 제목');
      expect(result.status).toBe(TaskStatus.DOING);
      expect(em.flush).toHaveBeenCalled();
    });

    it('lock 시점에 OptimisticLockError가 발생하면 ConflictException으로 변환한다.', async () => {
      const task = { ...mockTask, version: 1 };
      em.findOne.mockResolvedValue(task);
      em.lock.mockRejectedValue(
        new OptimisticLockError(
          'The optimistic lock failed, version 1 was expected, but is actually 2',
        ),
      );

      await expect(
        service.update('task-1', {
          version: 1,
          title: '수정 시도',
        }),
      ).rejects.toThrow(
        '다른 사용자가 이미 이 태스크를 수정했습니다. 최신 데이터를 확인해주세요.',
      );
    });

    it('존재하지 않는 태스크를 수정하려고 하면 NotFoundException이 발생한다.', async () => {
      em.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', {
          version: 1,
          title: '수정 시도',
        }),
      ).rejects.toThrow('태스크를 찾을 수 없습니다.');
    });

    it('제목만 수정하면 상태는 변경되지 않는다.', async () => {
      const task = { ...mockTask, version: 1, status: TaskStatus.TODO };
      em.findOne.mockResolvedValue(task);

      const result = await service.update('task-1', {
        version: 1,
        title: '새로운 제목',
      });

      expect(result.title).toBe('새로운 제목');
      expect(result.status).toBe(TaskStatus.TODO);
    });

    it('상태만 수정하면 제목은 변경되지 않는다.', async () => {
      const task = {
        ...mockTask,
        version: 1,
        title: '원래 제목',
        status: TaskStatus.TODO,
      };
      em.findOne.mockResolvedValue(task);

      const result = await service.update('task-1', {
        version: 1,
        status: TaskStatus.DONE,
      });

      expect(result.title).toBe('원래 제목');
      expect(result.status).toBe(TaskStatus.DONE);
    });

    it('flush 시점에 OptimisticLockError가 발생해도 ConflictException으로 변환한다.', async () => {
      const task = { ...mockTask, version: 1 };
      em.findOne.mockResolvedValue(task);
      em.flush.mockRejectedValue(
        new OptimisticLockError(
          'The optimistic lock failed, version 1 was expected, but is actually 2',
        ),
      );

      await expect(
        service.update('task-1', {
          version: 1,
          title: '수정 시도',
        }),
      ).rejects.toThrow(
        '다른 사용자가 이미 이 태스크를 수정했습니다. 최신 데이터를 확인해주세요.',
      );
    });
  });

  /**
   * 동시성 제어 테스트
   *
   * 실제 DB 없이 EntityManager 모킹으로 낙관적 잠금의 동시성 시나리오를 검증한다.
   * MikroORM의 낙관적 잠금은 두 단계에서 충돌을 감지한다:
   *   1단계 (em.lock): 클라이언트가 보낸 version과 메모리에 로드된 엔티티의 version을 비교
   *   2단계 (em.flush): UPDATE ... WHERE version = N 쿼리로 DB 레벨에서 최종 검증
   */
  describe('동시성 제어 (Optimistic Locking)', () => {
    it('사용자 A가 먼저 수정한 후, 사용자 B가 같은 version으로 수정하면 lock 단계에서 충돌이 발생한다.', async () => {
      /**
       * 시나리오:
       *   1. 사용자 A, B 모두 태스크를 조회 (version: 1)
       *   2. 사용자 A가 수정 완료 → DB version이 2로 증가
       *   3. 사용자 B가 version: 1로 수정 요청
       *   4. findOne이 version: 2를 반환 → lock(version: 1 vs 엔티티 version: 2) 불일치 → 충돌
       */
      const taskAfterAUpdated = { ...mockTask, version: 2, title: 'A가 수정함' };
      em.findOne.mockResolvedValue(taskAfterAUpdated);
      em.lock.mockRejectedValue(
        new OptimisticLockError(
          'The optimistic lock failed, version 1 was expected, but is actually 2',
        ),
      );

      await expect(
        service.update('task-1', {
          version: 1, // 사용자 B가 보유한 구버전
          status: TaskStatus.DONE,
        }),
      ).rejects.toThrow(ConflictException);
      expect(em.flush).not.toHaveBeenCalled(); // flush 전에 차단되어야 한다
    });

    it('두 요청이 동시에 같은 version을 읽었을 때, 늦게 flush되는 요청은 flush 단계에서 충돌이 발생한다.', async () => {
      /**
       * 시나리오 (TOCTOU Race Condition):
       *   1. 사용자 A, B의 요청이 거의 동시에 findOne 실행 → 둘 다 version: 1 로드
       *   2. 사용자 A, B 모두 lock 통과 (둘 다 version: 1 === 엔티티 version: 1)
       *   3. 사용자 A의 flush가 먼저 실행 → DB version이 2로 증가
       *   4. 사용자 B의 flush 실행 → UPDATE WHERE version=1 매칭 실패 → OptimisticLockError
       */
      const task = { ...mockTask, version: 1 };
      em.findOne.mockResolvedValue(task);
      // lock은 통과 (인메모리 version이 같으므로)
      em.lock.mockResolvedValue(undefined);
      // flush에서 DB 레벨 충돌 발생
      em.flush.mockRejectedValue(
        new OptimisticLockError(
          'The optimistic lock failed, version 1 was expected, but is actually 2',
        ),
      );

      await expect(
        service.update('task-1', {
          version: 1,
          status: TaskStatus.DOING,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('두 사용자가 동시에 수정할 때, 먼저 도착한 요청은 성공하고 나중 요청만 실패한다.', async () => {
      // --- 사용자 A 요청: 성공 ---
      const taskForA = { ...mockTask, version: 1 };
      em.findOne.mockResolvedValue(taskForA);
      em.lock.mockResolvedValue(undefined);
      em.flush.mockResolvedValue(undefined);

      const resultA = await service.update('task-1', {
        version: 1,
        title: 'A가 수정',
      });
      expect(resultA.title).toBe('A가 수정');
      expect(em.flush).toHaveBeenCalledTimes(1);

      // --- 사용자 B 요청: 실패 ---
      jest.clearAllMocks();
      const taskForB = { ...mockTask, version: 2 }; // A가 수정 후 version 증가
      em.findOne.mockResolvedValue(taskForB);
      em.lock.mockRejectedValue(
        new OptimisticLockError(
          'The optimistic lock failed, version 1 was expected, but is actually 2',
        ),
      );

      await expect(
        service.update('task-1', {
          version: 1, // B가 가진 구버전
          title: 'B가 수정 시도',
        }),
      ).rejects.toThrow(ConflictException);
      expect(em.flush).not.toHaveBeenCalled();
    });

    it('충돌 후 최신 version으로 재시도하면 성공한다.', async () => {
      // --- 1차 시도: 충돌 ---
      const staleTask = { ...mockTask, version: 2 };
      em.findOne.mockResolvedValue(staleTask);
      em.lock.mockRejectedValue(
        new OptimisticLockError(
          'The optimistic lock failed, version 1 was expected, but is actually 2',
        ),
      );

      await expect(
        service.update('task-1', {
          version: 1, // 구버전
          status: TaskStatus.DOING,
        }),
      ).rejects.toThrow(ConflictException);

      // --- 2차 시도: 최신 version으로 재시도 → 성공 ---
      jest.clearAllMocks();
      const freshTask = { ...mockTask, version: 2 };
      em.findOne.mockResolvedValue(freshTask);
      em.lock.mockResolvedValue(undefined);
      em.flush.mockResolvedValue(undefined);

      const result = await service.update('task-1', {
        version: 2, // 최신 version으로 재시도
        status: TaskStatus.DOING,
      });

      expect(result.status).toBe(TaskStatus.DOING);
      expect(em.flush).toHaveBeenCalledTimes(1);
    });

    it('삭제된 태스크를 수정하려고 하면 NotFoundException이 발생한다.', async () => {
      /**
       * 시나리오:
       *   1. 사용자 A가 태스크를 삭제
       *   2. 사용자 B가 같은 태스크를 수정 시도
       *   3. findOne이 null → NotFoundException
       */
      em.findOne.mockResolvedValue(null);

      await expect(
        service.update('task-1', {
          version: 1,
          status: TaskStatus.DONE,
        }),
      ).rejects.toThrow(NotFoundException);
      expect(em.lock).not.toHaveBeenCalled();
      expect(em.flush).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('존재하는 태스크를 정상적으로 삭제한다.', async () => {
      em.findOne.mockResolvedValue(mockTask);

      await service.remove('task-1');

      expect(em.removeAndFlush).toHaveBeenCalledWith(mockTask);
    });

    it('존재하지 않는 태스크를 삭제하려고 하면 NotFoundException이 발생한다.', async () => {
      em.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        '태스크를 찾을 수 없습니다.',
      );
    });
  });
});
