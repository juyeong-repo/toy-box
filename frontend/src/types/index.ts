/**
 * 프론트엔드 타입 정의
 *
 * shared/types.ts의 공통 타입을 re-export하여 사용합니다.
 * 프론트엔드 전용 타입이 필요한 경우 이 파일에 추가합니다.
 *
 * 경로 설명: ../../../shared → 프로젝트 루트의 shared/ 디렉토리를 참조
 * (모노레포 패키지 도입 전까지 상대 경로로 참조)
 */
export type {
  User,
  AuthResponse,
  TaskStatus,
  Task,
  TaskEvent,
  TaskDeletedPayload,
} from '../../../shared/types';
