import Modal from './Modal';
import Button from './Button';

/**
 * 알림 모달 컴포넌트
 * - window.alert 대신 사용하는 커스텀 알림 다이얼로그
 * - 확인 버튼만 있는 단순 알림용
 */
interface AlertModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

export default function AlertModal({
  title,
  message,
  confirmLabel = '확인',
  onConfirm,
}: AlertModalProps) {
  return (
    <Modal title={title} onClose={onConfirm}>
      <p className="text-sm text-gray-500 mb-8 leading-relaxed">{message}</p>
      <Button variant="primary" onClick={onConfirm} className="w-1/2 mx-auto">
        {confirmLabel}
      </Button>
    </Modal>
  );
}
