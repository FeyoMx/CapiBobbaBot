// Custom React Query hooks for orders
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { Order, OrdersResponse, PaginationParams, OrderStatus } from '@/types';

// ============================================================================
// Query Keys
// ============================================================================

interface UseOrdersParams extends PaginationParams {
  status?: string;
  payment_method?: string;
  search?: string;
}

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (params?: UseOrdersParams) => [...orderKeys.lists(), params] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

// ============================================================================
// Orders List Hook
// ============================================================================

export function useOrders(
  params?: UseOrdersParams,
  options?: Omit<UseQueryOptions<OrdersResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<OrdersResponse, Error>({
    queryKey: orderKeys.list(params),
    queryFn: () => apiClient.getOrders(params),
    staleTime: 30000, // 30 seconds
    ...options,
  });
}

// ============================================================================
// Single Order Hook
// ============================================================================

export function useOrder(
  id: string,
  options?: Omit<UseQueryOptions<Order, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Order, Error>({
    queryKey: orderKeys.detail(id),
    queryFn: () => apiClient.getOrder(id),
    staleTime: 30000,
    enabled: !!id,
    ...options,
  });
}

// ============================================================================
// Update Order Status Mutation
// ============================================================================

interface UpdateOrderStatusParams {
  id: string;
  status: OrderStatus;
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation<Order, Error, UpdateOrderStatusParams, { previousOrder: Order | undefined }>({
    mutationFn: ({ id, status }) => apiClient.updateOrderStatus(id, status),
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: orderKeys.detail(id) });

      // Snapshot previous value
      const previousOrder = queryClient.getQueryData<Order>(orderKeys.detail(id));

      // Optimistically update
      if (previousOrder) {
        queryClient.setQueryData<Order>(orderKeys.detail(id), {
          ...previousOrder,
          status,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousOrder };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousOrder) {
        queryClient.setQueryData(orderKeys.detail(variables.id), context.previousOrder);
      }
    },
    onSuccess: (updatedOrder) => {
      // Update the detail query
      queryClient.setQueryData(orderKeys.detail(updatedOrder.id), updatedOrder);

      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

// ============================================================================
// Export CSV Function
// ============================================================================

export function exportOrdersToCSV(orders: Order[], filename: string = 'pedidos.csv') {
  // CSV headers
  const headers = [
    'ID',
    'Cliente',
    'Teléfono',
    'Items',
    'Total',
    'Estado',
    'Método de Pago',
    'Fecha Creación',
    'Dirección',
    'Notas',
  ];

  // Convert orders to CSV rows
  const rows = orders.map((order) => [
    order.id,
    order.customer_name,
    order.customer_phone,
    order.items.map((item) => `${item.quantity}x ${item.name}`).join('; '),
    order.total.toString(),
    order.status,
    order.payment_method,
    new Date(order.created_at).toLocaleString('es-MX'),
    order.delivery_address || '',
    order.notes || '',
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
