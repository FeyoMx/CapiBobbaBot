# CapiBobbaBot Dashboard - Next.js 14

Dashboard modernizado para CapiBobbaBot con Next.js 14, TypeScript, TanStack Query y Tailwind CSS.

**Status**: Sprint 2 Completado ✅

## 🎯 Features Implementadas

### Sprint 1 - Foundation ✅
- ✅ Next.js 14 con App Router
- ✅ TypeScript configurado con strict mode
- ✅ Tailwind CSS con design tokens
- ✅ shadcn/ui componentes base (Button, Card, Badge)
- ✅ Layout root configurado
- ✅ Dependencias core instaladas

### Sprint 2 - Overview Dashboard ✅
- ✅ **Navegación**: Sidebar responsive con 6 rutas (Dashboard, Pedidos, Analytics, Seguridad, Encuestas, Config)
- ✅ **TypeScript Types**: 200+ líneas de types (DashboardMetrics, Order, SecurityEvent, etc.)
- ✅ **API Client**: Axios con interceptors, error handling, timeout
- ✅ **React Query**: Provider + custom hooks (useMetrics, useSalesChart, etc.)
- ✅ **KPI Cards**: 4 metric cards dinámicos con trends (↑/↓ %)
- ✅ **Gráficos Interactivos** (Recharts):
  - LineChart: Sales over time (24h)
  - BarChart: Revenue by product
  - AreaChart: Gemini usage stacked (calls, cache hits/misses)
- ✅ **Tabla de Pedidos**: Recent Orders con badges de estado
- ✅ **Páginas**: 6 rutas con routing (1 completa + 5 placeholders)
- ✅ **UX**: Loading skeletons, error states, mobile-first design

## 🏃 Cómo Ejecutar

### Desarrollo

```bash
cd dashboard-next
npm run dev
```

El dashboard estará disponible en: **http://localhost:3001**

### Build de Producción

```bash
npm run build
npm start
```

## 📁 Estructura del Proyecto

```
dashboard-next/
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout con QueryProvider
│   │   ├── page.tsx                  # Dashboard Overview
│   │   ├── pedidos/page.tsx          # Pedidos (placeholder)
│   │   ├── analytics/page.tsx        # Analytics (placeholder)
│   │   ├── seguridad/page.tsx        # Seguridad (placeholder)
│   │   ├── encuestas/page.tsx        # Encuestas (placeholder)
│   │   ├── configuracion/page.tsx    # Configuración (placeholder)
│   │   └── globals.css               # Tailwind + design tokens
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── MetricCard.tsx        # KPI cards con trends
│   │   │   ├── SalesChart.tsx        # LineChart (Recharts)
│   │   │   ├── RevenueChart.tsx      # BarChart (Recharts)
│   │   │   ├── GeminiUsageChart.tsx  # AreaChart (Recharts)
│   │   │   └── RecentOrdersTable.tsx # Tabla de pedidos
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx           # Sidebar responsive
│   │   │   └── DashboardLayout.tsx   # Layout wrapper
│   │   └── ui/                       # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       └── badge.tsx
│   ├── lib/
│   │   ├── api/
│   │   │   └── client.ts             # API Client (Axios)
│   │   ├── hooks/
│   │   │   └── useMetrics.ts         # React Query hooks
│   │   ├── providers/
│   │   │   └── QueryProvider.tsx     # TanStack Query Provider
│   │   └── utils.ts                  # Utilities (cn)
│   └── types/
│       └── index.ts                  # TypeScript types (200+ líneas)
├── public/                           # Static files
├── .env.local                        # Environment variables
├── next.config.mjs                   # Next.js config
├── tailwind.config.ts                # Tailwind config
└── tsconfig.json                     # TypeScript config
```

## 🔧 Variables de Entorno

Archivo: `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_WS_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_REALTIME=true
```

## 📚 Stack Tecnológico

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| Framework | Next.js (App Router) | 14.2.0 |
| Language | TypeScript (strict) | 5.9.3 |
| Styling | Tailwind CSS | 3.4.18 |
| UI Components | shadcn/ui | Latest |
| Data Fetching | TanStack Query | 5.90.2 |
| Charts | Recharts | 3.2.1 |
| Icons | Lucide React | 0.544.0 |
| HTTP Client | Axios | 1.12.2 |
| Date Utils | date-fns | 4.1.0 |
| State (future) | Zustand | 5.0.8 |
| Tables (future) | TanStack Table | 8.21.3 |

## 🎨 Design System

- **Colors**: CSS variables con soporte para dark mode (definidas en globals.css)
- **Components**: shadcn/ui para consistencia y accesibilidad
- **Typography**: Inter font (Google Fonts)
- **Spacing**: Tailwind default (4px base)
- **Border Radius**: Tokens personalizados (sm, md, lg)

## 📊 Endpoints del Backend Requeridos

Para conectar completamente el dashboard, el backend debe exponer:

```typescript
// Metrics
GET /api/metrics/dashboard
Response: { orders: {...}, revenue: {...}, gemini: {...}, cache: {...} }

GET /api/metrics/sales-chart?range=daily
Response: ChartDataPoint[]

GET /api/metrics/revenue-by-product
Response: RevenueByProduct[]

GET /api/metrics/gemini-usage
Response: GeminiUsageData[]

// Orders
GET /api/orders?page=1&limit=10&status=pending
Response: { orders: Order[], total: number, hasMore: boolean }

GET /api/orders/:id
Response: Order

PATCH /api/orders/:id/status
Body: { status: 'confirmed' | 'preparing' | etc. }
Response: Order

// Security
GET /api/security/stats
Response: SecurityStats

// Health
GET /api/health
Response: HealthCheck
```

**Nota**: El dashboard maneja gracefully la ausencia de estos endpoints (muestra estados de error y datos mock).

## 🚀 Próximos Sprints

### Sprint 3 - Orders Management 🔨
- [ ] TanStack Table completo (sorting, filtering, pagination)
- [ ] Filtros avanzados de pedidos (estado, fecha, cliente)
- [ ] Búsqueda de pedidos
- [ ] Vista detallada de pedido (modal o página)
- [ ] Actualización de estado con optimistic updates
- [ ] WebSocket provider para real-time updates
- [ ] Exportar pedidos a CSV

### Sprint 4 - Analytics & Security 📊
- [ ] Página de Analytics completa con gráficos avanzados
- [ ] Página de Seguridad con eventos en tiempo real
- [ ] Página de Encuestas con NPS y análisis de sentimiento
- [ ] Análisis de tendencias y reportes

### Sprint 5 - Polish & Deploy 🚀
- [ ] Página de Configuración (editar business_data, Gemini settings, etc.)
- [ ] Dark mode toggle UI
- [ ] Performance optimization (code splitting, lazy loading)
- [ ] Deploy a producción (Vercel/Render)
- [ ] Integración completa con backend
- [ ] Testing E2E (Playwright/Cypress)

## 🧪 Testing

```bash
# Linting
npm run lint

# Build (verifica TypeScript errors)
npm run build
```

## 📈 Métricas de Performance

Objetivos:
- ✅ Bundle size: < 200KB (gzip)
- ⏳ TTI (Time to Interactive): < 1.5s
- ⏳ Lighthouse score: > 90
- ✅ Mobile-first responsive

## 🔗 Links Útiles

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query)
- [Recharts](https://recharts.org/)
- [SPRINT_1_SUMMARY.md](../SPRINT_1_SUMMARY.md)
- [SPRINT_2_SUMMARY.md](../SPRINT_2_SUMMARY.md)

---

**Status**: Sprint 2 Completado ✅
**Última actualización**: 2025-10-05
**Versión**: 0.2.0
**Próximo Sprint**: Sprint 3 - Orders Management
