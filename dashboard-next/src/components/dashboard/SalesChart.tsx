'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSalesChart } from '@/lib/hooks/useMetrics';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function SalesChart() {
  const { data, isLoading, error } = useSalesChart('daily');

  if (error) {
    return (
      <Card className="h-[420px]">
        <CardHeader>
          <CardTitle>Ventas (24h)</CardTitle>
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
          <CardTitle>Ventas (24h)</CardTitle>
          <CardDescription>Cargando...</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <div className="h-full w-full bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  // Mock data for now (until backend endpoint is ready)
  const chartData = data?.daily || [
    { timestamp: new Date().toISOString(), value: 0 },
  ];

  return (
    <Card className="h-[420px]">
      <CardHeader>
        <CardTitle>Ventas (24h)</CardTitle>
        <CardDescription>
          Pedidos completados en las últimas 24 horas
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) => format(new Date(value), 'HH:mm', { locale: es })}
              className="text-xs"
            />
            <YAxis className="text-xs" />
            <Tooltip
              labelFormatter={(value) =>
                format(new Date(value), 'PPp', { locale: es })
              }
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
