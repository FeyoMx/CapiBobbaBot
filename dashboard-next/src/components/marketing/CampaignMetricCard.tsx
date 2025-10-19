'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface CampaignMetricCardProps {
  title: string;
  value: number | string;
  percentage?: number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'orange' | 'pink';
  threshold?: {
    type: 'min' | 'max';
    excellent: number;
    acceptable: number;
  };
}

// ============================================================================
// Color Configs
// ============================================================================

const colorConfig = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    icon: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-600 dark:bg-blue-500',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/20',
    icon: 'text-green-600 dark:text-green-400',
    badge: 'bg-green-600 dark:bg-green-500',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/20',
    icon: 'text-orange-600 dark:text-orange-400',
    badge: 'bg-orange-600 dark:bg-orange-500',
  },
  pink: {
    bg: 'bg-pink-100 dark:bg-pink-900/20',
    icon: 'text-pink-600 dark:text-pink-400',
    badge: 'bg-pink-600 dark:bg-pink-500',
  },
};

// ============================================================================
// Component
// ============================================================================

export function CampaignMetricCard({
  title,
  value,
  percentage,
  icon: Icon,
  color = 'blue',
  threshold,
}: CampaignMetricCardProps) {
  // Determine status color based on threshold
  const getStatusColor = () => {
    if (!threshold || percentage === undefined) return color;

    if (threshold.type === 'min') {
      if (percentage >= threshold.excellent) return 'green';
      if (percentage >= threshold.acceptable) return 'orange';
      return 'pink';
    } else {
      if (percentage <= threshold.excellent) return 'green';
      if (percentage <= threshold.acceptable) return 'orange';
      return 'pink';
    }
  };

  const statusColor = threshold ? getStatusColor() : color;
  const colors = colorConfig[statusColor];

  return (
    <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={cn('p-3 rounded-xl', colors.bg)}>
            <Icon className={cn('h-6 w-6', colors.icon)} />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground flex-1 ml-3">
            {title}
          </h3>
        </div>

        <div className="space-y-2">
          <p className="text-3xl font-bold tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>

          {percentage !== undefined && (
            <div className="flex items-center gap-2">
              <Badge className={cn('text-white font-semibold', colors.badge)}>
                {percentage.toFixed(1)}%
              </Badge>
              {percentage > 50 ? (
                <TrendingUp className={cn('h-4 w-4', colors.icon)} />
              ) : (
                <TrendingDown className={cn('h-4 w-4', colors.icon)} />
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
