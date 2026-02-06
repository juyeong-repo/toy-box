import { forwardRef, type InputHTMLAttributes } from 'react';

/**
 * 재사용 가능한 입력 필드 컴포넌트 (SRP)
 * - 단일 책임: 스타일이 적용된 입력 필드 렌더링만 담당
 * - 라벨, 에러 메시지 등 부가 기능은 FormField 컴포넌트에서 조합하여 사용
 * - forwardRef: 부모 컴포넌트에서 ref로 DOM 접근 가능 (포커스 제어 등)
 */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = '', ...props }, ref) => {
    return (
      <div>
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`input-field ${error ? 'ring-2 ring-red-400 border-red-400' : ''} ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
