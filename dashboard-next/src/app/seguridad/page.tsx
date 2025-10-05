'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export default function SeguridadPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Seguridad</h2>
          <p className="text-muted-foreground">
            Monitoreo de eventos de seguridad y amenazas
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Seguridad - Próximamente</CardTitle>
            </div>
            <CardDescription>
              Sprint 4 - Panel de seguridad y eventos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">🔨 Planificado para Sprint 4:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Eventos de seguridad en tiempo real</li>
                <li>Rate limiting dashboard</li>
                <li>Números bloqueados</li>
                <li>Intentos de acceso no autorizado</li>
                <li>Patrones sospechosos detectados</li>
                <li>Logs de auditoría</li>
                <li>Alertas configurables</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
