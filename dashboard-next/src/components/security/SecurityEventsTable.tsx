'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertTriangle, Shield, XCircle, CheckCircle } from 'lucide-react';
import type { SecurityEvent, SecuritySeverity } from '@/types';

const severityColors: Record<SecuritySeverity, string> = {
  low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const severityIcons: Record<SecuritySeverity, React.ReactNode> = {
  low: <Shield className="h-4 w-4" />,
  medium: <AlertTriangle className="h-4 w-4" />,
  high: <AlertTriangle className="h-4 w-4" />,
  critical: <XCircle className="h-4 w-4" />,
};

interface SecurityEventsTableProps {
  events: SecurityEvent[];
  isLoading?: boolean;
}

export function SecurityEventsTable({ events, isLoading }: SecurityEventsTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Eventos de Seguridad Recientes</CardTitle>
          <CardDescription>Cargando...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Eventos de Seguridad Recientes
        </CardTitle>
        <CardDescription>
          Últimos {events.length} eventos detectados por el sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500 opacity-50" />
              <p>No hay eventos de seguridad</p>
              <p className="text-xs mt-1">Todo está funcionando correctamente</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                {/* Severity Badge */}
                <div>
                  <Badge
                    variant="outline"
                    className={`${severityColors[event.severity]} flex items-center gap-1`}
                  >
                    {severityIcons[event.severity]}
                    {event.severity.toUpperCase()}
                  </Badge>
                </div>

                {/* Event Details */}
                <div className="flex-1 space-y-1">
                  <div className="font-medium">{event.message}</div>
                  <div className="text-sm text-muted-foreground">
                    Tipo: <span className="font-mono">{event.type}</span>
                    {event.phone_number && ` • Teléfono: ${event.phone_number}`}
                    {event.ip_address && ` • IP: ${event.ip_address}`}
                  </div>
                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <div className="text-xs text-muted-foreground mt-2">
                      <details>
                        <summary className="cursor-pointer hover:text-foreground">
                          Ver detalles
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                          {JSON.stringify(event.metadata, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>

                {/* Timestamp & Status */}
                <div className="text-right space-y-1">
                  <div className="text-sm">
                    {format(parseISO(event.timestamp), 'dd MMM', { locale: es })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(parseISO(event.timestamp), 'HH:mm:ss', { locale: es })}
                  </div>
                  {event.resolved && (
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500">
                      Resuelto
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
