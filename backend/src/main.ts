import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 설정: 프론트엔드에서 API 호출을 허용하기 위해 설정
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // 전역 유효성 검사 파이프: 모든 요청의 DTO를 자동으로 검증
  // whitelist: DTO에 정의되지 않은 속성은 자동으로 제거하여 보안 강화
  // transform: 요청 데이터를 DTO 클래스 인스턴스로 자동 변환
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`서버가 포트 ${port}에서 실행 중입니다.`);
}
bootstrap();
