'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Package, User, Phone, MapPin, CreditCard, Calendar, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUpdateOrderStatus } from '@/lib/hooks/useOrders';
import type { Order, OrderStatus } from '@/types';

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  confirmed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  preparing: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  ready: 'bg-green-500/10 text-green-500 border-green-500/20',
  delivered: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const paymentMethodLabels = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  pending: 'Pendiente',
};

interface OrderDetailModalProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}

export function OrderDetailModal({ order, open, onClose }: OrderDetailModalProps) {
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  const updateStatusMutation = useUpdateOrderStatus();

  if (!order) return null;

  const handleUpdateStatus = async () => {
    if (!newStatus || newStatus === order.status) return;

    try {
      await updateStatusMutation.mutateAsync({
        id: order.id,
        status: newStatus,
      });
      setNewStatus('');
      // Show success toast (you can add a toast library later)
      alert(`Estado actualizado a: ${statusLabels[newStatus]}`);
    } catch (error) {
      alert('Error al actualizar el estado');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl" onClose={onClose}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Detalle del Pedido
          </DialogTitle>
          <DialogDescription>ID: {order.id}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 p-6">
          {/* Status and Actions */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-2">Estado Actual</div>
              <Badge variant="outline" className={`${statusColors[order.status]} text-base px-3 py-1`}>
                {statusLabels[order.status]}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                className="w-[180px]"
              >
                <option value="">Cambiar estado...</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value} disabled={value === order.status}>
                    {label}
                  </option>
                ))}
              </Select>
              <Button
                onClick={handleUpdateStatus}
                disabled={!newStatus || newStatus === order.status || updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? 'Actualizando...' : 'Actualizar'}
              </Button>
            </div>
          </div>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Nombre</div>
                  <div className="font-medium">{order.customer_name}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Teléfono
                  </div>
                  <div className="font-medium">{order.customer_phone}</div>
                </div>
              </div>

              {order.delivery_address && (
                <div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Dirección de Entrega
                  </div>
                  <div className="font-medium">{order.delivery_address}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Productos ({order.items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.category}
                        {item.notes && ` • ${item.notes}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {item.quantity} x ${item.price.toLocaleString('es-MX')}
                      </div>
                      <div className="text-sm font-semibold text-primary">
                        ${item.total.toLocaleString('es-MX')}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-3 border-t-2">
                  <div className="font-semibold text-lg">Total</div>
                  <div className="font-bold text-xl text-primary">
                    ${order.total.toLocaleString('es-MX')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment & Dates */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Método de Pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-medium capitalize">
                  {paymentMethodLabels[order.payment_method]}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Fechas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Creado:</span>{' '}
                  {format(new Date(order.created_at || order.timestamp || Date.now()), 'PPp', { locale: es })}
                </div>
                {order.confirmed_at && (
                  <div>
                    <span className="text-muted-foreground">Confirmado:</span>{' '}
                    {format(new Date(order.confirmed_at), 'PPp', { locale: es })}
                  </div>
                )}
                {order.delivered_at && (
                  <div>
                    <span className="text-muted-foreground">Entregado:</span>{' '}
                    {format(new Date(order.delivered_at), 'PPp', { locale: es })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
