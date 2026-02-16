import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import api from '../lib/axios';
import { getSocket } from '../lib/socket';
import type { Task, TaskStatus } from '../types';

/**
 * 태스크 관련 커스텀 훅
 * - TanStack Query로 서버 상태 관리 (목록 조회, 생성, 수정, 삭제)
 * - WebSocket 이벤트 리스너로 실시간 동기화
 *
 * 실시간 동기화 전략:
 * - 서버에서 WebSocket 이벤트를 수신하면 TanStack Query 캐시를 무효화
 * - 캐시 무효화 시 자동으로 데이터를 다시 조회하여 최신 상태 유지
 * - 이 방식은 캐시를 직접 조작하는 것보다 안전하고 간단
 */
export function useTasks(searchQuery?: string) {
  const queryClient = useQueryClient();
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  /** 태스크 목록 조회 - 검색어가 있으면 서버 사이드 필터링 */
  const tasksQuery = useQuery({
    queryKey: ['tasks', searchQuery || ''],

    queryFn: async () => {
      const params = searchQuery ? { search: searchQuery } : {};
      const { data } = await api.get<Task[]>('/tasks', { params });
      return data;
    },
  });

  /**
   * WebSocket 이벤트 리스너 설정
   * - task:created, task:updated, task:deleted 이벤트를 수신
   * - 이벤트 수신 시 태스크 목록 캐시를 무효화하여 자동 재조회
   */
  useEffect(() => {
    const socket = getSocket();

    const handleTaskEvent = () => {
      // 모든 태스크 관련 쿼리의 캐시를 무효화하여 최신 데이터로 갱신
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    };

    socket.on('task:created', handleTaskEvent);
    socket.on('task:updated', handleTaskEvent);
    socket.on('task:deleted', handleTaskEvent);

    return () => {
      socket.off('task:created', handleTaskEvent);
      socket.off('task:updated', handleTaskEvent);
      socket.off('task:deleted', handleTaskEvent);
    };
  }, [queryClient]);

  /** 태스크 생성 뮤테이션 */
  const createMutation = useMutation({
    mutationFn: async ({ title, status }: { title: string; status?: TaskStatus }) => {
      const { data } = await api.post<Task>('/tasks', { title, status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  /**
   * 태스크 수정 뮤테이션
   * - version 필드를 포함하여 낙관적 잠금 적용
   * - 409 Conflict 에러 시 충돌 메시지를 사용자에게 알림
   */
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      version,
      title,
      status,
    }: {
      id: string;
      version: number;
      title?: string;
      status?: TaskStatus;
    }) => {
      const { data } = await api.patch<Task>(`/tasks/${id}`, {
        version,
        title,
        status,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: any) => {
      // 낙관적 잠금 충돌 시 사용자에게 알림 후 최신 데이터로 갱신
      if (error.response?.status === 409) {
        setConflictMessage(
          error.response.data.message ||
            '다른 사용자가 먼저 수정했습니다. 새로고침 해주세요.',
        );
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }
    },
  });

  /** 태스크 삭제 뮤테이션 */
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return {
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading,
    createTask: createMutation.mutateAsync,
    updateTask: updateMutation.mutateAsync,
    deleteTask: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    conflictMessage,
    clearConflictMessage: () => setConflictMessage(null),
  };
}
