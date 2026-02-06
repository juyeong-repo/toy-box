import { type ReactNode } from 'react';

/**
 * 인증 페이지 공통 레이아웃 (SRP)
 * - 단일 책임: 인증 페이지의 배경, 센터 정렬, 카드 레이아웃만 담당
 * - 로그인/회원가입 페이지에서 공통으로 사용하여 코드 중복 제거
 * - 최대 너비 440px로 Figma 가이드(420-480px)에 맞춤
 */
interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthLayout({
  title,
  subtitle,
  children,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-background py-12 px-4">
      <div className="w-full max-w-form space-y-8">
        {/* 헤더 영역: 앱 이름과 페이지 설명 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {title}
          </h1>
          <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
        </div>

        {/* 카드 형태의 폼 컨테이너 */}
        <div className="card p-8">{children}</div>
      </div>
    </div>
  );
}
