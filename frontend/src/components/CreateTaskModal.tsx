import { useState } from 'react';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Button from './ui/Button';

/**
 * 일감 생성 모달 컴포넌트
 * - Modal, Input, Button 재사용 컴포넌트를 조합하여 구성 (컴포지션 패턴)
 * - 빈 제목으로는 생성 불가 (disabled 상태로 시각적으로 명확히 표시)
 */
interface CreateTaskModalProps {
  onClose: () => void;
  onSubmit: (title: string) => Promise<void>;
}

export default function CreateTaskModal({
  onClose,
  onSubmit,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(title.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title="새 태스크 만들기" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <Input
            id="task-title"
            label="제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="태스크 제목을 입력하세요"
            maxLength={200}
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={onClose}>
            취소
          </Button>
          <Button
            type="submit"
            disabled={!title.trim()}
            isLoading={isSubmitting}
            className="w-auto"
          >
            {isSubmitting ? '생성 중...' : '생성'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
