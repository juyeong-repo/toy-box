import { useDroppable } from '@dnd-kit/core';
import TaskCard from './TaskCard';
import type { Task, TaskStatus } from '../types';

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
  onCreateTask?: () => void;
}

const COLUMN_CONFIG: Record<TaskStatus, { bg: string; overBg: string; titleBg: string }> = {
    TODO: {
      bg: 'bg-slate-100/80',
      overBg: 'bg-slate-200/80 ring-2 ring-slate-300',
      titleBg: 'bg-slate-300/80',
    },

    DOING: {
      bg: 'bg-violet-50/70',
      overBg: 'bg-violet-100/70 ring-2 ring-violet-200',
      titleBg: 'bg-violet-200/80',
    },

    DONE: {
      bg: 'bg-gray-200/80',
      overBg: 'bg-gray-300 ring-2 ring-gray-400',
      titleBg: 'bg-gray-300/80',
    },
};

export default function KanbanColumn({
  id,
  title,
  tasks,
  onUpdateTask,
  onDeleteTask,
  onCreateTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const config = COLUMN_CONFIG[id];

  return (
    <div
      ref={setNodeRef}
      className={`rounded-[12px] p-4 min-h-[520px] transition-all duration-200 ${
        isOver ? config.overBg : config.bg
      }`}
    >
      <div className="flex items-center mb-4 px-1">
        <span className={`inline-block font-bold text-gray-800 text-sm tracking-tight px-4 py-1.5 rounded-full ${config.titleBg}`}>
          {title}
        </span>
      </div>

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

      {onCreateTask && (
        <button
          onClick={onCreateTask}
          className="mt-3 w-full py-3 px-4 text-sm text-gray-800 bg-white/0 border border-dashed border-gray-300 rounded-[12px] hover:bg-white hover:text-gray-600 hover:border-gray-400 transition-all duration-200"
        >
          + 새 프로젝트
        </button>
      )}
    </div>
  );
}
