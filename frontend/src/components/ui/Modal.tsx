import { type ReactNode, useEffect, useCallback } from 'react';

/**
 * 재사용 가능한 모달 컴포넌트 (SRP)
 * - 단일 책임: 모달 오버레이 렌더링 및 닫기 동작만 담당
 * - 내부 컨텐츠는 children으로 전달받아 유연하게 구성
 * - ESC 키와 오버레이 클릭으로 닫기 지원
 */
interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  title: string;
}

export default function Modal({ onClose, children, title }: ModalProps) {
  /** ESC 키로 모달 닫기 - 전역 키보드 이벤트 리스너 */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="card p-8 w-full max-w-form shadow-modal mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-gray-900 mb-6">{title}</h2>
        {children}
      </div>
    </div>
  );
}
