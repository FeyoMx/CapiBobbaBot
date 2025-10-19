'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Campaign } from '@/types';
import { Megaphone, CheckCircle2, PauseCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface CampaignListProps {
  campaigns: Campaign[];
  selectedCampaignId: string | null;
  onSelectCampaign: (id: string) => void;
  loading?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function CampaignList({
  campaigns,
  selectedCampaignId,
  onSelectCampaign,
  loading = false,
}: CampaignListProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Cargando campañas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 space-y-3">
            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No hay campañas disponibles
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Campañas ({campaigns.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {campaigns.map((campaign) => (
            <Button
              key={campaign.id}
              variant="ghost"
              className={cn(
                'w-full justify-start p-4 h-auto rounded-none hover:bg-accent',
                selectedCampaignId === campaign.id && 'bg-primary/10 hover:bg-primary/15'
              )}
              onClick={() => onSelectCampaign(campaign.id)}
            >
              <div className="w-full space-y-2">
                {/* Header */}
                <div className="flex items-start gap-2">
                  {campaign.active ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <PauseCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{campaign.name}</h3>
                      <Badge
                        variant={campaign.active ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {campaign.active ? 'Activa' : 'Pausada'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {campaign.description}
                    </p>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Creada: {format(new Date(campaign.created), "d 'de' MMMM, yyyy", {
                      locale: es,
                    })}
                  </span>
                </div>

                {/* Stats */}
                {campaign.stats && (
                  <div className="flex gap-3 text-xs">
                    <span className="text-blue-600 dark:text-blue-400">
                      {campaign.stats.totalSent} enviados
                    </span>
                    <span className="text-green-600 dark:text-green-400">
                      {campaign.stats.delivered} entregados
                    </span>
                    <span className="text-orange-600 dark:text-orange-400">
                      {campaign.stats.read} leídos
                    </span>
                  </div>
                )}
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
