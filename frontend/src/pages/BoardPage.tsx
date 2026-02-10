import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
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
  const [activeColumnIndex, setActiveColumnIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const columns = container.querySelectorAll('[id^="column-"]');
    if (columns.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const id = entry.target.id.replace('column-', '') as TaskStatus;
            const index = COLUMNS.findIndex((c) => c.id === id);
            if (index !== -1) setActiveColumnIndex(index);
          }
        });
      },
      { root: container, threshold: 0.5 },
    );

    columns.forEach((col) => observer.observe(col));
    return () => observer.disconnect();
  }, [isLoading]);

  const scrollToColumn = useCallback((index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const target = container.querySelector(`#column-${COLUMNS[index].id}`);
    target?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    setActiveColumnIndex(index);
  }, []);

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
        {/* Mobile header: 세로 배치 */}
        <header className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between md:gap-4 md:py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-black uppercase tracking-tight shrink-0">
              BLOOMING KANBAN
            </h1>
            <button
              onClick={logout}
              className="md:hidden text-sm text-gray-500 hover:text-gray-800 underline underline-offset-2 transition-colors whitespace-nowrap"
            >
              로그아웃
            </button>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="flex-1 md:w-64 md:flex-none">
              <SearchInput
                placeholder="검색어를 입력해 주세요."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={logout}
              className="hidden md:block text-sm text-gray-500 hover:text-gray-800 underline underline-offset-2 transition-colors whitespace-nowrap"
            >
              로그아웃
            </button>
          </div>
        </header>
      </div>

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
            {/* Mobile: Tab Indicator */}
            <div className="md:hidden flex gap-1 mb-4 mx-4 bg-gray-100 rounded-full p-1">
              {COLUMNS.map((column, index) => (
                <button
                  key={column.id}
                  onClick={() => scrollToColumn(index)}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 ${
                    activeColumnIndex === index
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  {column.title}
                  <span className="ml-1.5 text-xs text-gray-400">
                    {tasksByStatus[column.id].length}
                  </span>
                </button>
              ))}
            </div>

            {/* Mobile: Horizontal swipe container - 전체 화면 너비 사용 */}
            <div
              ref={scrollContainerRef}
              className="md:hidden flex overflow-x-auto snap-x snap-mandatory mobile-swipe-container px-4 gap-4"
            >
              {COLUMNS.map((column) => (
                <KanbanColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  tasks={tasksByStatus[column.id]}
                  onUpdateTask={updateTask}
                  onDeleteTask={deleteTask}
                  onCreateTask={() => setCreateForStatus(column.id)}
                  mobileSwipe
                />
              ))}
            </div>

            {/* Desktop: Grid layout */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-7xl mx-auto px-4 sm:px-6">
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
