import { Entity, PrimaryKey, Property, Unique, OptionalProps } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

/**
 * 사용자 엔티티
 * - 회원가입 시 생성되며, 이메일을 통해 고유하게 식별
 * - 비밀번호는 bcrypt로 해시하여 저장 (보안)
 * - 일감(Task)의 작성자(creator)로 참조됨
 *
 * OptionalProps: MikroORM에게 기본값이 있는 필드를 알려줌
 * - em.create() 호출 시 이 필드들은 제공하지 않아도 됨
 */
@Entity()
export class User {
  [OptionalProps]?: 'id' | 'createdAt';

  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property()
  @Unique()
  email!: string;

  @Property()
  name!: string;

  /** bcrypt로 해시된 비밀번호 - 평문 저장 금지 */
  @Property({ hidden: true })
  password!: string;

  @Property()
  createdAt: Date = new Date();
}
