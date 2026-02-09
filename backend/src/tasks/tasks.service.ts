import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Task, TaskStatus } from './task.entity';
import { User } from '../auth/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

/**
 * 일감 서비스
 * - CRUD 작업 수행 및 비즈니스 로직 처리
 * - 낙관적 잠금(Optimistic Locking)을 통한 동시성 제어
 */
@Injectable()
export class TasksService {
  constructor(private readonly em: EntityManager) {}

  /** 모든 일감 조회 - 생성일 기준 오름차순 정렬 */
  async findAll(): Promise<Task[]> {
    return this.em.find(Task, {}, { orderBy: { createdAt: 'ASC' } });
  }

  /**
   * 일감 검색
   * - 제목 또는 작성자 이름에 검색어가 포함된 일감을 조회
   * - ILIKE를 사용하여 대소문자 구분 없이 검색
   */
  async search(query: string): Promise<Task[]> {
    return this.em.find(
      Task,
      {
        $or: [
          { title: { $ilike: `%${query}%` } },
          { creator: { name: { $ilike: `%${query}%` } } },
        ],
      },
      { orderBy: { createdAt: 'ASC' } },
    );
  }

  /** 일감 생성 - 현재 로그인한 사용자가 작성자로 자동 설정 */
  async create(dto: CreateTaskDto, user: User): Promise<Task> {
    const task = this.em.create(Task, {
      title: dto.title,
      status: TaskStatus.TODO,
      creator: user,
    });
    await this.em.persistAndFlush(task);
    return task;
  }

  /**
   * 일감 수정 - 낙관적 잠금을 통한 동시성 제어
   *
   * [동시성 문제 정의]
   * 두 명의 사용자가 동시에 같은 일감을 수정하는 경우:
   * 1. 사용자 A가 일감을 조회 (version: 1)
   * 2. 사용자 B가 같은 일감을 조회 (version: 1)
   * 3. 사용자 A가 상태를 TODO→DOING으로 변경 요청 (version: 1)
   * 4. DB 업데이트 성공, version이 2로 증가
   * 5. 사용자 B가 상태를 TODO→DONE으로 변경 요청 (version: 1)
   * 6. DB의 version(2)과 요청의 version(1)이 불일치 → 충돌 감지
   *
   * [해결 전략: 낙관적 잠금 (Optimistic Locking)]
   * - version 필드를 사용하여 충돌을 감지하고 거부
   * - 비관적 잠금(Pessimistic Locking) 대비 장점:
   *   - DB 잠금 없이 동시 읽기가 가능하여 성능 우수
   *   - 칸반 보드는 읽기가 훨씬 많고 동시 수정 빈도가 낮으므로 적합
   * - Last-Write-Wins 대비 장점:
   *   - 데이터 손실 없이 충돌을 사용자에게 알려 의도적 처리 가능
   */
  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.em.findOne(Task, { id });
    if (!task) {
      throw new NotFoundException('일감을 찾을 수 없습니다.');
    }

    // 낙관적 잠금: 클라이언트가 보낸 version과 현재 DB version 비교
    // version이 일치하지 않으면 다른 사용자가 이미 수정한 것이므로 충돌 반환
    if (task.version !== dto.version) {
      throw new ConflictException(
        '다른 사용자가 이미 이 일감을 수정했습니다. 최신 데이터를 확인해 주세요.',
      );
    }

    if (dto.title !== undefined) {
      task.title = dto.title;
    }
    if (dto.status !== undefined) {
      task.status = dto.status;
    }

    await this.em.flush();
    return task;
  }

  /** 일감 삭제 */
  async remove(id: string): Promise<void> {
    const task = await this.em.findOne(Task, { id });
    if (!task) {
      throw new NotFoundException('태스크를 찾을 수 없습니다.');
    }
    await this.em.removeAndFlush(task);
  }
}
