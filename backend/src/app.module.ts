import { Module, OnModuleInit } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroORM } from '@mikro-orm/core';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { TranslationModule } from './translation/translation.module';
import mikroOrmConfig from './mikro-orm.config';

/**
 * 애플리케이션 루트 모듈
 * - MikroORM: 데이터베이스 ORM 연결
 * - AuthModule: 사용자 인증 관련 기능 (회원가입, 로그인, JWT)
 * - TasksModule: 일감 CRUD 및 실시간 동기화
 * - TranslationModule: LLM 기반 실시간 텍스트 번역
 */
@Module({
  imports: [
    MikroOrmModule.forRoot(mikroOrmConfig),
    AuthModule,
    TasksModule,
    TranslationModule,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly orm: MikroORM) {}

  /**
   * 모듈 초기화 시 데이터베이스 스키마를 자동으로 동기화
   * - updateSchema: 기존 데이터를 유지하면서 스키마를 업데이트
   * - docker compose up으로 최초 실행 시에도 별도 마이그레이션 없이 동작하도록 설계
   */
  async onModuleInit() {
    const generator = this.orm.getSchemaGenerator();
    await generator.updateSchema();
  }
}
