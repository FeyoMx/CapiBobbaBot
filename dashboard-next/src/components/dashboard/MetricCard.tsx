'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  description?: string;
  isLoading?: boolean;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  isLoading = false,
}: MetricCardProps) {
  const trendColor = trend && trend > 0 ? 'text-green-600' : trend && trend < 0 ? 'text-red-600' : 'text-muted-foreground';
  const TrendIcon = trend && trend > 0 ? ArrowUpIcon : ArrowDownIcon;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <div className="flex items-center gap-1 text-xs">
              {trend !== undefined && trend !== 0 && (
                <>
                  <TrendIcon className={cn('h-3 w-3', trendColor)} />
                  <span className={trendColor}>
                    {Math.abs(trend).toFixed(1)}%
                  </span>
                </>
              )}
              <span className="text-muted-foreground">
                {description || 'desde ayer'}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
