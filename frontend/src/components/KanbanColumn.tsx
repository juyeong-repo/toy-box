import { useDroppable } from '@dnd-kit/core';
import TaskCard from './TaskCard';
import type { Task, TaskStatus } from '../types';

/**
 * 칸반 보드 컬럼 컴포넌트 (SRP)
 * - 단일 책임: 한 개의 상태 컬럼 렌더링 및 드래그 드랍 영역 정의
 * - useDroppable: 이 컬럼을 드래그 가능한 요소의 드랍 대상 영역으로 등록
 * - 컬럼 ID(TaskStatus)가 드랍 시 새 상태 값으로 사용됨
 * - isOver: 드래그 중인 요소가 이 컬럼 위에 있을 때 시각적 피드백 제공
 */
interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  onUpdateTask: (params: {
    id: string;
    version: number;
    title?: string;
    status?: TaskStatus;
  }) => Promise<Task>;
  onDeleteTask: (id: string) => Promise<void>;
}

/**
 * 상태별 컬럼 헤더 색상 및 드래그오버 색상 매핑
 * - 새로운 상태 추가 시 이 객체에만 추가하면 됨 (OCP)
 */
const COLUMN_CONFIG: Record<TaskStatus, { dot: string; overBg: string; countBg: string }> = {
  TODO: { dot: 'bg-gray-400', overBg: 'bg-primary-50/60 ring-2 ring-primary-200', countBg: 'bg-gray-200 text-gray-500' },
  DOING: { dot: 'bg-blue-500', overBg: 'bg-blue-50/60 ring-2 ring-blue-200', countBg: 'bg-blue-100 text-blue-600' },
  DONE: { dot: 'bg-green-500', overBg: 'bg-green-50/60 ring-2 ring-green-200', countBg: 'bg-green-100 text-green-600' },
};

export default function KanbanColumn({
  id,
  title,
  tasks,
  onUpdateTask,
  onDeleteTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const config = COLUMN_CONFIG[id];

  return (
    <div
      ref={setNodeRef}
      className={`rounded-card p-4 min-h-[520px] transition-all duration-200 ${
        isOver ? config.overBg : 'bg-surface-background'
      }`}
    >
      {/* 컬럼 헤더: 상태 표시 점 + 이름 + 일감 개수 뱃지 */}
      <div className="flex items-center gap-2.5 mb-4 px-1">
        <div className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
        <h2 className="font-semibold text-gray-800 text-sm">{title}</h2>
        <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${config.countBg}`}>
          {tasks.length}
        </span>
      </div>

      {/* 일감 카드 목록 - 검색 시 매칭되지 않으면 빈 컬럼 표시 */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onUpdate={onUpdateTask}
            onDelete={onDeleteTask}
          />
        ))}
      </div>
    </div>
  );
}
