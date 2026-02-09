import { type ButtonHTMLAttributes, type ReactNode } from 'react';

/**
 * 재사용 가능한 버튼 컴포넌트 (SRP)
 * - 단일 책임: 스타일 변형(variant)에 따른 버튼 렌더링만 담당
 * - variant를 통해 primary/secondary 스타일을 선택
 * - 로딩 상태 지원: isLoading prop으로 로딩 인디케이터 표시
 */
type ButtonVariant = 'primary' | 'secondary';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  children: ReactNode;
}

/**
 * variant별 스타일 매핑
 * - 새로운 variant 추가 시 이 객체에만 추가하면 됨 (OCP: 확장에 열림)
 */
const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
};

export default function Button({
  variant = 'primary',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`${VARIANT_STYLES[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          {/* 로딩 스피너: 접근성을 위해 aria-hidden 처리 */}
          <svg
            className="animate-spin h-4 w-4"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
