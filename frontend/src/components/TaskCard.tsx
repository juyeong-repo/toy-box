import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Task, TaskStatus } from '../types';
import ConfirmModal from './ui/ConfirmModal';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

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

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    if (onDelete) {
      await onDelete(task.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-[12px] p-4 cursor-grab active:cursor-grabbing transition-all duration-200 ${
        isDragging
          ? 'shadow-card-drag opacity-90 rotate-2 scale-105'
          : 'shadow-card hover:shadow-card-hover'
      }`}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start justify-between gap-2">
        {isEditing ? (
          <div className="flex-1">
            <input
              type="text"
              value={editTitle}
              maxLength={200}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave();
                if (e.key === 'Escape') {
                  setEditTitle(task.title);
                  setIsEditing(false);
                }
              }}
              className="w-full px-2 py-1 bg-surface-input rounded-input text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
            <span className={`text-[11px] mt-0.5 block text-right ${editTitle.length >= 200 ? 'text-red-500' : 'text-gray-400'}`}>
              {editTitle.length}/200
            </span>
          </div>
        ) : (
          <p
            className="flex-1 text-sm font-medium text-gray-800 leading-relaxed cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1.5 -mt-0.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {task.title}
          </p>
        )}

        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="text-gray-300 hover:text-gray-600 hover:bg-gray-200 rounded p-0.5 transition-colors shrink-0 mt-0.5"
            aria-label="삭제"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] text-gray-400">
          담당자 : {task.creator.name}
        </span>

        {/* Mobile: status change buttons */}
        {onUpdate && (
          <div className="md:hidden flex items-center gap-1">
            {task.status !== 'TODO' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const prev: Record<string, TaskStatus> = { DOING: 'TODO', DONE: 'DOING' };
                  onUpdate({ id: task.id, version: task.version, status: prev[task.status] });
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="이전 상태로"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {task.status !== 'DONE' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const next: Record<string, TaskStatus> = { TODO: 'DOING', DOING: 'DONE' };
                  onUpdate({ id: task.id, version: task.version, status: next[task.status] });
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="다음 상태로"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          title="태스크 삭제"
          message="이 태스크를 삭제하시겠습니까?"
          confirmLabel="삭제"
          cancelLabel="취소"
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
