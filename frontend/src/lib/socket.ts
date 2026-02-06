import { io, Socket } from 'socket.io-client';

/**
 * Socket.IO 클라이언트 설정
 * - autoConnect: false로 설정하여 명시적으로 연결 시작
 *   (로그인 성공 후에만 연결하기 위함)
 * - WebSocket 연결을 통해 서버의 실시간 이벤트를 수신
 */
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let socket: Socket | null = null;

/** WebSocket 연결 생성 또는 기존 연결 반환 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
    });
  }
  return socket;
}

/** WebSocket 연결 해제 - 로그아웃 시 호출 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
