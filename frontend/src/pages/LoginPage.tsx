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
  const { loginMutation } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <AuthLayout title="칸반 보드" subtitle="계정에 로그인하세요">
      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* 서버 에러 메시지 표시 */}
        {loginMutation.isError && (
          <div className="error-message">
            {(loginMutation.error as any)?.response?.data?.message ||
              '로그인에 실패했습니다.'}
          </div>
        )}

        <div className="space-y-4">
          <Input
            id="email"
            type="email"
            label="이메일"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일을 입력하세요"
          />
          <Input
            id="password"
            type="password"
            label="비밀번호"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
          />
        </div>

        <Button type="submit" isLoading={loginMutation.isPending}>
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
