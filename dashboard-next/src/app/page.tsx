import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, DollarSign, Cpu, Database } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary p-2">
              <Cpu className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">CapiBobbaBot Dashboard</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-muted-foreground">
            Bienvenido al nuevo dashboard modernizado
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Pedidos Hoy
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Conectando al backend...
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Revenue 24h
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0</div>
              <p className="text-xs text-muted-foreground">
                Conectando al backend...
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Gemini Calls
              </CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Conectando al backend...
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Cache Hit Rate
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground">
                Conectando al backend...
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Message */}
        <Card>
          <CardHeader>
            <CardTitle>🎉 Sprint 1 - Foundation Completado!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              El proyecto Next.js 14 está configurado y listo para desarrollo.
            </p>

            <div className="space-y-2">
              <h3 className="font-semibold">✅ Completado:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Next.js 14 + TypeScript configurado</li>
                <li>Tailwind CSS + shadcn/ui instalado</li>
                <li>Layout base creado</li>
                <li>Componentes UI (Button, Card)</li>
                <li>TanStack Query, Recharts, Lucide icons</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">🚀 Siguiente Sprint:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Implementar Sidebar navigation</li>
                <li>Crear metric cards dinámicos</li>
                <li>Agregar gráficos con Recharts</li>
                <li>Integrar API client</li>
              </ul>
            </div>

            <Button className="mt-4">
              Comenzar Sprint 2
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
