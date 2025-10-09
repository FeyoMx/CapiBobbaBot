// Custom React Query hooks for security events
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { SecurityEvent, PaginationParams } from '@/types';

// ============================================================================
// Query Keys
// ============================================================================

export const securityEventKeys = {
  all: ['securityEvents'] as const,
  lists: () => [...securityEventKeys.all, 'list'] as const,
  list: (params?: PaginationParams & { severity?: string }) => [...securityEventKeys.lists(), params] as const,
};

// ============================================================================
// Security Events List Hook
// ============================================================================

export function useSecurityEvents(
  params?: PaginationParams & { severity?: string },
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<any, Error>({
    queryKey: securityEventKeys.list(params),
    queryFn: () => apiClient.getSecurityEvents(params),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
    ...options,
  });
}

// ============================================================================
// Resolve Security Event Mutation
// ============================================================================

export function useResolveSecurityEvent() {
  const queryClient = useQueryClient();

  return useMutation<SecurityEvent, Error, string>({
    mutationFn: (id: string) => apiClient.resolveSecurityEvent(id),
    onSuccess: (resolvedEvent) => {
      // Invalidate and refetch security events list
      queryClient.invalidateQueries({ queryKey: securityEventKeys.lists() });

      // Optionally update the cache optimistically
      queryClient.setQueriesData<any>(
        { queryKey: securityEventKeys.lists() },
        (oldData: any) => {
          if (!oldData?.events) return oldData;

          return {
            ...oldData,
            events: oldData.events.map((event: SecurityEvent) =>
              event.id === resolvedEvent.id ? resolvedEvent : event
            ),
          };
        }
      );
    },
  });
}
