# 💻 Ejemplos de Código - Dashboard Modernizado

**Complemento**: DASHBOARD_ANALYSIS_PROPOSAL.md
**Stack**: Next.js 14 + TypeScript + Tailwind + Recharts + shadcn/ui

---

## 📦 Setup Inicial

### 1. Crear Proyecto Next.js

```bash
# Crear proyecto Next.js 14 con TypeScript
npx create-next-app@latest dashboard-next --typescript --tailwind --app --src-dir

cd dashboard-next

# Instalar dependencias core
npm install @tanstack/react-query @tanstack/react-table
npm install recharts date-fns zustand
npm install sonner react-hook-form zod
npm install lucide-react class-variance-authority clsx tailwind-merge

# Instalar shadcn/ui
npx shadcn-ui@latest init

# Agregar componentes shadcn
npx shadcn-ui@latest add button card table input select tabs badge
npx shadcn-ui@latest add dropdown-menu dialog alert toast
```

### 2. Configuración TypeScript

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 3. Tailwind Config

```javascript
// tailwind.config.ts
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... más colores de shadcn
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
```

---

## 🏗️ Arquitectura Base

### 1. Types Definitions

```typescript
// src/types/order.ts

export interface Order {
  id: string
  from: string
  customerName?: string
  timestamp: number
  type: 'order' | 'inquiry'
  status: 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled'
  order?: {
    summary: string
    total: number
    items: OrderItem[]
  }
  delivery?: {
    address: string
    instructions?: string
  }
  payment?: {
    method: 'Efectivo' | 'Transferencia' | 'Tarjeta'
    status: 'pending' | 'confirmed' | 'failed'
    cashDenomination?: number
    proofImageId?: string
  }
}

export interface OrderItem {
  name: string
  quantity: number
  price: number
  customizations?: string[]
}

export interface OrderFilters {
  dateRange: 'today' | 'last7days' | 'last30days' | 'custom'
  status: 'all' | Order['status']
  search: string
  customDateStart?: Date
  customDateEnd?: Date
}
```

```typescript
// src/types/metric.ts

export interface DashboardMetrics {
  ordersToday: number
  ordersChange: number
  revenue24h: number
  revenueChange: number
  geminiCalls: number
  geminiChange: number
  cacheHitRate: number
  cacheChange: number
  ordersTimeline: TimelineData[]
  revenueByProduct: ProductRevenue[]
  geminiUsage: GeminiUsage
  recentAlerts: Alert[]
}

export interface TimelineData {
  date: string
  orders: number
  revenue: number
}

export interface ProductRevenue {
  product: string
  revenue: number
  quantity: number
}

export interface GeminiUsage {
  calls: number
  cacheHits: number
  avgResponseTime: number
  errorRate: number
}

export interface Alert {
  id: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  type: string
  message: string
  timestamp: number
}
```

### 2. API Client

```typescript
// src/lib/api/client.ts

import axios, { AxiosInstance } from 'axios'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if exists
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    const response = await this.client.get<T>(url, { params })
    return response.data
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data)
    return response.data
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(url, data)
    return response.data
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url)
    return response.data
  }
}

export const apiClient = new ApiClient()
```

```typescript
// src/lib/api/orders.ts

import { apiClient } from './client'
import { Order, OrderFilters } from '@/types/order'

export const ordersApi = {
  getOrders: async (filters: OrderFilters) => {
    return apiClient.get<{ orders: Order[]; total: number }>('/api/orders', {
      ...filters,
      dateStart: filters.customDateStart?.toISOString(),
      dateEnd: filters.customDateEnd?.toISOString(),
    })
  },

  getOrder: async (id: string) => {
    return apiClient.get<Order>(`/api/orders/${id}`)
  },

  updateOrderStatus: async (id: string, status: Order['status']) => {
    return apiClient.put<Order>(`/api/orders/${id}/status`, { status })
  },

  exportOrders: async (filters: OrderFilters) => {
    const response = await apiClient.get<Blob>('/api/orders/export', {
      ...filters,
      responseType: 'blob',
    })

    // Download CSV
    const url = window.URL.createObjectURL(response)
    const a = document.createElement('a')
    a.href = url
    a.download = `pedidos-${new Date().toISOString()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  },
}
```

### 3. TanStack Query Hooks

```typescript
// src/lib/hooks/use-orders.ts

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from '@/lib/api/orders'
import { OrderFilters, Order } from '@/types/order'
import { toast } from 'sonner'

export function useOrders(filters: OrderFilters) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => ordersApi.getOrders(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 30, // 30 seconds
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getOrder(id),
    enabled: !!id,
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Order['status'] }) =>
      ordersApi.updateOrderStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.setQueryData(['order', data.id], data)
      toast.success('Estado del pedido actualizado')
    },
    onError: (error) => {
      toast.error('Error al actualizar pedido')
      console.error(error)
    },
  })
}

export function useExportOrders() {
  return useMutation({
    mutationFn: (filters: OrderFilters) => ordersApi.exportOrders(filters),
    onSuccess: () => {
      toast.success('Pedidos exportados exitosamente')
    },
    onError: () => {
      toast.error('Error al exportar pedidos')
    },
  })
}
```

---

## 🎨 Components

### 1. Metric Card

```typescript
// src/components/charts/metric-card.tsx

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon: LucideIcon
  loading?: boolean
}

export function MetricCard({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  loading,
}: MetricCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400'
      case 'down':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↑'
      case 'down':
        return '↓'
      default:
        return '→'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="h-4 w-24 animate-pulse bg-muted rounded" />
          <div className="h-4 w-4 animate-pulse bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-32 animate-pulse bg-muted rounded mb-2" />
          <div className="h-3 w-20 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className={cn('text-xs flex items-center gap-1 mt-1', getTrendColor())}>
            <span>{getTrendIcon()}</span>
            <span className="font-medium">{Math.abs(change)}%</span>
            <span className="text-muted-foreground">vs ayer</span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
```

### 2. Orders Table with TanStack Table

```typescript
// src/components/tables/orders-table.tsx

'use client'

import { useState } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Order } from '@/types/order'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { OrderActions } from './order-actions'

const columns: ColumnDef<Order>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => (
      <div className="font-mono text-xs">{row.getValue<string>('id').slice(0, 8)}</div>
    ),
  },
  {
    accessorKey: 'from',
    header: 'Cliente',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">
          {row.original.customerName || 'Anónimo'}
        </div>
        <div className="text-sm text-muted-foreground">
          {row.getValue<string>('from')}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'order.total',
    header: 'Total',
    cell: ({ row }) => formatCurrency(row.original.order?.total || 0),
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.getValue<Order['status']>('status')
      const variant = {
        pending: 'secondary',
        confirmed: 'default',
        preparing: 'outline',
        delivered: 'success',
        cancelled: 'destructive',
      }[status]

      return <Badge variant={variant as any}>{status}</Badge>
    },
  },
  {
    accessorKey: 'payment.method',
    header: 'Pago',
    cell: ({ row }) => row.original.payment?.method || 'N/A',
  },
  {
    accessorKey: 'timestamp',
    header: 'Fecha',
    cell: ({ row }) => formatDate(row.getValue<number>('timestamp') * 1000),
  },
  {
    id: 'actions',
    cell: ({ row }) => <OrderActions order={row.original} />,
  },
]

interface OrdersTableProps {
  data: Order[]
  isLoading: boolean
  error: Error | null
}

export function OrdersTable({ data, isLoading, error }: OrdersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  })

  if (isLoading) {
    return <TableSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Error al cargar pedidos</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No se encontraron pedidos
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {table.getRowModel().rows.length} de {data.length} pedidos
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  )
}
```

### 3. Sales Chart with Recharts

```typescript
// src/components/charts/sales-over-time.tsx

'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TimelineData } from '@/types/metric'

interface SalesOverTimeChartProps {
  data: TimelineData[]
}

export function SalesOverTimeChart({ data }: SalesOverTimeChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas en el Tiempo</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string) => [
                name === 'revenue' ? `$${value}` : value,
                name === 'revenue' ? 'Revenue' : 'Pedidos',
              ]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))' }}
              name="Revenue"
            />
            <Line
              type="monotone"
              dataKey="orders"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--chart-2))' }}
              name="Pedidos"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

---

## 📄 Pages

### 1. Overview Dashboard

```typescript
// src/app/page.tsx

import { Metadata } from 'next'
import { ShoppingCart, DollarSign, Cpu, Database } from 'lucide-react'
import { MetricCard } from '@/components/charts/metric-card'
import { SalesOverTimeChart } from '@/components/charts/sales-over-time'
import { RecentOrdersTable } from '@/components/tables/recent-orders-table'
import { getMetrics, getRecentOrders } from '@/lib/api/metrics'

export const metadata: Metadata = {
  title: 'Dashboard | CapiBobbaBot',
  description: 'Panel de control principal',
}

export default async function DashboardPage() {
  // Server-side data fetching
  const [metrics, recentOrders] = await Promise.all([
    getMetrics(),
    getRecentOrders({ limit: 10 }),
  ])

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview de métricas y actividad reciente
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Pedidos Hoy"
          value={metrics.ordersToday}
          change={metrics.ordersChange}
          trend="up"
          icon={ShoppingCart}
        />
        <MetricCard
          title="Revenue 24h"
          value={`$${metrics.revenue24h.toLocaleString()}`}
          change={metrics.revenueChange}
          trend="up"
          icon={DollarSign}
        />
        <MetricCard
          title="Gemini Calls"
          value={metrics.geminiCalls}
          change={metrics.geminiChange}
          trend="neutral"
          icon={Cpu}
        />
        <MetricCard
          title="Cache Hit Rate"
          value={`${metrics.cacheHitRate}%`}
          change={metrics.cacheChange}
          trend="up"
          icon={Database}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SalesOverTimeChart data={metrics.ordersTimeline} />
        <ProductPerformanceChart data={metrics.revenueByProduct} />
      </div>

      {/* Recent Orders */}
      <RecentOrdersTable orders={recentOrders} />
    </div>
  )
}
```

### 2. Orders Page

```typescript
// src/app/(dashboard)/pedidos/page.tsx

'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { useOrders, useExportOrders } from '@/lib/hooks/use-orders'
import { OrdersTable } from '@/components/tables/orders-table'
import { OrderFilters as OrderFiltersComponent } from '@/components/tables/order-filters'
import { Button } from '@/components/ui/button'
import { OrderFilters } from '@/types/order'

export default function PedidosPage() {
  const [filters, setFilters] = useState<OrderFilters>({
    dateRange: 'last7days',
    status: 'all',
    search: '',
  })

  const { data, isLoading, error } = useOrders(filters)
  const exportMutation = useExportOrders()

  const handleExport = () => {
    exportMutation.mutate(filters)
  }

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestión de Pedidos
          </h1>
          <p className="text-muted-foreground">
            {data?.total || 0} pedidos encontrados
          </p>
        </div>
        <Button onClick={handleExport} disabled={exportMutation.isPending}>
          <Download className="mr-2 h-4 w-4" />
          {exportMutation.isPending ? 'Exportando...' : 'Exportar CSV'}
        </Button>
      </div>

      {/* Filters */}
      <OrderFiltersComponent filters={filters} onFiltersChange={setFilters} />

      {/* Table */}
      <OrdersTable
        data={data?.orders || []}
        isLoading={isLoading}
        error={error}
      />
    </div>
  )
}
```

---

## 🌐 Real-time Updates

```typescript
// src/components/providers/realtime-provider.tsx

'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'

let socket: Socket | null = null

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Connect to WebSocket
    socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000', {
      transports: ['websocket'],
    })

    socket.on('connect', () => {
      console.log('✅ WebSocket connected')
    })

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected')
    })

    // Listen for new orders
    socket.on('new_order', (order) => {
      queryClient.setQueryData(['orders'], (old: any) => ({
        ...old,
        orders: [order, ...(old?.orders || [])],
        total: (old?.total || 0) + 1,
      }))

      toast.success('🛒 Nuevo pedido recibido!', {
        description: `Cliente: ${order.from}`,
      })
    })

    // Listen for metrics updates
    socket.on('metrics_update', (metrics) => {
      queryClient.setQueryData(['metrics'], metrics)
    })

    // Listen for security alerts
    socket.on('security_alert', (alert) => {
      queryClient.invalidateQueries({ queryKey: ['security', 'alerts'] })

      toast.error('🚨 Alerta de seguridad', {
        description: alert.message,
      })
    })

    return () => {
      socket?.disconnect()
    }
  }, [queryClient])

  return <>{children}</>
}
```

---

## 🎨 Utility Functions

```typescript
// src/lib/utils/format.ts

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value)
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

export function formatRelativeTime(timestamp: number): string {
  const rtf = new Intl.RelativeTimeFormat('es-MX', { numeric: 'auto' })
  const now = Date.now()
  const diff = timestamp - now

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (Math.abs(minutes) < 60) {
    return rtf.format(minutes, 'minute')
  } else if (Math.abs(hours) < 24) {
    return rtf.format(hours, 'hour')
  } else {
    return rtf.format(days, 'day')
  }
}
```

---

## 🚀 Ready to Deploy!

Estos ejemplos están **listos para copiar y pegar** en tu nuevo proyecto Next.js. Solo necesitas:

1. ✅ Crear el proyecto con `create-next-app`
2. ✅ Instalar dependencias
3. ✅ Copiar los archivos de ejemplo
4. ✅ Configurar variables de entorno
5. ✅ Correr `npm run dev`

**Siguiente paso**: Crear el proyecto base y comenzar con el Sprint 1 del plan de implementación.

