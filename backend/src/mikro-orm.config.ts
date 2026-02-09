import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { User } from './auth/user.entity';
import { Task } from './tasks/task.entity';

/**
 * MikroORM 설정 파일
 * - PostgreSQL 드라이버를 사용하며, 환경 변수를 통해 연결 정보를 관리
 * - schema generator를 사용하여 엔티티 정의로부터 테이블을 자동 생성
 * - 개발 환경에서의 편의를 위해 allowGlobalContext를 true로 설정
 */
const config: Options<PostgreSqlDriver> = {
  driver: PostgreSqlDriver,
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'kanban',
  password: process.env.DB_PASSWORD || 'kanban',
  dbName: process.env.DB_NAME || 'kanban',
  entities: [User, Task],
  // 스키마 자동 생성: 앱 시작 시 엔티티 정의에 따라 테이블을 자동으로 생성/수정
  // 프로덕션 환경에서는 마이그레이션을 사용하는 것이 권장되지만,
  // 과제 평가를 위한 편의상 자동 스키마 생성을 사용
  schemaGenerator: {
    disableForeignKeys: false,
  },
  allowGlobalContext: true,
  // 디버그 모드: 개발 환경에서만 SQL 로그를 출력
  debug: process.env.NODE_ENV !== 'production',
};

export default config;
