import axios from 'axios';

/**
 * Axios 인스턴스 설정
 * - baseURL: 백엔드 API 주소 (환경변수로 설정 가능)
 * - 요청 인터셉터: localStorage에 저장된 JWT 토큰을 자동으로 Authorization 헤더에 추가
 * - 모든 API 호출에서 토큰을 수동으로 설정할 필요가 없도록 설정
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

// 요청 인터셉터: 모든 요청에 JWT 토큰을 자동으로 첨부
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: 401 에러 시 토큰 삭제 및 로그인 페이지로 리다이렉트
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      // 현재 로그인/회원가입 페이지가 아닌 경우에만 리다이렉트
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/signup')
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
