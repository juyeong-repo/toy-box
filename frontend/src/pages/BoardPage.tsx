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
import { useAuthStore } from '../stores/authStore';
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
  const user = useAuthStore((s) => s.user);

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
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-surface-border px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-bold text-black uppercase tracking-tighter shrink-0">
            BLOOMING KANBAN
          </h1>

          <div className="flex items-center gap-3 shrink-0 order-2 sm:order-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-700">
                  {user?.name?.charAt(0)}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                {user?.name}
              </span>
            </div>
            <button
              onClick={logout}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              로그아웃
            </button>
          </div>

          <div className="w-full sm:w-auto sm:flex-1 sm:max-w-md order-3 sm:order-2">
            <SearchInput
              placeholder="제목 또는 작성자로 검색해주세요."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6">
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
