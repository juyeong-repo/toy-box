import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
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

    it('version이 일치하지 않으면 ConflictException이 발생한다.', async () => {
      // DB의 version은 2이지만, 클라이언트는 version 1로 수정 요청
      const task = { ...mockTask, version: 2 };
      em.findOne.mockResolvedValue(task);

      await expect(
        service.update('task-1', {
          version: 1,
          title: '수정 시도',
        }),
      ).rejects.toThrow(
        '다른 사용자가 이미 이 태스크를 수정했습니다. 최신 데이터를 확인해 주세요.',
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
