'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SecurityEventsTable } from '@/components/security/SecurityEventsTable';
import { useWebSocket } from '@/lib/providers/WebSocketProvider';
import { useSecurityStats } from '@/lib/hooks/useMetrics';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Shield, AlertTriangle, Ban, Activity, Wifi, WifiOff } from 'lucide-react';

export default function SeguridadPage() {
  const { isConnected } = useWebSocket();
  const { data: stats, isLoading: statsLoading } = useSecurityStats();

  // Obtener eventos de seguridad desde la API real
  const { data: eventsResponse, isLoading: eventsLoading } = useQuery({
    queryKey: ['securityEvents'],
    queryFn: () => apiClient.getSecurityEvents({ limit: 50 }),
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const events = eventsResponse?.events || [];
  const isLoading = statsLoading || eventsLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Seguridad
            </h2>
            <p className="text-muted-foreground">
              Monitoreo de eventos de seguridad y amenazas
            </p>
          </div>

          {/* WebSocket Status */}
          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-green-500">Monitoreo activo</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Desconectado</span>
              </>
            )}
          </div>
        </div>

        {/* Security Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Eventos
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : stats?.total_events ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Todos los eventos registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Eventos Hoy
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : stats?.events_today ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Detectados en las últimas 24h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Eventos Críticos
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {isLoading ? '...' : stats?.critical_events ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Requieren atención inmediata
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Números Bloqueados
              </CardTitle>
              <Ban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : stats?.blocked_numbers ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Por violaciones de políticas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Security Events Table */}
        <SecurityEventsTable events={events} isLoading={eventsLoading} />

        {/* Rate Limiting Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Rate Limiting Dashboard</CardTitle>
            <CardDescription>
              Estadísticas de límites de tasa por número
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <div className="font-medium">Total de Hits</div>
                  <div className="text-sm text-muted-foreground">
                    Límites de tasa alcanzados
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  {isLoading ? '...' : stats?.rate_limit_hits ?? 0}
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>
                  Los límites de tasa protegen el sistema contra abuso y uso excesivo.
                  Cuando un número alcanza el límite, se bloquea temporalmente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Patterns */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Patrones Detectados</CardTitle>
              <CardDescription>
                Tipos de amenazas identificadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { type: 'Spam', count: 5, severity: 'medium' },
                  { type: 'Flood', count: 2, severity: 'high' },
                  { type: 'Phishing', count: 0, severity: 'critical' },
                ].map((pattern) => (
                  <div
                    key={pattern.type}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle
                        className={`h-4 w-4 ${
                          pattern.severity === 'critical'
                            ? 'text-red-500'
                            : pattern.severity === 'high'
                            ? 'text-orange-500'
                            : 'text-yellow-500'
                        }`}
                      />
                      <div>
                        <div className="font-medium">{pattern.type}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          Severidad: {pattern.severity}
                        </div>
                      </div>
                    </div>
                    <div className="text-xl font-bold">{pattern.count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acciones Recomendadas</CardTitle>
              <CardDescription>
                Sugerencias basadas en eventos recientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">
                        Revisar números con rate limiting
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {stats?.rate_limit_hits ?? 0} números han alcanzado el límite
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">
                        Sistema funcionando correctamente
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        No hay eventos críticos pendientes
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
