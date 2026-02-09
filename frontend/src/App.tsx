import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import BoardPage from './pages/BoardPage';

/**
 * 앱 라우터 컴포넌트
 * - 인증 상태에 따라 페이지 접근을 제어
 * - 비인증 사용자: 로그인/회원가입 페이지만 접근 가능
 * - 인증 사용자: 칸반 보드 페이지 접근, 로그인/회원가입 페이지 접근 시 보드로 리다이렉트
 */
function App() {
  const { isAuthenticated } = useAuthStore();
  const { isRestoring } = useAuth();

  // JWT 토큰으로 사용자 정보를 복원하는 동안 로딩 표시
  if (isRestoring) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
        }
      />
      <Route
        path="/signup"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <SignupPage />
        }
      />
      <Route
        path="/"
        element={
          isAuthenticated ? <BoardPage /> : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
}

export default App;
