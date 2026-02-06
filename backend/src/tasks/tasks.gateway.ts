import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/**
 * WebSocket 게이트웨이 - 실시간 동기화를 위한 WebSocket 서버
 *
 * WebSocket을 선택한 이유:
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

  handleConnection(client: Socket) {
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
  broadcastTaskUpdate(event: string, data: any) {
    this.server.emit(event, data);
  }
}
