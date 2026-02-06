import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Task, TaskStatus } from '../types';

/**
 * 일감 카드 컴포넌트 (SRP)
 * - 단일 책임: 개별 일감 카드의 렌더링, 드래그, 인라인 수정, 삭제 UI 담당
 * - useDraggable: dnd-kit의 드래그 가능한 요소로 등록
 * - isDragging prop: DragOverlay에서 사용 시 드래그 스타일 적용
 *
 * 비즈니스 로직은 onUpdate/onDelete 콜백을 통해 상위에 위임 (관심사 분리)
 */
interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onUpdate?: (params: {
    id: string;
    version: number;
    title?: string;
    status?: TaskStatus;
  }) => Promise<Task>;
  onDelete?: (id: string) => Promise<void>;
}

export default function TaskCard({
  task,
  isDragging,
  onUpdate,
  onDelete,
}: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  /** 드래그 중 위치 변환 스타일 */
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  /**
   * 제목 수정 완료 처리
   * - version을 포함하여 낙관적 잠금 적용
   * - 수정 실패(409 Conflict 등) 시 원래 제목으로 복원
   */
  const handleTitleSave = async () => {
    if (editTitle.trim() && editTitle !== task.title && onUpdate) {
      try {
        await onUpdate({
          id: task.id,
          version: task.version,
          title: editTitle.trim(),
        });
      } catch {
        setEditTitle(task.title);
      }
    } else {
      setEditTitle(task.title);
    }
    setIsEditing(false);
  };

  /** 삭제 확인 후 처리 */
  const handleDelete = async () => {
    if (onDelete && window.confirm('이 일감을 삭제하시겠습니까?')) {
      await onDelete(task.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card p-4 cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-card-hover ${
        isDragging ? 'shadow-card-hover opacity-90 rotate-1 scale-105' : ''
      }`}
      {...listeners}
      {...attributes}
    >
      {/* 제목 영역: 더블클릭으로 인라인 수정 모드 전환 */}
      {isEditing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleTitleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleTitleSave();
            if (e.key === 'Escape') {
              setEditTitle(task.title);
              setIsEditing(false);
            }
          }}
          className="w-full px-2 py-1 border border-primary-300 rounded-input text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          autoFocus
        />
      ) : (
        <p
          className="text-sm font-medium text-gray-800 leading-relaxed"
          onDoubleClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          {task.title}
        </p>
      )}

      {/* 메타 정보: 생성자 아바타/이름, 삭제 버튼 */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-border">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary-700">
              {task.creator.name.charAt(0)}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {task.creator.name}
          </span>
        </div>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            aria-label="삭제"
          >
            {/* 삭제 아이콘 */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
