'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Loader2 } from 'lucide-react';

interface PerformanceDataPoint {
  timestamp: string;
  cpu: number;
  memory: number;
  responseTime?: number;
}

export function SystemPerformanceChart() {
  const [performanceData, setPerformanceData] = useState<PerformanceDataPoint[]>([]);
  const maxDataPoints = 20; // Keep last 20 points

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.getHealth(),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  useEffect(() => {
    if (health?.systemMetrics) {
      const now = new Date();
      const timeString = now.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const newDataPoint: PerformanceDataPoint = {
        timestamp: timeString,
        cpu: health.systemMetrics.cpu,
        memory: health.systemMetrics.memory,
        responseTime: health.checks?.find((c: any) => c.name === 'bot_connectivity')?.details?.responseTime,
      };

      setPerformanceData((prev) => {
        const updated = [...prev, newDataPoint];
        // Keep only the last maxDataPoints
        return updated.slice(-maxDataPoints);
      });
    }
  }, [health]);

  if (performanceData.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Rendimiento del Sistema en Tiempo Real
          </CardTitle>
          <CardDescription>
            Monitoreo de CPU, Memoria y Latencia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Recopilando datos...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Rendimiento del Sistema en Tiempo Real
        </CardTitle>
        <CardDescription>
          Monitoreo de CPU, Memoria y Latencia (últimos {performanceData.length} puntos)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="timestamp"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: '%', position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
              />
              <Legend
                wrapperStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Line
                type="monotone"
                dataKey="cpu"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                name="CPU %"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="memory"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                name="Memoria %"
                dot={false}
                activeDot={{ r: 4 }}
              />
              {performanceData.some(d => d.responseTime) && (
                <Line
                  type="monotone"
                  dataKey="responseTime"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                  name="Latencia (ms)"
                  dot={false}
                  activeDot={{ r: 4 }}
                  yAxisId="right"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Current Values */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">CPU Actual</p>
            <p className="text-2xl font-bold" style={{ color: 'hsl(var(--chart-1))' }}>
              {performanceData[performanceData.length - 1]?.cpu.toFixed(1)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Memoria Actual</p>
            <p className="text-2xl font-bold" style={{ color: 'hsl(var(--chart-2))' }}>
              {performanceData[performanceData.length - 1]?.memory.toFixed(1)}%
            </p>
          </div>
          {performanceData[performanceData.length - 1]?.responseTime && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Latencia</p>
              <p className="text-2xl font-bold" style={{ color: 'hsl(var(--chart-3))' }}>
                {performanceData[performanceData.length - 1]?.responseTime}ms
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
