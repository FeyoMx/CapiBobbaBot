'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Download, FileJson, FileSpreadsheet, Info } from 'lucide-react';
import { useCampaigns, useCampaignStats, useCampaignMessages } from '@/lib/hooks/useMarketing';
import { CampaignList } from '@/components/marketing/CampaignList';
import { CampaignMetricCard } from '@/components/marketing/CampaignMetricCard';
import { CampaignTimelineChart } from '@/components/marketing/CampaignTimelineChart';
import { StatusDistributionChart } from '@/components/marketing/StatusDistributionChart';
import { Send, CheckCheck, Eye, Heart } from 'lucide-react';

// ============================================================================
// Marketing Page Component
// ============================================================================

export default function MarketingPage() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  // Fetch campaigns list
  const {
    data: campaignsData,
    isLoading: campaignsLoading,
    error: campaignsError,
    refetch: refetchCampaigns,
  } = useCampaigns();

  // Fetch selected campaign stats
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = useCampaignStats(selectedCampaignId || '', {
    enabled: !!selectedCampaignId,
  });

  // Fetch selected campaign messages
  const {
    data: messagesData,
    isLoading: messagesLoading,
    error: messagesError,
  } = useCampaignMessages(selectedCampaignId || '', {
    enabled: !!selectedCampaignId,
  });

  // Auto-select first active campaign when data loads
  if (
    !selectedCampaignId &&
    campaignsData?.campaigns &&
    campaignsData.campaigns.length > 0
  ) {
    const activeCampaign =
      campaignsData.campaigns.find((c) => c.active) || campaignsData.campaigns[0];
    setSelectedCampaignId(activeCampaign.id);
  }

  // Export functions
  const handleExportJSON = () => {
    if (!selectedCampaignId || !statsData || !messagesData) return;

    const exportData = {
      campaign: campaignsData?.campaigns.find((c) => c.id === selectedCampaignId),
      stats: statsData.stats,
      messages: messagesData.messages,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });

    // Use native browser API instead of file-saver
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campana_${selectedCampaignId}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!messagesData?.messages || messagesData.messages.length === 0) return;

    const headers = ['Message ID', 'Recipient', 'Status', 'Sent', 'Delivered', 'Read'];
    const rows = messagesData.messages.map((msg) => [
      msg.messageId,
      msg.recipient,
      msg.status,
      msg.timestamps.sent ? new Date(msg.timestamps.sent).toISOString() : '',
      msg.timestamps.delivered ? new Date(msg.timestamps.delivered).toISOString() : '',
      msg.timestamps.read ? new Date(msg.timestamps.read).toISOString() : '',
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    // Use native browser API instead of file-saver
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mensajes_${selectedCampaignId}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    refetchCampaigns();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Marketing</h1>
          <p className="text-muted-foreground mt-1">
            Monitoreo y análisis de campañas de WhatsApp
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJSON}
            disabled={!selectedCampaignId}
          >
            <FileJson className="h-4 w-4 mr-2" />
            JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={!selectedCampaignId || !messagesData?.messages?.length}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {/* Auto-refresh badge */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Los datos se actualizan automáticamente cada 30 segundos
        </AlertDescription>
      </Alert>

      {/* Error states */}
      {campaignsError && (
        <Alert variant="destructive">
          <AlertDescription>Error al cargar campañas: {campaignsError.message}</AlertDescription>
        </Alert>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Campaigns List - Left sidebar */}
        <div className="lg:col-span-1">
          <CampaignList
            campaigns={campaignsData?.campaigns || []}
            selectedCampaignId={selectedCampaignId}
            onSelectCampaign={setSelectedCampaignId}
            loading={campaignsLoading}
          />
        </div>

        {/* Campaign Details - Main area */}
        <div className="lg:col-span-3">
          {!selectedCampaignId ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Selecciona una campaña para ver sus estadísticas
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : statsLoading || messagesLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="h-24 bg-muted animate-pulse rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : statsError || messagesError ? (
            <Alert variant="destructive">
              <AlertDescription>
                Error al cargar datos: {(statsError || messagesError)?.message}
              </AlertDescription>
            </Alert>
          ) : statsData && messagesData ? (
            <div className="space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <CampaignMetricCard
                  title="Total Enviados"
                  value={statsData.stats.totalSent}
                  icon={Send}
                  color="blue"
                />
                <CampaignMetricCard
                  title="Tasa de Entrega"
                  value={statsData.stats.delivered}
                  percentage={statsData.stats.deliveryRate}
                  icon={CheckCheck}
                  color="green"
                  threshold={{
                    type: 'min',
                    excellent: 85,
                    acceptable: 75,
                  }}
                />
                <CampaignMetricCard
                  title="Tasa de Lectura"
                  value={statsData.stats.read}
                  percentage={statsData.stats.readRate}
                  icon={Eye}
                  color="orange"
                  threshold={{
                    type: 'min',
                    excellent: 30,
                    acceptable: 15,
                  }}
                />
                <CampaignMetricCard
                  title="Engagement"
                  value={statsData.stats.reactions}
                  percentage={statsData.stats.engagementRate}
                  icon={Heart}
                  color="pink"
                  threshold={{
                    type: 'min',
                    excellent: 5,
                    acceptable: 2,
                  }}
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {statsData.messages?.byStatus && (
                  <StatusDistributionChart byStatus={statsData.messages.byStatus} />
                )}
                {messagesData.messages && messagesData.messages.length > 0 && (
                  <CampaignTimelineChart messages={messagesData.messages} />
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
