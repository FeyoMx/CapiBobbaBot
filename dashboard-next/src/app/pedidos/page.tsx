'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { OrderDetailModal } from '@/components/orders/OrderDetailModal';
import { useOrders, exportOrdersToCSV } from '@/lib/hooks/useOrders';
import { useWebSocket } from '@/lib/providers/WebSocketProvider';
import { ShoppingCart, Wifi, WifiOff } from 'lucide-react';
import type { Order } from '@/types';

export default function PedidosPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isConnected } = useWebSocket();

  const {
    data: ordersResponse,
    isLoading,
    error,
  } = useOrders({
    page: 1,
    limit: 100,
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
            />
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
