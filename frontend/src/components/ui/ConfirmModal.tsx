import Modal from './Modal';
import Button from './Button';

/**
 * 확인/취소 모달 컴포넌트
 * - window.confirm 대신 사용하는 커스텀 확인 다이얼로그
 * - 삭제 등 위험한 동작 전 사용자에게 확인을 요청할 때 사용
 */
interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-gray-500 mb-8 leading-relaxed">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-600 border border-surface-border rounded-button hover:bg-gray-50 transition-colors"
        >
          {cancelLabel}
        </button>
        <Button
          variant="primary"
          onClick={onConfirm}
          className="flex-1 !bg-red-500 hover:!bg-red-600 focus:!ring-red-500"
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
