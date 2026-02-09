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
  /** 사용자가 입력을 시작한 필드를 추적하여, 입력 중에만 유효성 메시지 표시 */
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { signupMutation } = useAuth();

  /** 이메일 형식 검사: @를 포함한 기본 이메일 패턴 */
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  /** 모든 유효성 검사를 통과해야 버튼 활성화 */
  const isFormValid = name.trim() !== '' && isValidEmail && password.length >= 6;

  /** 필드별 유효성 검사 메시지 - 입력 중 실시간으로 표시 */
  const errors = {
    name: touched.name && name.length > 0 && name.trim() === ''
      ? '이름은 공백만으로 구성할 수 없습니다.'
      : undefined,
    email: touched.email && email.length > 0 && !isValidEmail
      ? '이메일은 @를 포함한 올바른 형식이어야 합니다.'
      : undefined,
    password: touched.password && password.length > 0 && password.length < 6
      ? '비밀번호는 6자 이상이어야 합니다.'
      : undefined,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signupMutation.mutate({ email, name, password });
  };

  return (
    <AuthLayout title="회원 가입">
      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* 서버 에러 메시지 표시 */}
        {signupMutation.isError && (
          <div className="error-message">
            {(signupMutation.error as any)?.response?.data?.message ||
              '회원 가입에 실패했습니다.'}
          </div>
        )}

        <div className="space-y-4">
          <Input
            id="name"
            type="text"
            label="이름"
            required
            value={name}
            onChange={(e) => { setName(e.target.value); setTouched((p) => ({ ...p, name: true })); }}
            placeholder="이름을 입력하세요"
            error={errors.name}
          />
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
            minLength={6}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setTouched((p) => ({ ...p, password: true })); }}
            placeholder="비밀번호를 입력하세요 (6자 이상)"
            error={errors.password}
          />
        </div>

        <Button type="submit" isLoading={signupMutation.isPending} disabled={!isFormValid}>
          {signupMutation.isPending ? '계정 생성 중...' : '계정 만들기'}
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
