'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/hooks/useMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Database,
  Bot,
  Workflow,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: any;
}

export function HealthStatus() {
  const { data: health, isLoading, error } = useQuery({
    queryKey: queryKeys.health,
    queryFn: () => apiClient.getHealth(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
      case 'healthy':
        return 'text-green-500 bg-green-500/10';
      case 'fail':
      case 'unhealthy':
        return 'text-red-500 bg-red-500/10';
      case 'warn':
        return 'text-yellow-500 bg-yellow-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'fail':
      case 'unhealthy':
        return <XCircle className="h-5 w-5" />;
      case 'warn':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin" />;
    }
  };

  const getServiceIcon = (name: string) => {
    if (name.includes('redis')) return <Database className="h-5 w-5" />;
    if (name.includes('bot')) return <Bot className="h-5 w-5" />;
    if (name.includes('webhook')) return <Workflow className="h-5 w-5" />;
    return <Activity className="h-5 w-5" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Estado del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Estado del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-500">
            <XCircle className="h-5 w-5" />
            <p>Error al cargar el estado del sistema</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const systemStatus = health?.status || 'unknown';
  const checks = health?.checks || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Estado del Sistema
          </CardTitle>
          <Badge className={getStatusColor(systemStatus)}>
            <span className="flex items-center gap-1">
              {getStatusIcon(systemStatus)}
              {systemStatus === 'healthy' ? 'Saludable' :
               systemStatus === 'unhealthy' ? 'Crítico' : 'Advertencia'}
            </span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* System Metrics */}
          {health?.systemMetrics && (
            <div className="grid grid-cols-3 gap-4 pb-4 border-b">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">CPU</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        health.systemMetrics.cpu > 80
                          ? 'bg-red-500'
                          : health.systemMetrics.cpu > 60
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(health.systemMetrics.cpu, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {health.systemMetrics.cpu.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Memoria</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        health.systemMetrics.memory > 80
                          ? 'bg-red-500'
                          : health.systemMetrics.memory > 60
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(health.systemMetrics.memory, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {health.systemMetrics.memory.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Disco</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        health.systemMetrics.disk > 80
                          ? 'bg-red-500'
                          : health.systemMetrics.disk > 60
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(health.systemMetrics.disk, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {health.systemMetrics.disk.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Service Checks */}
          <div className="space-y-3">
            {checks.map((check: HealthCheck, index: number) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card"
              >
                <div className={`p-2 rounded-lg ${getStatusColor(check.status)}`}>
                  {getServiceIcon(check.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">
                      {check.name === 'bot_connectivity' ? 'WhatsApp Bot' :
                       check.name === 'redis_connection' ? 'Redis' :
                       check.name === 'webhook_connectivity' ? 'n8n Webhook' :
                       check.name === 'system_resources' ? 'Recursos del Sistema' :
                       check.name}
                    </h4>
                    <div className={`flex items-center gap-1 ${getStatusColor(check.status)}`}>
                      {getStatusIcon(check.status)}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{check.message}</p>

                  {/* Additional Details */}
                  {check.details && (
                    <div className="mt-2 text-xs text-muted-foreground space-y-1">
                      {check.name === 'bot_connectivity' && check.details.phoneNumber && (
                        <p>📱 {check.details.phoneNumber}</p>
                      )}
                      {check.name === 'redis_connection' && (
                        <div className="flex gap-4">
                          {check.details.version && <span>v{check.details.version}</span>}
                          {check.details.totalKeys && <span>{check.details.totalKeys} keys</span>}
                          {check.details.hitRate && <span>{check.details.hitRate}% hit rate</span>}
                        </div>
                      )}
                      {check.name === 'webhook_connectivity' && check.details.host && (
                        <p>🔗 {check.details.host}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
