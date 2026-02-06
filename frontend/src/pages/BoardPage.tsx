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
import Button from '../components/ui/Button';
import type { Task, TaskStatus } from '../types';

/** 칸반 보드 컬럼 정의 - 상태값과 표시 이름을 매핑 */
const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'TODO', title: 'Todo' },
  { id: 'DOING', title: 'Doing' },
  { id: 'DONE', title: 'Done' },
];

/**
 * 칸반 보드 페이지
 *
 * 구조 (SRP에 따른 책임 분리):
 * - BoardPage: 전체 페이지 레이아웃 및 드래그앤드랍 컨텍스트 관리
 * - KanbanColumn: 개별 컬럼 렌더링 및 드랍 영역 관리
 * - TaskCard: 개별 카드 렌더링 및 드래그 동작 관리
 * - useTasks 훅: 서버 상태 관리(CRUD) 및 WebSocket 실시간 동기화
 *
 * 드래그앤드랍 상태 전이 로직:
 * - DragStart: 드래그 중인 일감을 추적하여 DragOverlay에 표시
 * - DragEnd: 드랍된 컬럼의 상태로 일감 업데이트 (version 포함하여 낙관적 잠금 적용)
 */
export default function BoardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const { tasks, isLoading, createTask, updateTask, deleteTask } =
    useTasks(searchQuery || undefined);
  const { logout } = useAuth();
  const user = useAuthStore((s) => s.user);

  /**
   * 드래그 센서 설정
   * - PointerSensor: 마우스/터치 이벤트 기반 드래그
   * - activationConstraint: 5px 이상 움직여야 드래그 시작
   *   (클릭과 드래그를 구분하기 위한 최소 이동 거리)
   */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  /**
   * 상태별로 일감을 그룹핑 - 각 컬럼에 표시할 일감 목록
   * - 검색 결과가 없어도 빈 컬럼이 유지됨 (레이아웃 안정성 보장)
   */
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

  /** 드래그 시작: 현재 드래그 중인 일감을 상태에 저장 */
  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  /**
   * 드래그 종료: 일감의 상태를 새 컬럼의 상태로 변경
   * - over: 드랍 대상 컬럼의 ID (TaskStatus)
   * - 같은 컬럼에 드랍한 경우 무시
   * - version을 포함하여 낙관적 잠금 적용
   */
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === taskId);

    // 같은 컬럼에 드랍한 경우 또는 일감을 찾을 수 없는 경우 무시
    if (!task || task.status === newStatus) return;

    try {
      // 낙관적 잠금: 현재 일감의 version을 함께 전송
      // 다른 사용자가 이미 수정한 경우 409 Conflict 에러 발생
      await updateTask({
        id: taskId,
        version: task.version,
        status: newStatus,
      });
    } catch {
      // 에러 처리는 useTasks 훅의 onError에서 수행
    }
  };

  return (
    <div className="min-h-screen bg-surface-background">
      {/* 상단 헤더: 검색 입력이 고정 위치에서 항상 표시 */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-surface-border px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-gray-900 shrink-0">
            칸반 보드
          </h1>

          {/* 검색 입력: 상단 고정, 입력 과정에서 실시간으로 필터링 */}
          <div className="flex-1 max-w-md">
            <SearchInput
              placeholder="제목 또는 생성자로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* 사용자 아바타와 이름 */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-700">
                  {user?.name?.charAt(0)}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700">
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
        </div>
      </header>

      {/* 칸반 보드 영역 */}
      <main className="max-w-7xl mx-auto p-6">
        {/* 일감 추가 버튼 */}
        <div className="mb-6 flex justify-end">
          <Button
            className="w-auto px-5 py-2.5"
            onClick={() => setIsCreateModalOpen(true)}
          >
            + 새 일감
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : (
          /**
           * DndContext: dnd-kit의 드래그앤드랍 컨텍스트
           * - closestCorners: 가장 가까운 모서리를 기준으로 드랍 대상 결정
           * - DragOverlay: 드래그 중인 요소의 미리보기 (원래 위치와 별도로 표시)
           */
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-3 gap-5">
              {COLUMNS.map((column) => (
                <KanbanColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  tasks={tasksByStatus[column.id]}
                  onUpdateTask={updateTask}
                  onDeleteTask={deleteTask}
                />
              ))}
            </div>

            {/* 드래그 오버레이: 드래그 중인 카드의 미리보기 */}
            <DragOverlay>
              {activeTask ? (
                <TaskCard task={activeTask} isDragging />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </main>

      {/* 일감 생성 모달 */}
      {isCreateModalOpen && (
        <CreateTaskModal
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={async (title) => {
            await createTask(title);
            setIsCreateModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
