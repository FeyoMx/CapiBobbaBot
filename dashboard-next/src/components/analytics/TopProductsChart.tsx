'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useRevenueByProduct } from '@/lib/hooks/useMetrics';
import { Package, TrendingUp } from 'lucide-react';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(142 76% 36%)',
  'hsl(262 83% 58%)',
  'hsl(38 92% 50%)',
  'hsl(221 83% 53%)',
];

export function TopProductsChart() {
  const { data, isLoading, error } = useRevenueByProduct();

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Productos</CardTitle>
          <CardDescription>Error al cargar datos</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  // Ensure chartData is always an array
  const chartData = Array.isArray(data) ? data : [];
  const topProducts = chartData.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Top 5 Productos
        </CardTitle>
        <CardDescription>
          Productos más vendidos por ingresos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[350px] w-full bg-muted animate-pulse rounded" />
        ) : topProducts.length === 0 ? (
          <div className="h-[350px] flex items-center justify-center text-muted-foreground">
            No hay datos de productos
          </div>
        ) : (
          <>
            {/* Product List */}
            <div className="space-y-3 mb-6">
              {topProducts.map((product, index) => (
                <div key={product.product} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <div className="font-medium">{product.product}</div>
                      <div className="text-xs text-muted-foreground">
                        {product.count} unidades vendidas
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      ${product.revenue.toLocaleString('es-MX')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {product.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis
                  dataKey="product"
                  type="category"
                  width={100}
                  className="text-xs"
                />
                <Tooltip
                  formatter={(value: number) => `$${value.toLocaleString('es-MX')}`}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                  {topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}
