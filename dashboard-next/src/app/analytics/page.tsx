'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Análisis avanzado de datos y tendencias
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle>Analytics - Próximamente</CardTitle>
            </div>
            <CardDescription>
              Sprint 4 - Dashboard de analytics avanzado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">🔨 Planificado para Sprint 4:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Análisis de ventas por período</li>
                <li>Productos más vendidos</li>
                <li>Horas pico de pedidos</li>
                <li>Análisis de clientes recurrentes</li>
                <li>Métricas de conversación (Gemini)</li>
                <li>ROI de campañas</li>
                <li>Reportes exportables (PDF, Excel)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
