import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SendIcon from '@mui/icons-material/Send';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FavoriteIcon from '@mui/icons-material/Favorite';

const MetricCard = ({ title, value, percentage, icon: Icon, color, threshold }) => {
  const getStatusColor = () => {
    if (!threshold) return color;

    const numValue = parseFloat(percentage);
    if (threshold.type === 'min') {
      if (numValue >= threshold.excellent) return '#4caf50'; // Verde
      if (numValue >= threshold.acceptable) return '#ff9800'; // Naranja
      return '#f44336'; // Rojo
    } else {
      if (numValue <= threshold.excellent) return '#4caf50';
      if (numValue <= threshold.acceptable) return '#ff9800';
      return '#f44336';
    }
  };

  const statusColor = getStatusColor();

  return (
    <Card
      sx={{
        height: '100%',
        background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 12px rgba(0,0,0,0.15)',
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              backgroundColor: `${statusColor}20`,
              borderRadius: '12px',
              p: 1.5,
              display: 'flex',
              mr: 2
            }}
          >
            <Icon sx={{ color: statusColor, fontSize: 32 }} />
          </Box>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>

        <Typography variant="h3" component="div" sx={{ fontWeight: 700, mb: 1 }}>
          {value}
        </Typography>

        {percentage && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`${percentage}%`}
              size="small"
              sx={{
                backgroundColor: statusColor,
                color: 'white',
                fontWeight: 600,
              }}
            />
            {parseFloat(percentage) > 50 ? (
              <TrendingUpIcon sx={{ color: statusColor, fontSize: 20 }} />
            ) : (
              <TrendingDownIcon sx={{ color: statusColor, fontSize: 20 }} />
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

function CampaignOverview({ stats }) {
  if (!stats || !stats.stats) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No hay datos disponibles
        </Typography>
      </Box>
    );
  }

  const { totalSent, delivered, read, reactions, deliveryRate, readRate, engagementRate } = stats.stats;

  const metrics = [
    {
      title: 'Total Enviados',
      value: totalSent.toLocaleString(),
      icon: SendIcon,
      color: '#2196f3',
    },
    {
      title: 'Tasa de Entrega',
      value: delivered.toLocaleString(),
      percentage: deliveryRate.toFixed(1),
      icon: DoneAllIcon,
      color: '#4caf50',
      threshold: {
        type: 'min',
        excellent: 85,
        acceptable: 75,
      },
    },
    {
      title: 'Tasa de Lectura',
      value: read.toLocaleString(),
      percentage: readRate.toFixed(1),
      icon: VisibilityIcon,
      color: '#ff9800',
      threshold: {
        type: 'min',
        excellent: 30,
        acceptable: 15,
      },
    },
    {
      title: 'Engagement',
      value: reactions.toLocaleString(),
      percentage: engagementRate.toFixed(1),
      icon: FavoriteIcon,
      color: '#e91e63',
      threshold: {
        type: 'min',
        excellent: 5,
        acceptable: 2,
      },
    },
  ];

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3 }}>
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </Box>
  );
}

export default CampaignOverview;
