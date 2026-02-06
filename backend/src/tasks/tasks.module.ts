import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TasksGateway } from './tasks.gateway';
import { Task } from './task.entity';
import { AuthModule } from '../auth/auth.module';

/**
 * 일감 모듈
 * - TasksController: REST API 엔드포인트
 * - TasksService: 비즈니스 로직 (CRUD + 동시성 제어)
 * - TasksGateway: WebSocket 실시간 동기화
 * - AuthModule 임포트: JWT 인증 가드 사용을 위해 필요
 */
@Module({
  imports: [MikroOrmModule.forFeature([Task]), AuthModule],
  controllers: [TasksController],
  providers: [TasksService, TasksGateway],
})
export class TasksModule {}
