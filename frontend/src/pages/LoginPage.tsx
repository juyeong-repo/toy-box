import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../components/layout/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

/**
 * 로그인 페이지
 * - AuthLayout으로 공통 레이아웃을 재사용하고, 폼 내용만 정의
 * - 이메일/비밀번호로 로그인
 * - 로그인 성공 시 칸반 보드 페이지로 자동 이동 (useAuth 훅에서 처리)
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  /** 사용자가 입력을 시작한 필드를 추적하여, 입력 중에만 유효성 메시지 표시 */
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { loginMutation } = useAuth();

  /** 이메일 형식 검사: @를 포함한 기본 이메일 패턴 */
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  /** 모든 유효성 검사를 통과해야 버튼 활성화 */
  const isFormValid = isValidEmail && password.trim() !== '';

  /** 필드별 유효성 검사 메시지 - 입력 중 실시간으로 표시 */
  const errors = {
    email: touched.email && email.length > 0 && !isValidEmail
      ? '이메일은 @를 포함한 형식이어야 합니다.'
      : undefined,
    password: touched.password && password.length > 0 && password.trim().length < 6
      ? '비밀번호는 6자 이상이어야 합니다.'
      : undefined,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <AuthLayout title="로그인">
      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* 서버 에러 메시지 표시 */}
        {loginMutation.isError && (
          <div className="error-message">
            {(loginMutation.error as any)?.response?.data?.message ||
              '로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.'}
          </div>
        )}

        <div className="space-y-4">
          <Input
            id="email"
            type="email"
            label="이메일"
            required
            value={email}
            onChange={(e) => { setEmail(e.target.value); setTouched((p) => ({ ...p, email: true })); }}
            placeholder="이메일을 입력하세요"
            error={errors.email}
          />
          <Input
            id="password"
            type="password"
            label="비밀번호"
            required
            value={password}
            onChange={(e) => { setPassword(e.target.value); setTouched((p) => ({ ...p, password: true })); }}
            placeholder="비밀번호를 입력하세요"
            error={errors.password}
          />
        </div>

        <Button type="submit" isLoading={loginMutation.isPending} disabled={!isFormValid}>
          {loginMutation.isPending ? '로그인 중...' : '로그인'}
        </Button>

        <p className="text-center text-sm text-gray-500">
          계정이 없으신가요?{' '}
          <Link
            to="/signup"
            className="font-semibold text-primary-600 hover:text-primary-500"
          >
            회원가입
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
