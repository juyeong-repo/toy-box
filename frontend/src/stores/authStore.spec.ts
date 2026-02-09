import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

/**
 * AuthStore (Zustand) 테스트
 * - 로그인/로그아웃 상태 관리 로직을 검증
 * - localStorage 연동 동작을 검증
 */
describe('authStore', () => {
  beforeEach(() => {
    // 각 테스트 전 상태 초기화
    localStorage.clear();
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it('초기 상태에서는 인증되지 않은 상태이다.', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it('setUser 호출 시 사용자 정보가 저장되고 인증 상태가 true가 된다.', () => {
    const user = { id: '1', email: 'test@example.com', name: '테스트' };
    useAuthStore.getState().setUser(user, 'test-token');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(user);
    expect(localStorage.getItem('accessToken')).toBe('test-token');
  });

  it('logout 호출 시 사용자 정보가 초기화되고 토큰이 삭제된다.', () => {
    // 먼저 로그인 상태로 설정
    const user = { id: '1', email: 'test@example.com', name: '테스트' };
    useAuthStore.getState().setUser(user, 'test-token');

    // 로그아웃
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('hasToken은 localStorage에 토큰이 있으면 true를 반환한다.', () => {
    localStorage.setItem('accessToken', 'test-token');
    expect(useAuthStore.getState().hasToken()).toBe(true);
  });

  it('hasToken은 localStorage에 토큰이 없으면 false를 반환한다.', () => {
    expect(useAuthStore.getState().hasToken()).toBe(false);
  });
});
