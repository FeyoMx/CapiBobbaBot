// Custom React Query hooks for dashboard metrics
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { DashboardMetrics } from '@/types';

// ============================================================================
// Query Keys
// ============================================================================

export const queryKeys = {
  metrics: ['metrics'] as const,
  salesChart: (range: string) => ['salesChart', range] as const,
  revenueByProduct: ['revenueByProduct'] as const,
  geminiUsage: ['geminiUsage'] as const,
  recentOrders: (limit: number) => ['recentOrders', limit] as const,
  orders: (params?: Record<string, unknown>) => ['orders', params] as const,
  order: (id: string) => ['order', id] as const,
  securityEvents: (params?: Record<string, unknown>) => ['securityEvents', params] as const,
  securityStats: ['securityStats'] as const,
  health: ['health'] as const,
  surveyResults: ['surveyResults'] as const,
};

// ============================================================================
// Dashboard Metrics Hook
// ============================================================================

export function useMetrics(
  options?: Omit<UseQueryOptions<DashboardMetrics, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<DashboardMetrics, Error>({
    queryKey: queryKeys.metrics,
    queryFn: () => apiClient.getMetrics(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every 60 seconds
    ...options,
  });
}

// ============================================================================
// Sales Chart Hook
// ============================================================================

export function useSalesChart(
  range: 'daily' | 'weekly' | 'monthly' = 'daily',
  options?: Omit<UseQueryOptions<unknown, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.salesChart(range),
    queryFn: () => apiClient.getSalesChart(range),
    staleTime: 60000, // 1 minute
    ...options,
  });
}

// ============================================================================
// Revenue by Product Hook
// ============================================================================

export function useRevenueByProduct(
  options?: Omit<UseQueryOptions<unknown, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.revenueByProduct,
    queryFn: () => apiClient.getRevenueByProduct(),
    staleTime: 60000,
    ...options,
  });
}

// ============================================================================
// Gemini Usage Hook
// ============================================================================

export function useGeminiUsage(
  options?: Omit<UseQueryOptions<unknown, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.geminiUsage,
    queryFn: () => apiClient.getGeminiUsage(),
    staleTime: 30000,
    ...options,
  });
}

// ============================================================================
// Recent Orders Hook
// ============================================================================

export function useRecentOrders(
  limit: number = 10,
  options?: Omit<UseQueryOptions<unknown, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.recentOrders(limit),
    queryFn: () => apiClient.getRecentOrders(limit),
    staleTime: 30000,
    refetchInterval: 60000,
    ...options,
  });
}

// ============================================================================
// Health Check Hook
// ============================================================================

export function useHealth(
  options?: Omit<UseQueryOptions<unknown, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => apiClient.getHealth(),
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
    ...options,
  });
}

// ============================================================================
// Security Stats Hook
// ============================================================================

export function useSecurityStats(
  options?: Omit<UseQueryOptions<unknown, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.securityStats,
    queryFn: () => apiClient.getSecurityStats(),
    staleTime: 60000,
    ...options,
  });
}
