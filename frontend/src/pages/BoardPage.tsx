import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useTasks } from '../hooks/useTasks';
import { useAuth } from '../hooks/useAuth';
import KanbanColumn from '../components/KanbanColumn';
import TaskCard from '../components/TaskCard';
import CreateTaskModal from '../components/CreateTaskModal';
import SearchInput from '../components/ui/SearchInput';
import type { Task, TaskStatus } from '../types';

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'TODO', title: 'Todo' },
  { id: 'DOING', title: 'Doing' },
  { id: 'DONE', title: 'Done' },
];

export default function BoardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [createForStatus, setCreateForStatus] = useState<TaskStatus | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const { tasks, isLoading, createTask, updateTask, deleteTask } =
    useTasks(searchQuery || undefined);
  const { logout } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      TODO: [],
      DOING: [],
      DONE: [],
    };
    tasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });
    return grouped;
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === taskId);

    if (!task || task.status === newStatus) return;

    try {
      await updateTask({
        id: taskId,
        version: task.version,
        status: newStatus,
      });
    } catch {
      // error handling in useTasks hook
    }
  };

  return (
    <div className="min-h-screen bg-surface-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <header className="flex items-center justify-between gap-4 py-6">
          <h1 className="text-xl font-bold text-black uppercase tracking-tight shrink-0">
            BLOOMING KANBAN
          </h1>

          <div className="flex items-center gap-4 shrink-0">
            <div className="w-64">
              <SearchInput
                placeholder="검색어를 입력해 주세요."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-800 underline underline-offset-2 transition-colors whitespace-nowrap"
            >
              로그아웃
            </button>
          </div>
        </header>

        <main className="pb-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {COLUMNS.map((column) => (
                <KanbanColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  tasks={tasksByStatus[column.id]}
                  onUpdateTask={updateTask}
                  onDeleteTask={deleteTask}
                  onCreateTask={() => setCreateForStatus(column.id)}
                />
              ))}
            </div>

            <DragOverlay>
              {activeTask ? (
                <TaskCard task={activeTask} isDragging />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
        </main>
      </div>

      {createForStatus && (
        <CreateTaskModal
          onClose={() => setCreateForStatus(null)}
          onSubmit={async (title) => {
            await createTask({ title, status: createForStatus });
            setCreateForStatus(null);
          }}
        />
      )}
    </div>
  );
}
