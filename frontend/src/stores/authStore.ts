import { create } from 'zustand';
import type { User } from '../types';

/**
 * 인증 상태 관리 스토어 (Zustand)
 *
 * Zustand를 사용하는 이유:
 * - 간결한 API: 보일러플레이트가 적어 인증 상태 관리에 적합
 * - React 외부에서도 접근 가능: axios 인터셉터 등에서 활용 가능
 * - TanStack Query와 역할 분리:
 *   - Zustand: 클라이언트 전용 상태 (로그인 사용자 정보, 토큰)
 *   - TanStack Query: 서버 상태 (일감 목록 등 API 데이터)
 */
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User, token: string) => void;
  logout: () => void;
  /** 토큰 존재 여부로 초기 인증 상태 복원 시도 */
  hasToken: () => boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  /** 로그인 성공 시 사용자 정보와 토큰을 저장 */
  setUser: (user: User, token: string) => {
    localStorage.setItem('accessToken', token);
    set({ user, isAuthenticated: true });
  },

  /** 로그아웃: 토큰 삭제 및 상태 초기화 */
  logout: () => {
    localStorage.removeItem('accessToken');
    set({ user: null, isAuthenticated: false });
  },

  /** localStorage에 토큰이 있는지 확인 */
  hasToken: () => !!localStorage.getItem('accessToken'),
}));
