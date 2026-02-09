import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateTaskModal from './CreateTaskModal';

/**
 * CreateTaskModal 컴포넌트 테스트
 * - 모달 렌더링, 입력, 제출, 취소 동작을 검증
 */
describe('CreateTaskModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('모달이 정상적으로 렌더링된다.', () => {
    render(<CreateTaskModal onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    expect(screen.getByText('새 태스크 만들기')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('태스크 제목을 입력하세요')).toBeInTheDocument();
    expect(screen.getByText('생성')).toBeInTheDocument();
    expect(screen.getByText('취소')).toBeInTheDocument();
  });

  it('제목을 입력하고 생성 버튼을 클릭하면 onSubmit이 호출된다.', async () => {
    const user = userEvent.setup();
    render(<CreateTaskModal onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const input = screen.getByPlaceholderText('태스크 제목을 입력하세요');
    await user.type(input, '새 태스크');
    await user.click(screen.getByText('생성'));

    expect(mockOnSubmit).toHaveBeenCalledWith('새 태스크');
  });

  it('빈 제목으로는 생성할 수 없다.', async () => {
    render(<CreateTaskModal onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    // 생성 버튼이 비활성화 상태여야 함
    const submitButton = screen.getByText('생성');
    expect(submitButton).toBeDisabled();
  });

  it('취소 버튼을 클릭하면 onClose가 호출된다.', async () => {
    const user = userEvent.setup();
    render(<CreateTaskModal onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    await user.click(screen.getByText('취소'));

    expect(mockOnClose).toHaveBeenCalled();
  });
});
