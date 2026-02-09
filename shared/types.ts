/**
 * 프론트엔드와 백엔드에서 공통으로 사용하는 타입 정의
 *
 * 이 파일은 프론트엔드/백엔드 간 API 계약(contract)을 단일 소스(Single Source of Truth)로 관리합니다.
 * 양쪽에서 이 타입을 참조하여 타입 불일치로 인한 런타임 에러를 방지합니다.
 *
 * 참고: 모노레포 패키지 매니저(npm workspaces 등)를 도입하면
 * 이 파일을 독립 패키지로 분리하여 더 체계적으로 관리할 수 있습니다.
 */

// ─── 사용자 관련 타입 ───────────────────────────────────────

/** 사용자 정보 (비밀번호 등 민감 정보 제외) */
export interface User {
  id: string;
  email: string;
  name: string;
}

/** 인증 응답 - 로그인/회원가입 성공 시 JWT 토큰과 사용자 정보를 반환 */
export interface AuthResponse {
  accessToken: string;
  user: User;
}

// ─── 일감(Task) 관련 타입 ───────────────────────────────────

/**
 * 태스크 상태
 * - TODO: 할 일 (칸반 보드의 첫 번째 컬럼)
 * - DOING: 진행 중 (칸반 보드의 두 번째 컬럼)
 * - DONE: 완료 (칸반 보드의 세 번째 컬럼)
 */
export type TaskStatus = 'TODO' | 'DOING' | 'DONE';

/** 일감 데이터 - 칸반 보드의 각 카드에 해당 */
export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  /** 낙관적 잠금을 위한 버전 번호 - 수정 시 이 값을 함께 전송해야 함 */
  version: number;
  /** 일감을 생성한 사용자 */
  creator: User;
  createdAt: string;
  updatedAt: string;
}

// ─── WebSocket 이벤트 타입 ──────────────────────────────────

/** WebSocket 이벤트 이름 */
export type TaskEvent = 'task:created' | 'task:updated' | 'task:deleted';

/** 일감 삭제 이벤트 페이로드 */
export interface TaskDeletedPayload {
  id: string;
}
