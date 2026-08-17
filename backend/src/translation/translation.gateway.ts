import { randomUUID } from 'crypto';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket, Server } from 'socket.io';
import { TranslationService } from './translation.service';
import { TranslateDto } from './dto/translate.dto';

/**
 * 클라이언트가 'translate' 이벤트로 텍스트를 보내면, LLM 응답을 토큰 단위로
 * 받는 즉시 'translation:chunk'로 흘려보내는 실시간 번역 파이프라인.
 *
 * 인증은 TasksGateway와 동일한 방식(연결 시 JWT 검증)을 이 게이트웨이에서도
 * 독립적으로 수행한다 - 다른 게이트웨이의 연결 처리에 암묵적으로 의존하지 않기 위함.
 */
@WebSocketGateway({
  cors: { origin: '*' },
})
export class TranslationGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly translationService: TranslationService,
    private readonly jwtService: JwtService,
  ) {}

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      this.jwtService.verify(token);
    } catch {
      client.disconnect();
    }
  }

  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @SubscribeMessage('translate')
  async handleTranslate(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: TranslateDto,
  ) {
    const requestId = randomUUID();

    try {
      await this.translationService.translateStream(dto, (chunk) => {
        client.emit('translation:chunk', { requestId, chunk });
      });
      client.emit('translation:done', { requestId });
    } catch (error) {
      client.emit('translation:error', {
        requestId,
        message: error instanceof Error ? error.message : '번역 중 오류가 발생했습니다.',
      });
    }
  }
}
