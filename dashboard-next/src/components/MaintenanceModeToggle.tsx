'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Construction, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface MaintenanceStatus {
  maintenanceMode: boolean;
}

export function MaintenanceModeToggle() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Fetch current maintenance status
  const { data, isLoading } = useQuery<MaintenanceStatus>({
    queryKey: ['maintenance'],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/maintenance`);
      if (!response.ok) throw new Error('Failed to fetch maintenance status');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Toggle maintenance mode mutation
  const toggleMutation = useMutation({
    mutationFn: async (newStatus: boolean) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ maintenanceMode: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update maintenance status');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['maintenance'], data);
      setError(null);
      toast.success(
        data.maintenanceMode
          ? 'Modo mantenimiento activado - El bot no procesará pedidos'
          : 'Modo mantenimiento desactivado - El bot está activo'
      );
    },
    onError: (error) => {
      setError('No se pudo actualizar el estado de mantenimiento');
      toast.error('Error al cambiar el modo de mantenimiento');
      console.error('Error updating maintenance status:', error);
    },
  });

  const handleToggle = (checked: boolean) => {
    toggleMutation.mutate(checked);
  };

  const maintenanceMode = data?.maintenanceMode ?? false;

  return (
    <Card className={maintenanceMode ? 'border-yellow-500' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Construction className="h-5 w-5" />
          Modo Mantenimiento
        </CardTitle>
        <CardDescription>
          Suspende temporalmente la toma de pedidos del bot
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
          <div className="flex-1 space-y-1">
            <Label
              htmlFor="maintenance-mode"
              className="text-base font-medium cursor-pointer"
            >
              {maintenanceMode ? 'Modo Mantenimiento Activo' : 'Bot Activo'}
            </Label>
            <p className="text-sm text-muted-foreground">
              {maintenanceMode
                ? 'El bot está en mantenimiento y no procesará nuevos pedidos'
                : 'El bot está activo y procesando pedidos normalmente'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {toggleMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Switch
                id="maintenance-mode"
                checked={maintenanceMode}
                onCheckedChange={handleToggle}
                disabled={isLoading || toggleMutation.isPending}
              />
            )}
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 text-sm">
          {maintenanceMode ? (
            <>
              <div className="flex h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-yellow-600 dark:text-yellow-400">
                Los clientes recibirán un mensaje de fuera de servicio
              </span>
            </>
          ) : (
            <>
              <div className="flex h-2 w-2 rounded-full bg-green-500" />
              <span className="text-green-600 dark:text-green-400">
                Bot operando normalmente
              </span>
            </>
          )}
        </div>

        {/* Additional Info */}
        {maintenanceMode && (
          <Alert className="bg-yellow-500/10 border-yellow-500/50">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-700 dark:text-yellow-300">
              <p className="font-medium mb-1">Modo Mantenimiento Activo</p>
              <ul className="text-xs space-y-1 list-disc list-inside">
                <li>Los clientes no podrán realizar nuevos pedidos</li>
                <li>Los pedidos existentes no se verán afectados</li>
                <li>El bot responderá con un mensaje de fuera de servicio</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
