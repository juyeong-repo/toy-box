import { Entity, PrimaryKey, Property, ManyToOne, Enum, OptionalProps } from '@mikro-orm/core';
import { randomUUID } from 'crypto';
import { User } from '../auth/user.entity';

/**
 * 일감 상태 ENUM
 * - TODO: 할 일
 * - DOING: 진행 중
 * - DONE: 완료
 */
export enum TaskStatus {
  TODO = 'TODO',
  DOING = 'DOING',
  DONE = 'DONE',
}

/**
 * 일감(Task) 엔티티
 * - 칸반 보드의 각 카드에 해당하는 데이터 모델
 * - version 필드: 낙관적 잠금(Optimistic Locking)을 위한 버전 관리
 *   - 동시에 여러 사용자가 같은 일감을 수정할 때 발생하는 충돌을 감지
 *   - 수정 요청 시 클라이언트가 보유한 version과 DB의 version이 일치해야만 수정 허용
 *   - 불일치 시 다른 사용자가 먼저 수정한 것이므로 409 Conflict 반환
 *
 * OptionalProps: MikroORM에게 기본값이 있는 필드를 알려줌
 */
@Entity()
export class Task {
  [OptionalProps]?: 'id' | 'status' | 'version' | 'createdAt' | 'updatedAt';

  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property()
  title!: string;

  @Enum(() => TaskStatus)
  status: TaskStatus = TaskStatus.TODO;

  /**
   * 낙관적 잠금을 위한 버전 필드
   * - 매 수정 시마다 1씩 증가
   * - 클라이언트는 조회 시 받은 version을 수정 요청에 포함해야 함
   * - DB의 version과 요청의 version이 다르면 충돌로 판단
   */
  @Property({ version: true })
  version!: number;

  /**
   * 태스트 작성자 - 로그인한 사용자가 자동으로 설정됨
   * eager: true로 설정하여 일감 조회 시 작성자 정보도 함께 로드
   */
  @ManyToOne(() => User, { eager: true })
  creator!: User;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
