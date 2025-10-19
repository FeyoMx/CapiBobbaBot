'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useRecentOrders } from '@/lib/hooks/useMetrics';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import type { Order } from '@/types';

const statusColors = {
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  confirmed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  preparing: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  ready: 'bg-green-500/10 text-green-500 border-green-500/20',
  delivered: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const statusLabels = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export function RecentOrdersTable() {
  const { data: orders, isLoading, error } = useRecentOrders(10);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pedidos Recientes</CardTitle>
          <CardDescription>Error al cargar pedidos</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pedidos Recientes</CardTitle>
          <CardDescription>Últimos 10 pedidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const ordersData: Order[] = orders || [];

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pedidos Recientes</CardTitle>
            <CardDescription>Últimos 10 pedidos realizados</CardDescription>
          </div>
          <Link
            href="/pedidos"
            className="text-sm text-primary hover:underline font-medium"
          >
            Ver todos →
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {ordersData.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No hay pedidos recientes"
            description="Los pedidos aparecerán aquí cuando los clientes realicen compras a través del chatbot de WhatsApp."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    ID
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Cliente
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Items
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Total
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                    Estado
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody>
                {ordersData.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/pedidos/${order.id}`}
                        className="text-sm font-mono text-primary hover:underline"
                      >
                        {order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium">{order.customer_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {order.customer_phone}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        {order.items?.length ? `${order.items.length} item${order.items.length !== 1 ? 's' : ''}` : 'Pedido'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {order.items?.[0]?.name || (order.summary ? order.summary.split('\n')[0].substring(0, 40) + '...' : 'Ver detalles')}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="text-sm font-semibold">
                        ${order.total.toLocaleString('es-MX')}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant="outline"
                        className={statusColors[order.status]}
                      >
                        {statusLabels[order.status]}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="text-sm">
                        {format(new Date(order.created_at || order.timestamp || Date.now()), 'dd MMM', { locale: es })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(order.created_at || order.timestamp || Date.now()), 'HH:mm', { locale: es })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
