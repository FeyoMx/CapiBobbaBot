import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = {
  sent: '#00bcd4',      // Cyan - En transito
  delivered: '#4caf50', // Verde - Entregados
  read: '#2196f3',      // Azul - Leidos
  failed: '#f44336',    // Rojo - Fallidos
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <Box
        sx={{
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: 1,
          p: 1.5,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
          {data.name}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block' }}>
          Cantidad: {data.value}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block' }}>
          Porcentaje: {data.payload.percentage}%
        </Typography>
      </Box>
    );
  }
  return null;
};

const renderLabel = (entry) => {
  return `${entry.percentage}%`;
};

function StatusDistributionChart({ stats }) {
  if (!stats || !stats.messages || !stats.messages.byStatus) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Distribucion de Estados
          </Typography>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No hay datos disponibles
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const { byStatus } = stats.messages;
  const total = Object.values(byStatus).reduce((sum, count) => sum + count, 0);

  const data = Object.entries(byStatus)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      name: status === 'sent' ? 'En transito' : status === 'delivered' ? 'Entregados' : status === 'read' ? 'Leidos' : 'Fallidos',
      value: count,
      percentage: ((count / total) * 100).toFixed(1),
      status,
    }));

  if (data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Distribucion de Estados
          </Typography>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No hay mensajes para mostrar
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Distribucion de Estados
        </Typography>
        <Box sx={{ width: '100%', height: 350, mt: 2 }}>
          <ResponsiveContainer>
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
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.status]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{ fontSize: '14px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>
        <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          {data.map((entry) => (
            <Box key={entry.status} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: COLORS[entry.status],
                }}
              />
              <Typography variant="body2">
                <strong>{entry.name}:</strong> {entry.value} ({entry.percentage}%)
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

export default StatusDistributionChart;
