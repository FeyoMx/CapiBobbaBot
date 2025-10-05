'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useGeminiUsage } from '@/lib/hooks/useMetrics';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function GeminiUsageChart() {
  const { data, isLoading, error } = useGeminiUsage();

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gemini AI Usage</CardTitle>
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
      <Card>
        <CardHeader>
          <CardTitle>Gemini AI Usage</CardTitle>
          <CardDescription>Cargando...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  // Mock data for now (until backend endpoint is ready)
  const chartData = data || [
    {
      timestamp: new Date().toISOString(),
      calls: 0,
      cache_hits: 0,
      cache_misses: 0,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gemini AI Usage</CardTitle>
        <CardDescription>
          Llamadas y rendimiento de caché
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
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
            <Legend />
            <Area
              type="monotone"
              dataKey="calls"
              stackId="1"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              name="Total Calls"
            />
            <Area
              type="monotone"
              dataKey="cache_hits"
              stackId="2"
              stroke="hsl(142 76% 36%)"
              fill="hsl(142 76% 36%)"
              name="Cache Hits"
            />
            <Area
              type="monotone"
              dataKey="cache_misses"
              stackId="2"
              stroke="hsl(0 84% 60%)"
              fill="hsl(0 84% 60%)"
              name="Cache Misses"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
