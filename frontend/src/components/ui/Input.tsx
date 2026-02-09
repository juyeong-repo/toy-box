import { forwardRef, useState, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/** 눈 아이콘 (비밀번호 보기) */
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

/** 눈에 빗금 아이콘 (비밀번호 숨기기) */
const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" />
  </svg>
);

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, type, className = '', maxLength, value, ...props }, ref) => {
    /** 비밀번호 필드일 때 보기/숨기기 토글 상태 */
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordField = type === 'password';
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div>
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-medium text-gray-400 mb-1.5"
          >
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={isPasswordField && showPassword ? 'text' : type}
            className={`input-field ${isPasswordField ? 'pr-10' : ''} ${error ? 'ring-2 ring-red-400' : ''} ${className}`}
            maxLength={maxLength}
            value={value}
            {...props}
          />
          {isPasswordField && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          )}
        </div>
        <div className="flex justify-between items-center mt-1">
          {error ? (
            <p className="text-xs text-red-500">{error}</p>
          ) : <span />}
          {maxLength && (
            <span className={`text-xs ${currentLength >= maxLength ? 'text-red-500' : 'text-gray-400'}`}>
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
