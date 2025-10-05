'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function ConfiguracionPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configuración</h2>
          <p className="text-muted-foreground">
            Ajustes del sistema y preferencias
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <CardTitle>Configuración - Próximamente</CardTitle>
            </div>
            <CardDescription>
              Sprint 5 - Panel de configuración y ajustes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">🔨 Planificado para Sprint 5:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Configuración del negocio (business_data.js)</li>
                <li>Ajustes de Gemini AI</li>
                <li>Configuración de WhatsApp</li>
                <li>Rate limiting settings</li>
                <li>Tema (Dark/Light mode)</li>
                <li>Notificaciones</li>
                <li>Backup y restore</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
