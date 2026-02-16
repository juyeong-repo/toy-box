import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { TaskEvent, TaskDeletedPayload } from '../../../shared/types';
import { Task } from './task.entity';

/**
 * WebSocket 게이트웨이 - 실시간 동기화를 위한 WebSocket 서버
 *
 * [인증]
 * - 클라이언트는 연결 시 auth.token에 JWT 토큰을 포함해야 함
 * - handleConnection에서 토큰을 검증하고, 유효하지 않으면 즉시 연결을 끊음
 * - REST API의 JwtAuthGuard와 동일한 JwtService를 사용하여 일관된 인증 처리
 *
 * [WebSocket을 선택한 이유]
 * 1. 양방향 통신: 서버에서 클라이언트로 즉시 이벤트를 푸시할 수 있음
 * 2. 낮은 지연시간: HTTP 폴링 대비 실시간성이 뛰어남
 * 3. Socket.IO: 자동 재연결, 폴백(fallback) 메커니즘을 기본 제공
 *    - WebSocket이 불가능한 환경에서 자동으로 long polling으로 폴백
 *
 * SSE(Server-Sent Events)를 선택하지 않은 이유:
 * - SSE는 단방향(서버→클라이언트)만 지원하여 양방향 통신에 부적합
 * - 연결 수 제한(HTTP/1.1에서 도메인당 6개)이 있음
 *
 * 폴링을 선택하지 않은 이유:
 * - 불필요한 네트워크 요청이 지속적으로 발생
 * - 실시간성이 폴링 간격에 제한됨
 */
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TasksGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwtService: JwtService) {}

  /**
   * 클라이언트 연결 시 JWT 토큰 검증
   * - auth.token에서 JWT를 추출하여 유효성 확인
   * - 토큰이 없거나 유효하지 않으면 즉시 연결 해제
   * - 인증된 사용자만 실시간 이벤트를 수신할 수 있도록 보장
   */
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
      return;
    }

    console.log(`클라이언트 연결: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`클라이언트 연결 해제: ${client.id}`);
  }

  /**
   * 모든 연결된 클라이언트에게 일감 변경 이벤트를 브로드캐스트
   * - 일감 생성, 수정, 삭제 시 호출
   * - 클라이언트는 이 이벤트를 수신하여 칸반 보드를 갱신
   */
  broadcastTaskUpdate(event: TaskEvent, data: Task | TaskDeletedPayload) {
    this.server.emit(event, data);
  }
}
