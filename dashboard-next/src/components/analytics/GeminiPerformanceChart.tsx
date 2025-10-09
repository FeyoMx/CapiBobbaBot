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
      <Card className="h-[620px]">
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

  // Extract hourly data from response
  const chartData = data?.hourly && Array.isArray(data.hourly) ? data.hourly : [];

  // Use totals from API
  const totalCalls = data?.totalRequests || 0;
  const totalCacheHits = data?.cacheHits || 0;
  const avgResponseTime = data?.avgResponseTime || 0;
  const cacheHitRate = data?.cacheHitRate || 0;

  return (
    <Card className="col-span-full h-[620px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary" />
          Rendimiento de Gemini AI
        </CardTitle>
        <CardDescription>
          Análisis de uso y performance de la IA
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[calc(100%-100px)]">
        {isLoading ? (
          <div className="h-full w-full bg-muted animate-pulse rounded" />
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6 h-[100px]">
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
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="hour"
                  className="text-xs"
                />
                <YAxis yAxisId="left" className="text-xs" />
                <YAxis yAxisId="right" orientation="right" className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="totalCalls"
                  fill="hsl(var(--primary))"
                  name="Total Llamadas"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="left"
                  dataKey="cacheHits"
                  fill="hsl(142 76% 36%)"
                  name="Cache Hits"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="left"
                  dataKey="cacheMisses"
                  fill="hsl(0 84% 60%)"
                  name="Cache Misses"
                  radius={[4, 4, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}
