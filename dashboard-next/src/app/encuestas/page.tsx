'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ThumbsUp, TrendingUp, Star, Loader2, AlertCircle } from 'lucide-react';

// Lazy load Recharts for better performance (Sprint 6: Performance Optimization)
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });

interface SurveyData {
  npsScore: number;
  totalResponses: number;
  satisfactionRate: number;
  averageRating: number;
  distribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  recentSurveys: Array<{
    rating: number;
    comment: string;
    timestamp: string;
  }>;
  breakdown: {
    promoters: number;
    passives: number;
    detractors: number;
  };
}

export default function EncuestasPage() {
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSurveyData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('https://capibobbabot.onrender.com/api/survey/results');

        if (!response.ok) {
          throw new Error('Error al cargar datos de encuestas');
        }

        const result = await response.json();

        if (result.success) {
          setSurveyData(result.data);
        } else {
          throw new Error(result.error || 'Error desconocido');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
        console.error('Error fetching survey data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSurveyData();

    // Refresh data every 5 minutes
    const interval = setInterval(fetchSurveyData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const npsScore = surveyData?.npsScore ?? 0;
  const totalResponses = surveyData?.totalResponses ?? 0;
  const satisfactionRate = surveyData?.satisfactionRate ?? 0;
  const averageRating = surveyData?.averageRating ?? 0;

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Cargando datos de encuestas...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Error al Cargar Datos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

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
              <div className="text-2xl font-bold">
                {averageRating > 0 ? `${averageRating.toFixed(1)}/5` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">De todas las respuestas</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Fixed height for CLS optimization (Sprint 6) */}
          <Card className="h-[460px]">
            <CardHeader>
              <CardTitle>Distribución de Satisfacción</CardTitle>
              <CardDescription>Resultados de la encuesta post-compra</CardDescription>
            </CardHeader>
            <CardContent className="h-[340px]">
              {surveyData && surveyData.distribution.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={surveyData.distribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {surveyData.distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>No hay datos de encuestas disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fixed height matching chart card (Sprint 6) */}
          <Card className="h-[460px]">
            <CardHeader>
              <CardTitle>Comentarios Destacados</CardTitle>
              <CardDescription>Feedback de clientes recientes</CardDescription>
            </CardHeader>
            <CardContent className="h-[340px] overflow-y-auto">
              <div className="space-y-4">
                {surveyData && surveyData.recentSurveys.length > 0 ? (
                  surveyData.recentSurveys.slice(0, 10).map((review, index) => (
                    <div key={index} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.timestamp).toLocaleDateString('es-MX')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">"{review.comment}"</p>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>No hay comentarios disponibles</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info cuando no hay datos */}
        {totalResponses === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No hay datos disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Aún no se han completado encuestas. Los datos aparecerán automáticamente cuando los clientes
                completen encuestas de satisfacción después de realizar pedidos.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
