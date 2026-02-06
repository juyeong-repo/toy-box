import { type InputHTMLAttributes } from 'react';

/**
 * 검색 입력 컴포넌트 (SRP)
 * - 단일 책임: 검색 아이콘이 포함된 입력 필드 렌더링만 담당
 * - 검색 로직(디바운싱 등)은 사용하는 쪽에서 관리
 */
type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export default function SearchInput({ className = '', ...props }: SearchInputProps) {
  return (
    <div className="relative">
      {/* 검색 아이콘: 입력 필드 왼쪽에 고정 */}
      <svg
        className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
        />
      </svg>
      <input
        type="text"
        className={`input-field pl-10 ${className}`}
        {...props}
      />
    </div>
  );
}
