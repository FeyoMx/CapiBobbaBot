'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { OrderDetailModal } from '@/components/orders/OrderDetailModal';
import { useOrders, exportOrdersToCSV } from '@/lib/hooks/useOrders';
import { useWebSocket } from '@/lib/providers/WebSocketProvider';
import { ShoppingCart, Wifi, WifiOff } from 'lucide-react';
import type { Order } from '@/types';

export default function PedidosPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({
    status: 'all',
    paymentMethod: 'all',
    search: '',
  });
  const { isConnected } = useWebSocket();

  const {
    data: ordersResponse,
    isLoading,
    error,
  } = useOrders({
    page,
    limit: pageSize,
    status: filters.status !== 'all' ? filters.status : undefined,
    payment_method: filters.paymentMethod !== 'all' ? filters.paymentMethod : undefined,
    search: filters.search || undefined,
  });

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleExportCSV = () => {
    if (ordersResponse?.orders) {
      const filename = `pedidos_${new Date().toISOString().split('T')[0]}.csv`;
      exportOrdersToCSV(ordersResponse.orders, filename);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  };

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1); // Reset to first page when filters change
  };

  const totalPages = Math.ceil((ordersResponse?.total || 0) / pageSize);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <ShoppingCart className="h-8 w-8 text-primary" />
              Pedidos
            </h2>
            <p className="text-muted-foreground">
              Gestión completa de pedidos con actualizaciones en tiempo real
            </p>
          </div>

          {/* WebSocket Status */}
          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-green-500">Conectado</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Desconectado</span>
              </>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error al cargar pedidos</CardTitle>
              <CardDescription>{error.message}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Asegúrate de que el backend esté corriendo en {process.env.NEXT_PUBLIC_API_URL}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Todos los Pedidos ({ordersResponse?.total || 0})
            </CardTitle>
            <CardDescription>
              Busca, filtra y gestiona todos los pedidos del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrdersTable
              orders={ordersResponse?.orders || []}
              isLoading={isLoading}
              onViewOrder={handleViewOrder}
              onExportCSV={handleExportCSV}
              filters={filters}
              onFiltersChange={handleFilterChange}
            />

            {/* Pagination */}
            {!isLoading && ordersResponse && ordersResponse.total > 0 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={ordersResponse.total}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            )}
          </CardContent>
        </Card>

        {/* Order Detail Modal */}
        <OrderDetailModal
          order={selectedOrder}
          open={isModalOpen}
          onClose={handleCloseModal}
        />
      </div>
    </DashboardLayout>
  );
}
