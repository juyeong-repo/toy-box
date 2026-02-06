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
}

const COLUMN_CONFIG: Record<TaskStatus, { overBg: string; countBg: string }> = {
  TODO: { overBg: 'bg-primary-50/60 ring-2 ring-primary-200', countBg: 'bg-gray-200 text-gray-600' },
  DOING: { overBg: 'bg-blue-50/60 ring-2 ring-blue-200', countBg: 'bg-blue-100 text-blue-600' },
  DONE: { overBg: 'bg-green-50/60 ring-2 ring-green-200', countBg: 'bg-green-100 text-green-600' },
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
      className={`rounded-[12px] p-4 min-h-[520px] transition-all duration-200 ${
        isOver ? config.overBg : 'bg-gray-100/80'
      }`}
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="font-semibold text-gray-800 text-sm tracking-tight">{title}</h2>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.countBg}`}>
          {tasks.length}
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
    </div>
  );
}
