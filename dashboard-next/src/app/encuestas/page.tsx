'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function EncuestasPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Encuestas</h2>
          <p className="text-muted-foreground">
            Resultados de satisfacción del cliente
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Encuestas - Próximamente</CardTitle>
            </div>
            <CardDescription>
              Sprint 4 - Dashboard de encuestas y feedback
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">🔨 Planificado para Sprint 4:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>NPS Score (Net Promoter Score)</li>
                <li>Gráficos de satisfacción</li>
                <li>Respuestas de texto</li>
                <li>Análisis de sentimiento</li>
                <li>Tendencias por período</li>
                <li>Respuestas individuales</li>
                <li>Exportar resultados</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
