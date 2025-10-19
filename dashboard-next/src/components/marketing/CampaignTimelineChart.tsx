'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CampaignMessage } from '@/types';
import { format } from 'date-fns';

// ============================================================================
// Types
// ============================================================================

interface CampaignTimelineChartProps {
  messages: CampaignMessage[];
}

interface TimelineData {
  hour: string;
  enviados: number;
  entregados: number;
  leidos: number;
}

// ============================================================================
// Component
// ============================================================================

export function CampaignTimelineChart({ messages }: CampaignTimelineChartProps) {
  if (!messages || messages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolución Temporal</CardTitle>
          <CardDescription>Mensajes enviados, entregados y leídos por hora</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No hay datos suficientes para mostrar el gráfico
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group messages by hour
  const groupedData: Record<string, TimelineData> = messages.reduce((acc, message) => {
    if (!message.timestamps.sent) return acc;

    // Convert timestamp to number if it's a string
    const timestamp = typeof message.timestamps.sent === 'string'
      ? parseInt(message.timestamps.sent, 10)
      : message.timestamps.sent;

    const hour = format(new Date(timestamp), 'HH:00');

    if (!acc[hour]) {
      acc[hour] = {
        hour,
        enviados: 0,
        entregados: 0,
        leidos: 0,
      };
    }

    acc[hour].enviados += 1;
    if (['delivered', 'read'].includes(message.status)) {
      acc[hour].entregados += 1;
    }
    if (message.status === 'read') {
      acc[hour].leidos += 1;
    }

    return acc;
  }, {} as Record<string, TimelineData>);

  const chartData = Object.values(groupedData).sort((a, b) => a.hour.localeCompare(b.hour));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolución Temporal</CardTitle>
        <CardDescription>Mensajes enviados, entregados y leídos por hora</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="hour"
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis className="text-xs" stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '14px' }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="enviados"
                stroke="hsl(221, 83%, 53%)"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Enviados"
              />
              <Line
                type="monotone"
                dataKey="entregados"
                stroke="hsl(142, 71%, 45%)"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Entregados"
              />
              <Line
                type="monotone"
                dataKey="leidos"
                stroke="hsl(24, 95%, 53%)"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Leídos"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
