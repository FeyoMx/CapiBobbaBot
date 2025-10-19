import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Grid,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import GetAppIcon from '@mui/icons-material/GetApp';
import axios from 'axios';
import { saveAs } from 'file-saver';

import CampaignOverview from './marketing/CampaignOverview';
import CampaignList from './marketing/CampaignList';
import CampaignMetricsChart from './marketing/CampaignMetricsChart';
import StatusDistributionChart from './marketing/StatusDistributionChart';

function MarketingDashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [campaignStats, setCampaignStats] = useState(null);
  const [campaignMessages, setCampaignMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Cargar lista de campanas
  const loadCampaigns = useCallback(async () => {
    try {
      const response = await axios.get('/api/marketing/campaigns');
      if (response.data.success) {
        const campaignList = response.data.campaigns;
        setCampaigns(campaignList);

        // Si no hay campana seleccionada y hay campanas disponibles, seleccionar la primera activa
        if (!selectedCampaignId && campaignList.length > 0) {
          const activeCampaign = campaignList.find(c => c.active) || campaignList[0];
          setSelectedCampaignId(activeCampaign.id);
        }
      }
    } catch (err) {
      console.error('Error loading campaigns:', err);
      setError('Error al cargar las campanas');
    } finally {
      setLoading(false);
    }
  }, [selectedCampaignId]);

  // Cargar estadisticas de campana seleccionada
  const loadCampaignStats = useCallback(async () => {
    if (!selectedCampaignId) return;

    try {
      const [statsResponse, messagesResponse] = await Promise.all([
        axios.get(`/api/marketing/campaign/${selectedCampaignId}/stats`),
        axios.get(`/api/marketing/campaign/${selectedCampaignId}/messages`),
      ]);

      if (statsResponse.data.success) {
        setCampaignStats(statsResponse.data);
      }

      if (messagesResponse.data.success) {
        setCampaignMessages(messagesResponse.data.messages || []);
      }
    } catch (err) {
      console.error('Error loading campaign stats:', err);
      setError('Error al cargar las estadisticas de la campana');
    }
  }, [selectedCampaignId]);

  // Efecto inicial para cargar campanas
  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  // Efecto para cargar estadisticas cuando cambia la campana seleccionada
  useEffect(() => {
    if (selectedCampaignId) {
      loadCampaignStats();
    }
  }, [selectedCampaignId, loadCampaignStats]);

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadCampaigns();
      if (selectedCampaignId) {
        loadCampaignStats();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, selectedCampaignId, loadCampaigns, loadCampaignStats]);

  // Exportar datos a JSON
  const handleExportJSON = () => {
    const data = {
      campaign: campaigns.find(c => c.id === selectedCampaignId),
      stats: campaignStats,
      messages: campaignMessages,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, `campana_${selectedCampaignId}_${Date.now()}.json`);
  };

  // Exportar datos a CSV
  const handleExportCSV = () => {
    if (campaignMessages.length === 0) return;

    const headers = ['Message ID', 'Recipient', 'Status', 'Sent', 'Delivered', 'Read'];
    const rows = campaignMessages.map(msg => [
      msg.messageId,
      msg.recipient,
      msg.status,
      msg.timestamps.sent ? new Date(msg.timestamps.sent).toISOString() : '',
      msg.timestamps.delivered ? new Date(msg.timestamps.delivered).toISOString() : '',
      msg.timestamps.read ? new Date(msg.timestamps.read).toISOString() : '',
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `mensajes_${selectedCampaignId}_${Date.now()}.csv`);
  };

  // Refresh manual
  const handleRefresh = () => {
    setLoading(true);
    loadCampaigns();
    if (selectedCampaignId) {
      loadCampaignStats();
    }
    setLoading(false);
  };

  if (loading && campaigns.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && campaigns.length === 0) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header con acciones */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
          Dashboard de Marketing
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={autoRefresh ? 'Auto-refresh activado' : 'Auto-refresh desactivado'}>
            <Button
              variant={autoRefresh ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
            </Button>
          </Tooltip>
          <Tooltip title="Actualizar ahora">
            <IconButton onClick={handleRefresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Exportar a JSON">
            <IconButton onClick={handleExportJSON} color="primary" disabled={!selectedCampaignId}>
              <GetAppIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Exportar a CSV">
            <Button
              variant="outlined"
              size="small"
              onClick={handleExportCSV}
              disabled={!selectedCampaignId || campaignMessages.length === 0}
              startIcon={<GetAppIcon />}
            >
              CSV
            </Button>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Columna izquierda: Lista de campanas */}
        <Grid item xs={12} md={4}>
          <CampaignList
            campaigns={campaigns}
            selectedCampaignId={selectedCampaignId}
            onSelectCampaign={setSelectedCampaignId}
            loading={loading}
          />
        </Grid>

        {/* Columna derecha: Estadisticas y graficos */}
        <Grid item xs={12} md={8}>
          {selectedCampaignId && campaignStats ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Overview cards */}
              <CampaignOverview stats={campaignStats} />

              {/* Graficos */}
              <Grid container spacing={3}>
                <Grid item xs={12} lg={6}>
                  <StatusDistributionChart stats={campaignStats} />
                </Grid>
                <Grid item xs={12} lg={6}>
                  <CampaignMetricsChart messages={campaignMessages} />
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                Selecciona una campana para ver sus estadisticas
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

export default MarketingDashboard;
