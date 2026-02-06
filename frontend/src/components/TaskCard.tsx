import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Task, TaskStatus } from '../types';

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

  const handleDelete = async () => {
    if (onDelete && window.confirm('이 일감을 삭제하시겠습니까?')) {
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
            className="flex-1 px-2 py-1 bg-surface-input rounded-input text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoFocus
          />
        ) : (
          <p
            className="flex-1 text-sm font-medium text-gray-800 leading-relaxed cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
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
            className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 mt-0.5"
            aria-label="삭제"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="mt-3">
        <span className="text-[11px] text-gray-400">
          {task.creator.name}
        </span>
      </div>
    </div>
  );
}
