import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { useAuthStore } from '../stores/authStore';
import { getSocket, disconnectSocket } from '../lib/socket';
import type { AuthResponse, User } from '../types';

/**
 * 인증 관련 커스텀 훅
 * - 회원가입, 로그인, 로그아웃 기능 제공
 * - TanStack Query의 useMutation을 사용하여 서버 상태 관리
 */
export function useAuth() {
  const navigate = useNavigate();
  const { setUser, logout: storeLogout } = useAuthStore();

  /**
   * 페이지 새로고침 시 JWT 토큰으로 사용자 정보를 복원
   * - 토큰이 있으면 /auth/me 엔드포인트로 사용자 정보 조회
   * - 토큰이 만료되었으면 자동으로 401 → 로그인 페이지로 이동
   */
  const { isLoading: isRestoring } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await api.get<User>('/auth/me');
      const token = localStorage.getItem('accessToken')!;
      setUser(data, token);

      // 사용자 정보 복원 성공 시 WebSocket 연결
      const socket = getSocket();
      if (!socket.connected) {
        socket.connect();
      }

      return data;
    },
    enabled: !!localStorage.getItem('accessToken'),
    retry: false,
  });

  /** 회원가입 뮤테이션 */
  const signupMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      name: string;
      password: string;
    }) => {
      const response = await api.post<AuthResponse>('/auth/signup', data);
      return response.data;
    },
    onSuccess: (data) => {
      setUser(data.user, data.accessToken);
      // 인증 성공 후 WebSocket 연결 시작
      getSocket().connect();
      navigate('/');
    },
  });

  /** 로그인 뮤테이션 */
  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await api.post<AuthResponse>('/auth/login', data);
      return response.data;
    },
    onSuccess: (data) => {
      setUser(data.user, data.accessToken);
      // 인증 성공 후 WebSocket 연결 시작
      getSocket().connect();
      navigate('/');
    },
  });

  /** 로그아웃 처리 - 상태 초기화 및 WebSocket 연결 해제 */
  const logout = () => {
    disconnectSocket();
    storeLogout();
    navigate('/login');
  };

  return {
    signupMutation,
    loginMutation,
    logout,
    isRestoring,
  };
}
