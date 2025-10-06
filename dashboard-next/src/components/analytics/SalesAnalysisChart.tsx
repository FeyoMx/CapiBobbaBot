'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useSalesChart } from '@/lib/hooks/useMetrics';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, Calendar } from 'lucide-react';

type TimeRange = 'daily' | 'weekly' | 'monthly';

export function SalesAnalysisChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');
  const { data, isLoading, error } = useSalesChart(timeRange);

  // Ensure chartData is always an array
  const chartData = Array.isArray(data?.daily) ? data.daily : Array.isArray(data) ? data : [];

  const totalSales = chartData.reduce((acc: number, item: any) => acc + (item.value || 0), 0);
  const avgSales = chartData.length > 0 ? totalSales / chartData.length : 0;

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análisis de Ventas</CardTitle>
          <CardDescription>Error al cargar datos</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Análisis de Ventas
            </CardTitle>
            <CardDescription>
              Tendencias de ventas a lo largo del tiempo
            </CardDescription>
          </div>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="w-[150px]"
          >
            <option value="daily">Diario (24h)</option>
            <option value="weekly">Semanal (7 días)</option>
            <option value="monthly">Mensual (30 días)</option>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[400px] w-full bg-muted animate-pulse rounded" />
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground">Total de Ventas</div>
                <div className="text-2xl font-bold">{totalSales}</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground">Promedio por Día</div>
                <div className="text-2xl font-bold">{avgSales.toFixed(1)}</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground">Período</div>
                <div className="text-lg font-semibold capitalize">{timeRange === 'daily' ? 'Últimas 24h' : timeRange === 'weekly' ? 'Últimos 7 días' : 'Últimos 30 días'}</div>
              </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => {
                    try {
                      return format(parseISO(value), timeRange === 'daily' ? 'HH:mm' : 'dd MMM', { locale: es });
                    } catch {
                      return value;
                    }
                  }}
                  className="text-xs"
                />
                <YAxis className="text-xs" />
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
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#colorSales)"
                  name="Ventas"
                />
              </AreaChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}
