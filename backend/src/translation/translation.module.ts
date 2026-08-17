import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TranslationGateway } from './translation.gateway';
import { TranslationService } from './translation.service';

/**
 * 번역 모듈
 * - AuthModule 임포트: WebSocket 연결 시 JWT 검증을 위해 필요
 */
@Module({
  imports: [AuthModule],
  providers: [TranslationService, TranslationGateway],
})
export class TranslationModule {}
