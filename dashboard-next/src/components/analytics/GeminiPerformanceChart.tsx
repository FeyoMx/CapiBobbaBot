'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useGeminiUsage } from '@/lib/hooks/useMetrics';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Cpu, Zap } from 'lucide-react';

export function GeminiPerformanceChart() {
  const { data, isLoading, error } = useGeminiUsage();

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rendimiento de Gemini AI</CardTitle>
          <CardDescription>Error al cargar datos</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  // Ensure chartData is always an array
  const chartData = Array.isArray(data) ? data : [];

  const avgResponseTime = chartData.length > 0
    ? chartData.reduce((acc: number, item: any) => acc + (item.avg_response_time || 0), 0) / chartData.length
    : 0;

  const totalCalls = chartData.length > 0
    ? chartData.reduce((acc: number, item: any) => acc + (item.calls || 0), 0)
    : 0;

  const totalCacheHits = chartData.length > 0
    ? chartData.reduce((acc: number, item: any) => acc + (item.cache_hits || 0), 0)
    : 0;

  const cacheHitRate = totalCalls > 0 ? (totalCacheHits / totalCalls) * 100 : 0;

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary" />
          Rendimiento de Gemini AI
        </CardTitle>
        <CardDescription>
          Análisis de uso y performance de la IA
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[400px] w-full bg-muted animate-pulse rounded" />
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Total de Llamadas
                </div>
                <div className="text-2xl font-bold">{totalCalls}</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground">Cache Hit Rate</div>
                <div className="text-2xl font-bold text-green-600">
                  {cacheHitRate.toFixed(1)}%
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground">Tiempo Promedio</div>
                <div className="text-2xl font-bold">
                  {avgResponseTime.toFixed(0)}ms
                </div>
              </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => {
                    try {
                      return format(parseISO(value), 'HH:mm', { locale: es });
                    } catch {
                      return value;
                    }
                  }}
                  className="text-xs"
                />
                <YAxis yAxisId="left" className="text-xs" />
                <YAxis yAxisId="right" orientation="right" className="text-xs" />
                <Tooltip
                  labelFormatter={(value) => {
                    try {
                      return format(parseISO(value), 'PPp', { locale: es });
                    } catch {
                      return value;
                    }
                  }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="calls"
                  fill="hsl(var(--primary))"
                  name="Total Llamadas"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="left"
                  dataKey="cache_hits"
                  fill="hsl(142 76% 36%)"
                  name="Cache Hits"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avg_response_time"
                  stroke="hsl(38 92% 50%)"
                  strokeWidth={2}
                  name="Tiempo Respuesta (ms)"
                  dot={{ fill: 'hsl(38 92% 50%)' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}
