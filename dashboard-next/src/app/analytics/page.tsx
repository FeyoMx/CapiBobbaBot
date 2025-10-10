'use client';

import dynamic from 'next/dynamic';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Package, Cpu } from 'lucide-react';
import { useMetrics } from '@/lib/hooks/useMetrics';

// Lazy load heavy analytics charts with CLS-preventing skeletons
const SalesAnalysisChart = dynamic(
  () => import('@/components/analytics/SalesAnalysisChart').then(mod => ({ default: mod.SalesAnalysisChart })),
  {
    loading: () => (
      <Card className="col-span-full min-h-[640px]">
        <CardHeader>
          <CardTitle>Análisis de Ventas</CardTitle>
          <CardDescription>Cargando datos de ventas...</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[520px]">
          {/* Stats skeleton - Reserve exact space */}
          <div className="grid grid-cols-3 gap-4 mb-6 min-h-[100px]">
            <div className="p-4 rounded-lg bg-muted animate-pulse h-[100px]" />
            <div className="p-4 rounded-lg bg-muted animate-pulse h-[100px]" />
            <div className="p-4 rounded-lg bg-muted animate-pulse h-[100px]" />
          </div>
          {/* Chart skeleton - Fixed dimensions */}
          <div className="w-full h-[380px] bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    ),
    ssr: false,
  }
);

const TopProductsChart = dynamic(
  () => import('@/components/analytics/TopProductsChart').then(mod => ({ default: mod.TopProductsChart })),
  {
    loading: () => (
      <Card className="min-h-[620px]">
        <CardHeader>
          <CardTitle>Top 5 Productos</CardTitle>
          <CardDescription>Cargando productos más vendidos...</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[520px]">
          {/* Product list skeleton - Reserve exact space */}
          <div className="space-y-3 mb-6 min-h-[200px]">
            <div className="h-10 bg-muted animate-pulse rounded" />
            <div className="h-10 bg-muted animate-pulse rounded" />
            <div className="h-10 bg-muted animate-pulse rounded" />
            <div className="h-10 bg-muted animate-pulse rounded" />
            <div className="h-10 bg-muted animate-pulse rounded" />
          </div>
          {/* Chart skeleton - Fixed dimensions */}
          <div className="w-full h-[280px] bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    ),
    ssr: false,
  }
);

const GeminiPerformanceChart = dynamic(
  () => import('@/components/analytics/GeminiPerformanceChart').then(mod => ({ default: mod.GeminiPerformanceChart })),
  {
    loading: () => (
      <Card className="col-span-full min-h-[620px]">
        <CardHeader>
          <CardTitle>Rendimiento de Gemini AI</CardTitle>
          <CardDescription>Cargando métricas de IA...</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[520px]">
          {/* Stats skeleton - Reserve exact space */}
          <div className="grid grid-cols-3 gap-4 mb-6 min-h-[100px]">
            <div className="p-4 rounded-lg bg-muted animate-pulse h-[100px]" />
            <div className="p-4 rounded-lg bg-muted animate-pulse h-[100px]" />
            <div className="p-4 rounded-lg bg-muted animate-pulse h-[100px]" />
          </div>
          {/* Chart skeleton - Fixed dimensions */}
          <div className="w-full h-[380px] bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    ),
    ssr: false,
  }
);

export default function AnalyticsPage() {
  const { data: metrics, isLoading } = useMetrics();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Analytics
          </h2>
          <p className="text-muted-foreground">
            Análisis avanzado de datos y tendencias de negocio
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Pedidos
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : metrics?.orders.total ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Pedidos completados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Revenue Total
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading
                  ? '...'
                  : `$${metrics?.revenue.total.toLocaleString('es-MX') ?? 0}`}
              </div>
              <p className="text-xs text-muted-foreground">
                Ingresos totales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Llamadas Gemini
              </CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : metrics?.gemini.total_calls ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Conversaciones procesadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Ticket Promedio
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading
                  ? '...'
                  : metrics && metrics.orders.total > 0
                  ? `$${(metrics.revenue.total / metrics.orders.total).toFixed(0)}`
                  : '$0'}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor promedio por pedido
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sales Analysis */}
        <SalesAnalysisChart />

        {/* Charts Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          <TopProductsChart />

          <Card>
            <CardHeader>
              <CardTitle>Horas Pico de Pedidos</CardTitle>
              <CardDescription>
                Distribución de pedidos por hora del día
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Disponible próximamente</p>
                  <p className="text-xs mt-1">Requiere endpoint de backend</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gemini Performance */}
        <GeminiPerformanceChart />

        {/* Additional Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Clientes Recurrentes</CardTitle>
            <CardDescription>
              Análisis de clientes con múltiples pedidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Disponible próximamente</p>
                <p className="text-xs mt-1">Requiere endpoint de backend</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
