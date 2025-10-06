'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { GeminiUsageChart } from '@/components/dashboard/GeminiUsageChart';
import { RecentOrdersTable } from '@/components/dashboard/RecentOrdersTable';
import { HealthStatus } from '@/components/HealthStatus';
import { SystemPerformanceChart } from '@/components/SystemPerformanceChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, DollarSign, Cpu, Database } from 'lucide-react';
import { useMetrics } from '@/lib/hooks/useMetrics';

export default function Home() {
  const { data: metrics, isLoading, error } = useMetrics();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-muted-foreground">
            Bienvenido al dashboard de CapiBobbaBot
          </p>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error al cargar métricas</CardTitle>
              <CardDescription>{error.message}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Asegúrate de que el backend esté corriendo en {process.env.NEXT_PUBLIC_API_URL}
              </p>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Pedidos Hoy"
            value={metrics?.orders.today ?? 0}
            icon={ShoppingCart}
            trend={metrics?.orders.trend}
            isLoading={isLoading}
          />

          <MetricCard
            title="Revenue 24h"
            value={
              metrics?.revenue?.today !== undefined
                ? `$${metrics.revenue.today.toLocaleString('es-MX')}`
                : '$0'
            }
            icon={DollarSign}
            trend={metrics?.revenue?.trend}
            isLoading={isLoading}
          />

          <MetricCard
            title="Gemini Calls"
            value={metrics?.gemini.calls_today ?? 0}
            icon={Cpu}
            trend={metrics?.gemini.trend}
            description="hoy"
            isLoading={isLoading}
          />

          <MetricCard
            title="Cache Hit Rate"
            value={
              metrics?.cache?.hit_rate !== undefined
                ? `${metrics.cache.hit_rate.toFixed(1)}%`
                : '0%'
            }
            icon={Database}
            trend={metrics?.cache?.trend}
            isLoading={isLoading}
          />
        </div>

        {/* System Health */}
        <HealthStatus />

        {/* System Performance Chart */}
        <SystemPerformanceChart />

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SalesChart />
          <RevenueChart />
          <GeminiUsageChart />
        </div>

        {/* Recent Orders Table */}
        <RecentOrdersTable />

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>✨ Dashboard v1.0 - Completado</CardTitle>
            <CardDescription>
              Dashboard completo con todas las funcionalidades implementadas (Sprints 1-5)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">✅ Funcionalidades Principales:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Dashboard Overview con métricas en tiempo real</li>
                <li>Sistema de gestión de pedidos completo</li>
                <li>Analytics avanzado con gráficos interactivos</li>
                <li>Panel de seguridad con eventos y estadísticas</li>
                <li>WebSocket para actualizaciones en tiempo real</li>
                <li>Dark mode y UI moderna con Tailwind CSS</li>
                <li>Integración completa con API backend</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm">🚀 Tecnologías:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Next.js 14 + TypeScript + React 18</li>
                <li>TanStack Query para gestión de estado</li>
                <li>Recharts para visualizaciones</li>
                <li>Shadcn UI + Tailwind CSS</li>
                <li>WebSocket para comunicación real-time</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
