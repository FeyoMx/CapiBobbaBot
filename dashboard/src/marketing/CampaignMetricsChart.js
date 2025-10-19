import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
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
        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
          {label}
        </Typography>
        {payload.map((entry, index) => (
          <Typography key={index} variant="caption" sx={{ color: entry.color, display: 'block' }}>
            {entry.name}: {entry.value}
          </Typography>
        ))}
      </Box>
    );
  }
  return null;
};

function CampaignMetricsChart({ messages }) {
  if (!messages || messages.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Evolucion Temporal
          </Typography>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No hay datos suficientes para mostrar el grafico
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Agrupar mensajes por hora
  const groupedData = messages.reduce((acc, message) => {
    const timestamp = message.timestamps.sent;
    const hour = format(new Date(timestamp), 'HH:00', { locale: es });

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
  }, {});

  const chartData = Object.values(groupedData).sort((a, b) => a.hour.localeCompare(b.hour));

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Evolucion Temporal
        </Typography>
        <Box sx={{ width: '100%', height: 350, mt: 2 }}>
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="hour"
                stroke="#666"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#666"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '14px' }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="enviados"
                stroke="#2196f3"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Enviados"
              />
              <Line
                type="monotone"
                dataKey="entregados"
                stroke="#4caf50"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Entregados"
              />
              <Line
                type="monotone"
                dataKey="leidos"
                stroke="#ff9800"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Leidos"
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}

export default CampaignMetricsChart;
