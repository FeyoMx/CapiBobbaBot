'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useRevenueByProduct } from '@/lib/hooks/useMetrics';

export function RevenueChart() {
  const { data, isLoading, error } = useRevenueByProduct();

  if (error) {
    return (
      <Card className="h-[420px]">
        <CardHeader>
          <CardTitle>Revenue por Producto</CardTitle>
          <CardDescription>Error al cargar datos</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="h-[420px]">
        <CardHeader>
          <CardTitle>Revenue por Producto</CardTitle>
          <CardDescription>Cargando...</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <div className="h-full w-full bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  // Mock data for now (until backend endpoint is ready)
  const chartData = data || [
    { product: 'Bubble Tea', revenue: 0, count: 0 },
  ];

  return (
    <Card className="h-[420px]">
      <CardHeader>
        <CardTitle>Revenue por Producto</CardTitle>
        <CardDescription>
          Top productos por ingresos
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="product" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              formatter={(value: number) => `$${value.toLocaleString('es-MX')}`}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Bar
              dataKey="revenue"
              fill="hsl(var(--primary))"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
