'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ThumbsUp, TrendingUp, Star } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const satisfactionData = [
  { name: 'Muy Satisfecho', value: 45, color: 'hsl(142 76% 36%)' },
  { name: 'Satisfecho', value: 30, color: 'hsl(221 83% 53%)' },
  { name: 'Neutral', value: 15, color: 'hsl(38 92% 50%)' },
  { name: 'Insatisfecho', value: 10, color: 'hsl(0 84% 60%)' },
];

export default function EncuestasPage() {
  const npsScore = 65; // Net Promoter Score (mock data)
  const totalResponses = 120;
  const satisfactionRate = 75;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Encuestas
          </h2>
          <p className="text-muted-foreground">
            Resultados de satisfacción del cliente y NPS
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">NPS Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{npsScore}</div>
              <p className="text-xs text-muted-foreground">Excelente puntuación</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Respuestas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalResponses}</div>
              <p className="text-xs text-muted-foreground">Encuestas completadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Satisfacción</CardTitle>
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{satisfactionRate}%</div>
              <p className="text-xs text-muted-foreground">Clientes satisfechos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rating Promedio</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.5/5</div>
              <p className="text-xs text-muted-foreground">De todas las respuestas</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Satisfacción</CardTitle>
              <CardDescription>Resultados de la encuesta post-compra</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={satisfactionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {satisfactionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comentarios Destacados</CardTitle>
              <CardDescription>Feedback de clientes recientes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { rating: 5, comment: 'Excelente servicio, muy rápido y amable' },
                  { rating: 4, comment: 'Buena atención, productos frescos' },
                  { rating: 5, comment: 'Me encanta el chatbot, muy útil' },
                ].map((review, index) => (
                  <div key={index} className="p-3 rounded-lg border">
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">"{review.comment}"</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <Card>
          <CardHeader>
            <CardTitle>Nota</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Los datos mostrados son de ejemplo. Para habilitar encuestas reales, configura el endpoint{' '}
              <code className="bg-muted px-1 py-0.5 rounded">GET /api/survey/results</code> en el backend.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
