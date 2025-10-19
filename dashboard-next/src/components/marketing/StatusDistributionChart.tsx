'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { CampaignMessagesByStatus } from '@/types';

// ============================================================================
// Types
// ============================================================================

interface StatusDistributionChartProps {
  byStatus: CampaignMessagesByStatus;
}

interface ChartData {
  name: string;
  value: number;
  percentage: string;
  status: string; // Changed from keyof to string for index signature compatibility
  [key: string]: string | number; // Index signature for recharts compatibility
}

// ============================================================================
// Constants
// ============================================================================

const COLORS: Record<string, string> = {
  sent: 'hsl(189, 95%, 39%)', // Cyan
  delivered: 'hsl(142, 71%, 45%)', // Verde
  read: 'hsl(221, 83%, 53%)', // Azul
  failed: 'hsl(0, 84%, 60%)', // Rojo
};

const STATUS_NAMES: Record<string, string> = {
  sent: 'En tránsito',
  delivered: 'Entregados',
  read: 'Leídos',
  failed: 'Fallidos',
};

// ============================================================================
// Component
// ============================================================================

export function StatusDistributionChart({ byStatus }: StatusDistributionChartProps) {
  if (!byStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Estados</CardTitle>
          <CardDescription>Estado de mensajes por campaña</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = Object.values(byStatus).reduce((sum, count) => sum + count, 0);

  const data: ChartData[] = (Object.entries(byStatus) as [keyof CampaignMessagesByStatus, number][])
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      name: STATUS_NAMES[status] || status,
      value: count,
      percentage: ((count / total) * 100).toFixed(1),
      status,
    } as ChartData));

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Estados</CardTitle>
          <CardDescription>Estado de mensajes por campaña</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No hay mensajes para mostrar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderLabel = (entry: any) => {
    return `${entry.percentage}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución de Estados</CardTitle>
        <CardDescription>Estado de mensajes por campaña</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry) => (
                  <Cell key={`cell-${entry.status}`} fill={COLORS[entry.status]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [value, 'Cantidad']}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{ fontSize: '14px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          {data.map((entry) => (
            <div key={entry.status} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLORS[entry.status] }}
              />
              <span className="text-sm">
                <strong>{entry.name}:</strong> {entry.value} ({entry.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
