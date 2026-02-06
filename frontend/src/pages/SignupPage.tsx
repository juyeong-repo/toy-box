import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../components/layout/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

/**
 * 회원가입 페이지
 * - AuthLayout으로 공통 레이아웃을 재사용하고, 폼 내용만 정의
 * - 이메일, 이름, 비밀번호로 회원가입
 * - 가입 성공 시 자동 로그인 후 칸반 보드 페이지로 이동 (useAuth 훅에서 처리)
 */
export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const { signupMutation } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signupMutation.mutate({ email, name, password });
  };

  return (
    <AuthLayout title="칸반 보드" subtitle="새 계정을 만드세요">
      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* 서버 에러 메시지 표시 */}
        {signupMutation.isError && (
          <div className="error-message">
            {(signupMutation.error as any)?.response?.data?.message ||
              '회원가입에 실패했습니다.'}
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
            id="name"
            type="text"
            label="이름"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 입력하세요"
          />
          <Input
            id="password"
            type="password"
            label="비밀번호"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요 (6자 이상)"
          />
        </div>

        <Button type="submit" isLoading={signupMutation.isPending}>
          {signupMutation.isPending ? '가입 중...' : '회원가입'}
        </Button>

        <p className="text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link
            to="/login"
            className="font-semibold text-primary-600 hover:text-primary-500"
          >
            로그인
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
