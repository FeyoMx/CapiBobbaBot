'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';

export default function PedidosPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pedidos</h2>
          <p className="text-muted-foreground">
            Gestión completa de pedidos
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <CardTitle>Pedidos - Próximamente</CardTitle>
            </div>
            <CardDescription>
              Sprint 3 - Gestión avanzada de pedidos con TanStack Table
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">🔨 Planificado para Sprint 3:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Tabla completa de pedidos con paginación</li>
                <li>Filtros por estado, fecha, cliente</li>
                <li>Búsqueda de pedidos</li>
                <li>Ordenamiento por columnas</li>
                <li>Vista detallada de pedido</li>
                <li>Actualización de estado en tiempo real</li>
                <li>Exportar pedidos a CSV</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
