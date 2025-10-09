'use client';

import dynamic from 'next/dynamic';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, DollarSign, Cpu, Database } from 'lucide-react';

// Lazy load heavy chart components for better performance
const SalesChart = dynamic(
  () => import('@/components/dashboard/SalesChart').then(mod => ({ default: mod.SalesChart })),
  {
    loading: () => (
      <Card className="h-[420px]">
        <CardHeader>
          <CardTitle>Ventas (24h)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <div className="h-full w-full bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    ),
    ssr: false, // Disable SSR for charts (not critical for SEO)
  }
);

const RevenueChart = dynamic(
  () => import('@/components/dashboard/RevenueChart').then(mod => ({ default: mod.RevenueChart })),
  {
    loading: () => (
      <Card className="h-[420px]">
        <CardHeader>
          <CardTitle>Revenue por Producto</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <div className="h-full w-full bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    ),
    ssr: false,
  }
);

const GeminiUsageChart = dynamic(
  () => import('@/components/dashboard/GeminiUsageChart').then(mod => ({ default: mod.GeminiUsageChart })),
  {
    loading: () => (
      <Card className="h-[460px]">
        <CardHeader>
          <CardTitle>Gemini AI Usage</CardTitle>
        </CardHeader>
        <CardContent className="h-[340px]">
          <div className="h-full w-full bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    ),
    ssr: false,
  }
);

const RecentOrdersTable = dynamic(
  () => import('@/components/dashboard/RecentOrdersTable').then(mod => ({ default: mod.RecentOrdersTable })),
  {
    loading: () => (
      <Card>
        <CardHeader>
          <CardTitle>Pedidos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    ),
  }
);

const HealthStatus = dynamic(
  () => import('@/components/HealthStatus').then(mod => ({ default: mod.HealthStatus })),
  {
    loading: () => (
      <div className="h-[100px] w-full bg-muted animate-pulse rounded" />
    ),
  }
);

const SystemPerformanceChart = dynamic(
  () => import('@/components/SystemPerformanceChart').then(mod => ({ default: mod.SystemPerformanceChart })),
  {
    loading: () => (
      <Card>
        <CardHeader>
          <CardTitle>Performance del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    ),
    ssr: false,
  }
);
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
