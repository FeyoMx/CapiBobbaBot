# 🗺️ Dashboard CapiBobbaBot - Roadmap de Mejoras 2025

**Fecha de Creación:** 2025-10-09
**Versión Actual:** v2.12.0 (Dashboard Next.js 14)
**Analista:** Dashboard Expert Agent
**Basado en:** Análisis con Chrome DevTools en producción

---

## 📊 **Estado Actual del Dashboard**

### **Progreso General: 95%** ✅

| Sprint | Status | Completitud | Fecha |
|--------|--------|-------------|-------|
| Sprint 1: Foundation | ✅ Completado | 100% | 2025-10-05 |
| Sprint 2: Overview Dashboard | ✅ Completado | 100% | 2025-10-05 |
| Sprint 3: Orders Management | ✅ Completado | 100% | 2025-10-05 |
| Sprint 4: Analytics & Security | ✅ Completado | 90% | 2025-10-05 |
| Sprint 5: Polish & Deploy | ✅ Completado | 85% | 2025-10-05 |

### **Performance Metrics (Producción)** 🚀

| Métrica | Valor Actual | Target | Status |
|---------|--------------|--------|--------|
| LCP | 1,022 ms | < 900 ms | ⚠️ Bueno (optimizable) |
| CLS | 0.09 | < 0.05 | ⚠️ Bueno (optimizable) |
| TTFB | 413 ms | < 400 ms | ✅ Excelente |
| FCP | ~800 ms | < 700 ms | ⚠️ Bueno |
| Bundle Size | ~500 KB | < 400 KB | ⚠️ Aceptable |
| Console Errors | 0 | 0 | ✅ Perfecto |

---

## 🎯 **Roadmap de Mejoras**

### **Sprint 6: Performance Optimization** (Semana 1) 🔥

**Objetivo:** Mejorar métricas Core Web Vitals hasta nivel "Excellent"
**Duración:** 5 días
**Prioridad:** ALTA

#### **Día 1: CLS Optimization (0.09 → 0.05)**

**Tareas:**

1. **Agregar Fixed Heights a Charts**
   ```tsx
   // Archivo: src/components/dashboard/SalesChart.tsx
   // Línea: ~20

   // ANTES:
   <Card>
     <CardContent>
       <ResponsiveContainer width="100%" height={350}>

   // DESPUÉS:
   <Card className="h-[450px]">
     <CardContent className="h-[calc(100%-80px)]">
       <ResponsiveContainer width="100%" height="100%">
   ```

2. **Skeleton Loaders con Dimensiones Exactas**
   ```tsx
   // Archivo: src/components/dashboard/MetricCard.tsx
   // NUEVO: MetricCardSkeleton.tsx

   export function MetricCardSkeleton() {
     return (
       <Card className="h-[140px]"> {/* Altura exacta del card real */}
         <CardContent className="pt-6">
           <Skeleton className="h-4 w-20 mb-4" />
           <Skeleton className="h-8 w-16 mb-2" />
           <Skeleton className="h-3 w-32" />
         </CardContent>
       </Card>
     );
   }
   ```

3. **Reserve Space para Async Images**
   ```tsx
   // Archivo: src/app/layout.tsx
   // Agregar aspect-ratio a contenedores de imágenes

   <div className="aspect-square w-full">
     <Image src={...} fill className="object-cover" />
   </div>
   ```

**Archivos a modificar:**
- `src/components/dashboard/SalesChart.tsx`
- `src/components/dashboard/RevenueChart.tsx`
- `src/components/dashboard/GeminiUsageChart.tsx`
- `src/components/analytics/SalesAnalysisChart.tsx`
- `src/components/analytics/TopProductsChart.tsx`
- `src/components/analytics/GeminiPerformanceChart.tsx`

**Verificación:**
```bash
# Run Lighthouse
npm run lighthouse

# Target: CLS < 0.05
```

---

#### **Día 2: Bundle Optimization (500 KB → 400 KB)**

**Tareas:**

1. **Actualizar next.config.mjs**
   ```typescript
   // Archivo: dashboard-next/next.config.mjs
   // AGREGAR:

   /** @type {import('next').NextConfig} */
   const nextConfig = {
     reactStrictMode: true,
     compress: true,

     // NUEVO: Optimización de paquetes
     experimental: {
       optimizePackageImports: [
         'recharts',
         'lucide-react',
         '@tanstack/react-table',
         '@tanstack/react-query',
         'date-fns',
       ],
       webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'FID', 'TTFB'],
     },

     // NUEVO: Image optimization
     images: {
       formats: ['image/avif', 'image/webp'],
       minimumCacheTTL: 31536000,
     },

     // NUEVO: Compiler options
     compiler: {
       removeConsole: process.env.NODE_ENV === 'production',
     },
   }

   export default nextConfig;
   ```

2. **Lazy Load Heavy Components**
   ```tsx
   // Archivo: src/app/page.tsx
   // AGREGAR imports dinámicos

   import dynamic from 'next/dynamic';

   const RevenueChart = dynamic(
     () => import('@/components/dashboard/RevenueChart'),
     {
       loading: () => <Skeleton className="h-[400px]" />,
       ssr: false, // Solo si no es crítico para SEO
     }
   );

   const GeminiUsageChart = dynamic(
     () => import('@/components/dashboard/GeminiUsageChart'),
     { loading: () => <Skeleton className="h-[300px]" /> }
   );
   ```

3. **Tree Shaking de Recharts**
   ```tsx
   // Archivo: package.json
   // ACTUALIZAR recharts import

   // ANTES (importa todo):
   import { LineChart, Line, XAxis, ... } from 'recharts';

   // DESPUÉS (tree-shakeable):
   import { LineChart } from 'recharts/lib/chart/LineChart';
   import { Line } from 'recharts/lib/cartesian/Line';
   import { XAxis } from 'recharts/lib/cartesian/XAxis';
   ```

**Archivos a modificar:**
- `dashboard-next/next.config.mjs`
- `src/app/page.tsx`
- `src/app/analytics/page.tsx`
- Todos los componentes que usen Recharts

**Verificación:**
```bash
# Analizar bundle
npm run build
npx @next/bundle-analyzer

# Target: Bundle < 400 KB (gzipped)
```

---

#### **Día 3: Resource Hints & Preloading**

**Tareas:**

1. **DNS Prefetch y Preconnect**
   ```tsx
   // Archivo: src/app/layout.tsx
   // AGREGAR en <head>

   export default function RootLayout({ children }) {
     return (
       <html lang="es" suppressHydrationWarning>
         <head>
           {/* NUEVO: Resource hints */}
           <link rel="dns-prefetch" href="https://capibobbabot.onrender.com" />
           <link rel="preconnect" href="https://capibobbabot.onrender.com" crossOrigin="anonymous" />
           <link rel="preconnect" href="https://fonts.googleapis.com" />
           <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
         </head>
         <body className={inter.className}>
           {/* ... */}
         </body>
       </html>
     );
   }
   ```

2. **Preload Critical Resources**
   ```tsx
   // Archivo: src/app/layout.tsx (metadata)

   export const metadata = {
     title: 'CapiBobbaBot Dashboard',
     description: '...',
     icons: { icon: '/favicon.svg' },

     // NUEVO: Preload critical assets
     other: {
       'link-preload-css': `<link rel="preload" href="/_next/static/css/app.css" as="style" />`,
       'link-preload-font': `<link rel="preload" href="/_next/static/media/inter.woff2" as="font" type="font/woff2" crossorigin />`,
     },
   };
   ```

3. **Priority Hints para Images**
   ```tsx
   // Archivo: src/components/dashboard/MetricCard.tsx

   // Logo o hero image
   <Image
     src="..."
     priority // NUEVO: High priority
     quality={90}
   />

   // Imágenes below-the-fold
   <Image
     src="..."
     loading="lazy" // NUEVO: Lazy load
     quality={75}
   />
   ```

**Archivos a modificar:**
- `src/app/layout.tsx`
- Componentes con `<Image>` (si hay)

**Verificación:**
```bash
# Chrome DevTools > Network
# Verificar que DNS prefetch se ejecuta antes de otros requests
```

---

#### **Día 4: Forced Reflow Elimination**

**Tareas:**

1. **Auditar Código que Causa Reflow**
   ```bash
   # Buscar patrones problemáticos
   grep -r "offsetHeight\|offsetWidth\|getBoundingClientRect" src/
   ```

2. **Usar ResizeObserver en lugar de Manual Queries**
   ```tsx
   // Archivo: src/lib/hooks/useElementSize.ts
   // NUEVO HOOK

   import { useEffect, useRef, useState } from 'react';

   export function useElementSize<T extends HTMLElement>() {
     const ref = useRef<T>(null);
     const [size, setSize] = useState({ width: 0, height: 0 });

     useEffect(() => {
       if (!ref.current) return;

       const observer = new ResizeObserver((entries) => {
         const { width, height } = entries[0].contentRect;
         setSize({ width, height });
       });

       observer.observe(ref.current);
       return () => observer.disconnect();
     }, []);

     return { ref, size };
   }
   ```

3. **Batch DOM Reads/Writes**
   ```tsx
   // ANTES (causa forced reflow):
   element.style.width = '100px';
   const height = element.offsetHeight; // FORCED REFLOW!
   element.style.height = height + 'px';

   // DESPUÉS (batch operations):
   requestAnimationFrame(() => {
     // READ phase
     const height = element.offsetHeight;

     requestAnimationFrame(() => {
       // WRITE phase
       element.style.width = '100px';
       element.style.height = height + 'px';
     });
   });
   ```

**Archivos a revisar:**
- Componentes con manipulación DOM directa
- Charts que calculan dimensiones
- Tooltips/Modals con positioning dinámico

**Verificación:**
```bash
# Chrome DevTools > Performance
# Buscar "Forced reflow" warnings en timeline
```

---

#### **Día 5: Testing & Deployment**

**Tareas:**

1. **Setup Lighthouse CI**
   ```yaml
   # Archivo: .github/workflows/lighthouse.yml
   # NUEVO

   name: Lighthouse CI
   on: [push, pull_request]

   jobs:
     lighthouse:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
         - run: npm ci
         - run: npm run build
         - uses: treosh/lighthouse-ci-action@v9
           with:
             urls: |
               https://capibobbabot-dashboard-app.onrender.com
               https://capibobbabot-dashboard-app.onrender.com/pedidos
               https://capibobbabot-dashboard-app.onrender.com/analytics
             budgetPath: ./lighthouse-budget.json
             uploadArtifacts: true
   ```

2. **Crear Budget de Performance**
   ```json
   // Archivo: lighthouse-budget.json
   // NUEVO

   [
     {
       "path": "/*",
       "timings": [
         { "metric": "first-contentful-paint", "budget": 700 },
         { "metric": "largest-contentful-paint", "budget": 900 },
         { "metric": "cumulative-layout-shift", "budget": 0.05 },
         { "metric": "total-blocking-time", "budget": 200 }
       ],
       "resourceSizes": [
         { "resourceType": "script", "budget": 400 },
         { "resourceType": "stylesheet", "budget": 50 },
         { "resourceType": "total", "budget": 600 }
       ]
     }
   ]
   ```

3. **Run Performance Tests**
   ```bash
   # Local testing
   npm run build
   npm run lighthouse

   # Target metrics:
   # LCP < 900ms ✅
   # CLS < 0.05 ✅
   # FCP < 700ms ✅
   # Bundle < 400KB ✅
   ```

4. **Deploy to Production**
   ```bash
   # Commit changes
   git add .
   git commit -m "perf(sprint6): Optimize Core Web Vitals

   - Fix CLS from 0.09 to 0.05 (fixed heights, skeletons)
   - Reduce bundle size from 500KB to 380KB (lazy loading, tree shaking)
   - Add resource hints (dns-prefetch, preconnect)
   - Eliminate forced reflows (ResizeObserver)
   - Setup Lighthouse CI

   Archivos modificados:
   - next.config.mjs - Bundle optimization
   - src/app/layout.tsx - Resource hints
   - src/components/dashboard/*.tsx - Fixed heights
   - .github/workflows/lighthouse.yml - CI setup"

   git push origin main
   ```

**Deliverables:**
- ✅ LCP mejorado a < 900ms
- ✅ CLS reducido a < 0.05
- ✅ Bundle size < 400 KB
- ✅ Lighthouse CI funcionando
- ✅ Documentación actualizada

---

### **Sprint 7: Advanced Features** (Semana 2) 🚀

**Objetivo:** Completar features pendientes y agregar funcionalidades avanzadas
**Duración:** 5 días
**Prioridad:** ALTA

#### **Día 1-2: Página de Configuración Completa**

**Tareas:**

1. **Crear Estructura con Tabs**
   ```tsx
   // Archivo: src/app/configuracion/page.tsx
   // IMPLEMENTAR COMPLETO

   'use client';

   import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
   import { GeneralSettings } from '@/components/configuracion/GeneralSettings';
   import { MenuSettings } from '@/components/configuracion/MenuSettings';
   import { AppearanceSettings } from '@/components/configuracion/AppearanceSettings';
   import { NotificationSettings } from '@/components/configuracion/NotificationSettings';
   import { IntegrationSettings } from '@/components/configuracion/IntegrationSettings';

   export default function ConfiguracionPage() {
     return (
       <DashboardLayout>
         <Tabs defaultValue="general">
           <TabsList>
             <TabsTrigger value="general">General</TabsTrigger>
             <TabsTrigger value="menu">Menú</TabsTrigger>
             <TabsTrigger value="appearance">Apariencia</TabsTrigger>
             <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
             <TabsTrigger value="integrations">Integraciones</TabsTrigger>
           </TabsList>

           <TabsContent value="general">
             <GeneralSettings />
           </TabsContent>
           {/* ... otros tabs */}
         </Tabs>
       </DashboardLayout>
     );
   }
   ```

2. **Tab General: Business Data Editor**
   ```tsx
   // Archivo: src/components/configuracion/GeneralSettings.tsx
   // NUEVO

   export function GeneralSettings() {
     const { data: businessData, isLoading } = useQuery({
       queryKey: ['businessData'],
       queryFn: () => apiClient.getBusinessData(),
     });

     const updateMutation = useMutation({
       mutationFn: apiClient.updateBusinessData,
       onSuccess: () => toast.success('Configuración actualizada'),
     });

     return (
       <Card>
         <CardHeader>
           <CardTitle>Información del Negocio</CardTitle>
         </CardHeader>
         <CardContent>
           <Form onSubmit={handleSubmit}>
             <Input label="Nombre del Negocio" name="name" />
             <Input label="Dirección" name="address" />
             <Input label="Teléfono" name="phone" />

             <Label>Horarios de Atención</Label>
             <div className="grid grid-cols-2 gap-4">
               <Input type="time" label="Apertura" name="openTime" />
               <Input type="time" label="Cierre" name="closeTime" />
             </div>

             <div className="flex items-center gap-2">
               <Switch
                 checked={maintenanceMode}
                 onCheckedChange={setMaintenanceMode}
               />
               <Label>Modo Mantenimiento</Label>
             </div>

             <Button type="submit">Guardar Cambios</Button>
           </Form>
         </CardContent>
       </Card>
     );
   }
   ```

3. **Tab Menú: Product Management**
   ```tsx
   // Archivo: src/components/configuracion/MenuSettings.tsx
   // NUEVO

   export function MenuSettings() {
     const { data: products } = useQuery({
       queryKey: ['products'],
       queryFn: () => apiClient.getProducts(),
     });

     return (
       <div className="space-y-4">
         <div className="flex justify-between">
           <h3>Productos del Menú</h3>
           <Button onClick={() => setShowAddDialog(true)}>
             <Plus className="mr-2 h-4 w-4" />
             Agregar Producto
           </Button>
         </div>

         <ProductsTable
           data={products}
           onEdit={handleEdit}
           onDelete={handleDelete}
         />

         <AddProductDialog
           open={showAddDialog}
           onClose={() => setShowAddDialog(false)}
         />
       </div>
     );
   }
   ```

4. **Tab Apariencia: Theme Settings**
   ```tsx
   // Archivo: src/components/configuracion/AppearanceSettings.tsx
   // NUEVO

   export function AppearanceSettings() {
     const { theme, setTheme } = useTheme();

     return (
       <Card>
         <CardHeader>
           <CardTitle>Personalización</CardTitle>
         </CardHeader>
         <CardContent className="space-y-6">
           <div>
             <Label>Tema</Label>
             <RadioGroup value={theme} onValueChange={setTheme}>
               <div className="flex items-center gap-2">
                 <RadioGroupItem value="light" />
                 <Label>Claro</Label>
               </div>
               <div className="flex items-center gap-2">
                 <RadioGroupItem value="dark" />
                 <Label>Oscuro</Label>
               </div>
               <div className="flex items-center gap-2">
                 <RadioGroupItem value="system" />
                 <Label>Sistema</Label>
               </div>
             </RadioGroup>
           </div>

           <div>
             <Label>Idioma</Label>
             <Select defaultValue="es">
               <SelectItem value="es">Español</SelectItem>
               <SelectItem value="en">English</SelectItem>
             </Select>
           </div>

           <div>
             <Label>Layout del Dashboard</Label>
             <Select defaultValue="default">
               <SelectItem value="default">Por Defecto</SelectItem>
               <SelectItem value="compact">Compacto</SelectItem>
               <SelectItem value="comfortable">Cómodo</SelectItem>
             </Select>
           </div>
         </CardContent>
       </Card>
     );
   }
   ```

5. **Tab Notificaciones**
   ```tsx
   // Archivo: src/components/configuracion/NotificationSettings.tsx
   // NUEVO

   export function NotificationSettings() {
     return (
       <Card>
         <CardHeader>
           <CardTitle>Preferencias de Notificaciones</CardTitle>
         </CardHeader>
         <CardContent className="space-y-4">
           <div className="flex items-center justify-between">
             <div>
               <Label>Notificaciones de Pedidos</Label>
               <p className="text-sm text-muted-foreground">
                 Recibir alerta cuando llegue un nuevo pedido
               </p>
             </div>
             <Switch defaultChecked />
           </div>

           <div className="flex items-center justify-between">
             <div>
               <Label>Alertas de Seguridad</Label>
               <p className="text-sm text-muted-foreground">
                 Notificar eventos de seguridad críticos
               </p>
             </div>
             <Switch defaultChecked />
           </div>

           <div className="flex items-center justify-between">
             <div>
               <Label>Encuestas Negativas</Label>
               <p className="text-sm text-muted-foreground">
                 Alerta cuando un cliente dé rating bajo
               </p>
             </div>
             <Switch defaultChecked />
           </div>

           <Separator />

           <div>
             <Label>Email de Notificaciones</Label>
             <Input type="email" placeholder="admin@capibobba.com" />
           </div>
         </CardContent>
       </Card>
     );
   }
   ```

**Archivos a crear:**
- `src/app/configuracion/page.tsx` (reemplazar placeholder)
- `src/components/configuracion/GeneralSettings.tsx`
- `src/components/configuracion/MenuSettings.tsx`
- `src/components/configuracion/AppearanceSettings.tsx`
- `src/components/configuracion/NotificationSettings.tsx`
- `src/components/configuracion/IntegrationSettings.tsx`
- `src/components/configuracion/ProductsTable.tsx`
- `src/components/configuracion/AddProductDialog.tsx`

**Endpoints requeridos en backend:**
```typescript
GET    /api/business/config
PUT    /api/business/config
GET    /api/products
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
```

---

#### **Día 3: Virtual Scrolling para Tablas**

**Tareas:**

1. **Instalar Dependencia**
   ```bash
   npm install @tanstack/react-virtual
   ```

2. **Implementar Virtual Scrolling en OrdersTable**
   ```tsx
   // Archivo: src/components/orders/OrdersTable.tsx
   // MODIFICAR

   import { useVirtualizer } from '@tanstack/react-virtual';

   export function OrdersTable({ data, isLoading }) {
     const tableContainerRef = useRef<HTMLDivElement>(null);

     const rowVirtualizer = useVirtualizer({
       count: data.length,
       getScrollElement: () => tableContainerRef.current,
       estimateSize: () => 60, // Altura de cada fila
       overscan: 5, // Rows to render outside viewport
     });

     return (
       <div ref={tableContainerRef} className="h-[600px] overflow-auto">
         <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
           {rowVirtualizer.getVirtualItems().map((virtualRow) => {
             const row = data[virtualRow.index];
             return (
               <div
                 key={virtualRow.key}
                 style={{
                   position: 'absolute',
                   top: 0,
                   left: 0,
                   width: '100%',
                   height: `${virtualRow.size}px`,
                   transform: `translateY(${virtualRow.start}px)`,
                 }}
               >
                 <OrderRow order={row} />
               </div>
             );
           })}
         </div>
       </div>
     );
   }
   ```

3. **Aplicar a SecurityEventsTable**
   ```tsx
   // Archivo: src/components/security/SecurityEventsTable.tsx
   // AGREGAR virtual scrolling similar
   ```

**Archivos a modificar:**
- `src/components/orders/OrdersTable.tsx`
- `src/components/security/SecurityEventsTable.tsx`

**Verificación:**
```bash
# Probar con +1000 pedidos mock
# Scrolling debe ser smooth 60fps
```

---

#### **Día 4: Filtros Avanzados**

**Tareas:**

1. **Date Range Picker**
   ```bash
   npm install react-day-picker date-fns
   ```

   ```tsx
   // Archivo: src/components/shared/DateRangePicker.tsx
   // NUEVO

   import { DayPicker } from 'react-day-picker';
   import { format } from 'date-fns';
   import { es } from 'date-fns/locale';

   export function DateRangePicker({ value, onChange }) {
     const [range, setRange] = useState<DateRange | undefined>(value);

     return (
       <Popover>
         <PopoverTrigger asChild>
           <Button variant="outline">
             <CalendarIcon className="mr-2 h-4 w-4" />
             {range?.from ? (
               range.to ? (
                 <>
                   {format(range.from, 'dd MMM', { locale: es })} -{' '}
                   {format(range.to, 'dd MMM', { locale: es })}
                 </>
               ) : (
                 format(range.from, 'dd MMM', { locale: es })
               )
             ) : (
               'Seleccionar rango'
             )}
           </Button>
         </PopoverTrigger>
         <PopoverContent className="w-auto p-0" align="start">
           <DayPicker
             mode="range"
             selected={range}
             onSelect={(newRange) => {
               setRange(newRange);
               onChange(newRange);
             }}
             locale={es}
           />
         </PopoverContent>
       </Popover>
     );
   }
   ```

2. **Filtros Combinados en OrdersTable**
   ```tsx
   // Archivo: src/components/orders/OrderFilters.tsx
   // MEJORAR

   export function OrderFilters({ filters, onFiltersChange }) {
     return (
       <Card>
         <CardContent className="pt-6">
           <div className="grid gap-4 md:grid-cols-4">
             {/* Date Range */}
             <DateRangePicker
               value={filters.dateRange}
               onChange={(range) => onFiltersChange({ ...filters, dateRange: range })}
             />

             {/* Status Multi-Select */}
             <MultiSelect
               label="Estado"
               options={ORDER_STATUSES}
               value={filters.status}
               onChange={(status) => onFiltersChange({ ...filters, status })}
             />

             {/* Payment Method */}
             <MultiSelect
               label="Método de Pago"
               options={PAYMENT_METHODS}
               value={filters.paymentMethod}
               onChange={(method) => onFiltersChange({ ...filters, paymentMethod: method })}
             />

             {/* Search */}
             <Input
               placeholder="Buscar por cliente, ID..."
               value={filters.search}
               onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
               icon={<SearchIcon />}
             />
           </div>

           {/* Applied Filters */}
           <div className="flex gap-2 mt-4">
             {filters.status.length > 0 && (
               <Badge variant="secondary">
                 Estado: {filters.status.join(', ')}
                 <X className="ml-1 h-3 w-3 cursor-pointer" onClick={clearStatusFilter} />
               </Badge>
             )}
             {/* ... otros badges de filtros aplicados */}

             <Button variant="ghost" size="sm" onClick={resetAllFilters}>
               Limpiar todos
             </Button>
           </div>
         </CardContent>
       </Card>
     );
   }
   ```

3. **URL State Persistence**
   ```bash
   npm install nuqs
   ```

   ```tsx
   // Archivo: src/app/pedidos/page.tsx
   // AGREGAR URL state

   import { useQueryState } from 'nuqs';

   export default function PedidosPage() {
     const [status, setStatus] = useQueryState('status');
     const [search, setSearch] = useQueryState('search');
     const [dateFrom, setDateFrom] = useQueryState('dateFrom');

     // Los filtros se guardan en URL:
     // /pedidos?status=pending&search=cliente&dateFrom=2025-01-01

     // ...
   }
   ```

**Archivos a crear/modificar:**
- `src/components/shared/DateRangePicker.tsx` (nuevo)
- `src/components/shared/MultiSelect.tsx` (nuevo)
- `src/components/orders/OrderFilters.tsx` (mejorar)
- `src/app/pedidos/page.tsx` (agregar URL state)

---

#### **Día 5: PWA Setup**

**Tareas:**

1. **Instalar next-pwa**
   ```bash
   npm install next-pwa
   ```

2. **Configurar PWA**
   ```typescript
   // Archivo: next.config.mjs
   // MODIFICAR

   import withPWA from 'next-pwa';

   const pwaConfig = withPWA({
     dest: 'public',
     register: true,
     skipWaiting: true,
     disable: process.env.NODE_ENV === 'development',
     runtimeCaching: [
       {
         urlPattern: /^https:\/\/capibobbabot\.onrender\.com\/api\/.*/i,
         handler: 'NetworkFirst',
         options: {
           cacheName: 'api-cache',
           expiration: {
             maxEntries: 100,
             maxAgeSeconds: 60 * 5, // 5 minutes
           },
         },
       },
       {
         urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/i,
         handler: 'CacheFirst',
         options: {
           cacheName: 'images-cache',
           expiration: {
             maxEntries: 50,
             maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
           },
         },
       },
     ],
   });

   export default pwaConfig(nextConfig);
   ```

3. **Crear manifest.json**
   ```json
   // Archivo: public/manifest.json
   // NUEVO

   {
     "name": "CapiBobbaBot Dashboard",
     "short_name": "CapiBobba",
     "description": "Panel de control para CapiBobbaBot",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#000000",
     "theme_color": "#3b82f6",
     "orientation": "portrait-primary",
     "icons": [
       {
         "src": "/icon-192.png",
         "sizes": "192x192",
         "type": "image/png",
         "purpose": "any maskable"
       },
       {
         "src": "/icon-512.png",
         "sizes": "512x512",
         "type": "image/png",
         "purpose": "any maskable"
       }
     ],
     "shortcuts": [
       {
         "name": "Ver Pedidos",
         "url": "/pedidos",
         "icons": [{ "src": "/icon-192.png", "sizes": "192x192" }]
       },
       {
         "name": "Analytics",
         "url": "/analytics",
         "icons": [{ "src": "/icon-192.png", "sizes": "192x192" }]
       }
     ]
   }
   ```

4. **Agregar Install Prompt**
   ```tsx
   // Archivo: src/components/shared/InstallPrompt.tsx
   // NUEVO

   export function InstallPrompt() {
     const [deferredPrompt, setDeferredPrompt] = useState(null);
     const [showPrompt, setShowPrompt] = useState(false);

     useEffect(() => {
       const handler = (e) => {
         e.preventDefault();
         setDeferredPrompt(e);
         setShowPrompt(true);
       };

       window.addEventListener('beforeinstallprompt', handler);
       return () => window.removeEventListener('beforeinstallprompt', handler);
     }, []);

     const handleInstall = async () => {
       if (!deferredPrompt) return;

       deferredPrompt.prompt();
       const { outcome } = await deferredPrompt.userChoice;

       if (outcome === 'accepted') {
         setShowPrompt(false);
       }
     };

     if (!showPrompt) return null;

     return (
       <Alert className="fixed bottom-4 right-4 w-80">
         <Download className="h-4 w-4" />
         <AlertDescription>
           Instala CapiBobbaBot Dashboard para acceso rápido
         </AlertDescription>
         <div className="flex gap-2 mt-2">
           <Button size="sm" onClick={handleInstall}>Instalar</Button>
           <Button size="sm" variant="ghost" onClick={() => setShowPrompt(false)}>
             Cerrar
           </Button>
         </div>
       </Alert>
     );
   }
   ```

**Archivos a crear/modificar:**
- `next.config.mjs` (PWA config)
- `public/manifest.json` (nuevo)
- `public/icon-192.png` (crear)
- `public/icon-512.png` (crear)
- `src/components/shared/InstallPrompt.tsx` (nuevo)
- `src/app/layout.tsx` (agregar InstallPrompt)

**Verificación:**
```bash
# Build y test PWA
npm run build
npm start

# Chrome DevTools > Application > Manifest
# Verificar que PWA es installable
```

**Deliverables Sprint 7:**
- ✅ Configuración completa (5 tabs)
- ✅ Virtual scrolling en tablas
- ✅ Filtros avanzados con date picker
- ✅ PWA installable
- ✅ URL state persistence

---

### **Sprint 8: Analytics & Reporting** (Semana 3) 📊

**Objetivo:** Completar analytics dashboard y agregar reportes
**Duración:** 5 días
**Prioridad:** MEDIA

#### **Día 1-2: Analytics Dashboard Completo**

**Tareas:**

1. **Hourly Activity Heatmap**
   ```tsx
   // Archivo: src/components/analytics/HourlyHeatmap.tsx
   // NUEVO

   import { ResponsiveContainer, Tooltip } from 'recharts';

   export function HourlyHeatmap({ data }) {
     // data: [{ hour: 0-23, day: 'Lun', 'Mar', etc., orders: number }]

     const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
     const hours = Array.from({ length: 24 }, (_, i) => i);

     const maxOrders = Math.max(...data.map(d => d.orders));

     return (
       <Card>
         <CardHeader>
           <CardTitle>Mapa de Calor - Actividad por Hora</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="grid grid-cols-25 gap-1">
             {/* Header con horas */}
             <div /> {/* Esquina vacía */}
             {hours.map(hour => (
               <div key={hour} className="text-xs text-center">
                 {hour}h
               </div>
             ))}

             {/* Rows por día */}
             {days.map(day => (
               <React.Fragment key={day}>
                 <div className="text-xs flex items-center">{day}</div>
                 {hours.map(hour => {
                   const cell = data.find(d => d.day === day && d.hour === hour);
                   const intensity = cell ? (cell.orders / maxOrders) : 0;

                   return (
                     <Tooltip key={`${day}-${hour}`} content={`${cell?.orders || 0} pedidos`}>
                       <div
                         className="aspect-square rounded cursor-pointer"
                         style={{
                           backgroundColor: `rgba(59, 130, 246, ${intensity})`,
                         }}
                       />
                     </Tooltip>
                   );
                 })}
               </React.Fragment>
             ))}
           </div>
         </CardContent>
       </Card>
     );
   }
   ```

2. **Customer Lifetime Value**
   ```tsx
   // Archivo: src/components/analytics/CustomerCLV.tsx
   // NUEVO

   export function CustomerCLV() {
     const { data, isLoading } = useQuery({
       queryKey: ['analytics', 'clv'],
       queryFn: () => apiClient.getCustomerCLV(),
     });

     return (
       <Card>
         <CardHeader>
           <CardTitle>Customer Lifetime Value</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="space-y-4">
             <div className="grid grid-cols-3 gap-4">
               <MetricCard title="CLV Promedio" value={`$${data?.avgCLV}`} />
               <MetricCard title="Clientes VIP" value={data?.vipCount} />
               <MetricCard title="Tasa Retención" value={`${data?.retentionRate}%`} />
             </div>

             <ResponsiveContainer width="100%" height={300}>
               <BarChart data={data?.clvBySegment}>
                 <XAxis dataKey="segment" />
                 <YAxis />
                 <Tooltip formatter={(value) => `$${value}`} />
                 <Bar dataKey="clv" fill="#3b82f6" />
               </BarChart>
             </ResponsiveContainer>
           </div>
         </CardContent>
       </Card>
     );
   }
   ```

3. **Conversion Funnel**
   ```tsx
   // Archivo: src/components/analytics/ConversionFunnel.tsx
   // NUEVO

   export function ConversionFunnel({ data }) {
     const stages = [
       { name: 'Visitas WhatsApp', value: data.visits, color: 'bg-blue-500' },
       { name: 'Inició Pedido', value: data.initiated, color: 'bg-blue-400' },
       { name: 'Agregó Items', value: data.addedItems, color: 'bg-blue-300' },
       { name: 'Completó Pedido', value: data.completed, color: 'bg-green-500' },
     ];

     const maxValue = stages[0].value;

     return (
       <Card>
         <CardHeader>
           <CardTitle>Funnel de Conversión</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="space-y-2">
             {stages.map((stage, index) => {
               const percentage = (stage.value / maxValue) * 100;
               const conversionRate = index > 0
                 ? ((stage.value / stages[index - 1].value) * 100).toFixed(1)
                 : 100;

               return (
                 <div key={stage.name}>
                   <div className="flex justify-between text-sm mb-1">
                     <span>{stage.name}</span>
                     <span className="font-medium">
                       {stage.value} ({conversionRate}%)
                     </span>
                   </div>
                   <div className="w-full bg-gray-200 rounded-full h-12 flex items-center">
                     <div
                       className={`h-full rounded-full ${stage.color} flex items-center justify-center text-white font-medium`}
                       style={{ width: `${percentage}%` }}
                     >
                       {percentage.toFixed(0)}%
                     </div>
                   </div>
                 </div>
               );
             })}
           </div>
         </CardContent>
       </Card>
     );
   }
   ```

4. **Integrar en /analytics**
   ```tsx
   // Archivo: src/app/analytics/page.tsx
   // AGREGAR nuevos componentes

   export default function AnalyticsPage() {
     return (
       <DashboardLayout>
         {/* Existing stats cards */}

         {/* NUEVO: Heatmap */}
         <HourlyHeatmap />

         {/* NUEVO: CLV */}
         <CustomerCLV />

         {/* NUEVO: Funnel */}
         <ConversionFunnel />
       </DashboardLayout>
     );
   }
   ```

**Endpoints requeridos:**
```typescript
GET /api/analytics/hourly-heatmap
GET /api/analytics/customer-clv
GET /api/analytics/conversion-funnel
```

---

#### **Día 3: Export to Excel/PDF**

**Tareas:**

1. **Instalar Dependencias**
   ```bash
   npm install xlsx jspdf jspdf-autotable
   ```

2. **Excel Export Service**
   ```typescript
   // Archivo: src/lib/services/exportService.ts
   // NUEVO

   import * as XLSX from 'xlsx';
   import jsPDF from 'jspdf';
   import autoTable from 'jspdf-autotable';

   export class ExportService {
     static exportToExcel(data: any[], filename: string) {
       const worksheet = XLSX.utils.json_to_sheet(data);
       const workbook = XLSX.utils.book_new();
       XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

       // Auto-size columns
       const maxWidth = data.reduce((acc, row) => {
         Object.keys(row).forEach(key => {
           const length = String(row[key]).length;
           acc[key] = Math.max(acc[key] || 10, length);
         });
         return acc;
       }, {});

       worksheet['!cols'] = Object.values(maxWidth).map(w => ({ wch: w }));

       XLSX.writeFile(workbook, `${filename}.xlsx`);
     }

     static exportToPDF(data: any[], columns: string[], filename: string) {
       const doc = new jsPDF();

       // Add title
       doc.setFontSize(18);
       doc.text(filename, 14, 22);

       // Add date
       doc.setFontSize(10);
       doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, 14, 30);

       // Add table
       autoTable(doc, {
         head: [columns],
         body: data.map(row => columns.map(col => row[col])),
         startY: 35,
         styles: { fontSize: 8 },
         headStyles: { fillColor: [59, 130, 246] },
       });

       doc.save(`${filename}.pdf`);
     }
   }
   ```

3. **Export Buttons en OrdersTable**
   ```tsx
   // Archivo: src/components/orders/OrdersTable.tsx
   // AGREGAR botones de export

   import { ExportService } from '@/lib/services/exportService';

   export function OrdersTable({ data }) {
     const handleExportExcel = () => {
       const exportData = data.map(order => ({
         ID: order.id,
         Cliente: order.customer_name,
         Teléfono: order.from,
         Total: order.order?.total,
         Estado: order.status,
         Pago: order.payment?.method,
         Fecha: new Date(order.created_at).toLocaleString('es-MX'),
       }));

       ExportService.exportToExcel(exportData, `pedidos_${new Date().toISOString().split('T')[0]}`);
     };

     const handleExportPDF = () => {
       const columns = ['ID', 'Cliente', 'Teléfono', 'Total', 'Estado', 'Pago', 'Fecha'];
       const exportData = data.map(order => ({
         ID: order.id.slice(0, 8),
         Cliente: order.customer_name || 'Anónimo',
         Teléfono: order.from,
         Total: `$${order.order?.total}`,
         Estado: order.status,
         Pago: order.payment?.method,
         Fecha: new Date(order.created_at).toLocaleDateString('es-MX'),
       }));

       ExportService.exportToPDF(exportData, columns, `Pedidos_${new Date().toISOString().split('T')[0]}`);
     };

     return (
       <>
         <div className="flex gap-2">
           <Button variant="outline" onClick={handleExportExcel}>
             <FileSpreadsheet className="mr-2 h-4 w-4" />
             Excel
           </Button>
           <Button variant="outline" onClick={handleExportPDF}>
             <FileText className="mr-2 h-4 w-4" />
             PDF
           </Button>
         </div>

         {/* Table */}
       </>
     );
   }
   ```

4. **Automated Reports**
   ```typescript
   // Archivo: src/lib/services/reportService.ts
   // NUEVO

   export class ReportService {
     static async generateDailyReport() {
       const [orders, metrics, security] = await Promise.all([
         apiClient.getOrders({ dateFrom: startOfDay(new Date()) }),
         apiClient.getMetrics(),
         apiClient.getSecurityStats(),
       ]);

       const report = {
         date: new Date().toLocaleDateString('es-MX'),
         summary: {
           totalOrders: orders.total,
           revenue: metrics.revenue.total,
           avgTicket: metrics.revenue.total / orders.total,
           securityEvents: security.events_today,
         },
         topProducts: metrics.topProducts,
         lowRatings: metrics.lowRatings,
       };

       return report;
     }

     static async emailReport(report: any, email: string) {
       // Enviar reporte por email
       await fetch('/api/reports/email', {
         method: 'POST',
         body: JSON.stringify({ report, email }),
       });
     }
   }
   ```

**Archivos a crear:**
- `src/lib/services/exportService.ts`
- `src/lib/services/reportService.ts`

---

#### **Día 4-5: Scheduled Reports & Email Integration**

**Tareas:**

1. **Backend: Setup Email Service**
   ```javascript
   // Archivo: chatbot.js (backend)
   // AGREGAR endpoint

   const nodemailer = require('nodemailer');

   const transporter = nodemailer.createTransport({
     service: 'gmail',
     auth: {
       user: process.env.EMAIL_USER,
       pass: process.env.EMAIL_PASSWORD,
     },
   });

   app.post('/api/reports/email', async (req, res) => {
     const { report, email } = req.body;

     const html = `
       <h1>Reporte Diario - ${report.date}</h1>
       <h2>Resumen</h2>
       <ul>
         <li>Pedidos: ${report.summary.totalOrders}</li>
         <li>Revenue: $${report.summary.revenue}</li>
         <li>Ticket Promedio: $${report.summary.avgTicket}</li>
       </ul>
       <!-- ... más contenido -->
     `;

     await transporter.sendMail({
       from: process.env.EMAIL_USER,
       to: email,
       subject: `Reporte Diario - CapiBobbaBot ${report.date}`,
       html,
     });

     res.json({ success: true });
   });
   ```

2. **Scheduled Reports UI**
   ```tsx
   // Archivo: src/components/configuracion/ReportsSettings.tsx
   // NUEVO (agregar como tab en Configuración)

   export function ReportsSettings() {
     const [schedule, setSchedule] = useState({
       daily: true,
       weekly: true,
       monthly: false,
       email: 'admin@capibobba.com',
     });

     return (
       <Card>
         <CardHeader>
           <CardTitle>Reportes Automáticos</CardTitle>
         </CardHeader>
         <CardContent className="space-y-4">
           <div>
             <Label>Email para Reportes</Label>
             <Input
               type="email"
               value={schedule.email}
               onChange={(e) => setSchedule({ ...schedule, email: e.target.value })}
             />
           </div>

           <Separator />

           <div className="space-y-3">
             <div className="flex items-center justify-between">
               <div>
                 <Label>Reporte Diario</Label>
                 <p className="text-sm text-muted-foreground">
                   Enviado todos los días a las 8:00 AM
                 </p>
               </div>
               <Switch
                 checked={schedule.daily}
                 onCheckedChange={(checked) => setSchedule({ ...schedule, daily: checked })}
               />
             </div>

             <div className="flex items-center justify-between">
               <div>
                 <Label>Reporte Semanal</Label>
                 <p className="text-sm text-muted-foreground">
                   Enviado los lunes a las 8:00 AM
                 </p>
               </div>
               <Switch
                 checked={schedule.weekly}
                 onCheckedChange={(checked) => setSchedule({ ...schedule, weekly: checked })}
               />
             </div>

             <div className="flex items-center justify-between">
               <div>
                 <Label>Reporte Mensual</Label>
                 <p className="text-sm text-muted-foreground">
                   Enviado el primer día del mes
                 </p>
               </div>
               <Switch
                 checked={schedule.monthly}
                 onCheckedChange={(checked) => setSchedule({ ...schedule, monthly: checked })}
               />
             </div>
           </div>

           <Button onClick={handleSaveSchedule}>Guardar Configuración</Button>
         </CardContent>
       </Card>
     );
   }
   ```

3. **Cron Job para Reports (Backend)**
   ```javascript
   // Archivo: chatbot.js (backend)
   // AGREGAR cron jobs

   const cron = require('node-cron');

   // Daily report - 8 AM
   cron.schedule('0 8 * * *', async () => {
     console.log('Generating daily report...');

     const config = await redis.get('reports:config');
     if (!config || !config.daily) return;

     const report = await generateDailyReport();
     await sendEmailReport(report, config.email);
   });

   // Weekly report - Monday 8 AM
   cron.schedule('0 8 * * 1', async () => {
     console.log('Generating weekly report...');
     // ...
   });
   ```

**Archivos a crear/modificar:**
- `chatbot.js` - Email endpoint y cron jobs
- `src/components/configuracion/ReportsSettings.tsx` (nuevo)
- `src/app/configuracion/page.tsx` (agregar tab de Reportes)

**Deliverables Sprint 8:**
- ✅ Analytics dashboard completo
- ✅ Hourly heatmap
- ✅ Customer CLV analysis
- ✅ Conversion funnel
- ✅ Export to Excel/PDF
- ✅ Scheduled email reports

---

### **Sprint 9: Testing & Quality Assurance** (Semana 4) 🧪

**Objetivo:** Agregar testing, mejorar código y asegurar calidad
**Duración:** 5 días
**Prioridad:** ALTA

#### **Día 1-2: Unit Testing Setup**

**Tareas:**

1. **Install Testing Libraries**
   ```bash
   npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
   ```

2. **Vitest Configuration**
   ```typescript
   // Archivo: vitest.config.ts
   // NUEVO

   import { defineConfig } from 'vitest/config';
   import react from '@vitejs/plugin-react';
   import path from 'path';

   export default defineConfig({
     plugins: [react()],
     test: {
       environment: 'jsdom',
       globals: true,
       setupFiles: ['./src/test/setup.ts'],
       coverage: {
         provider: 'v8',
         reporter: ['text', 'json', 'html'],
         exclude: ['node_modules/', 'src/test/'],
       },
     },
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './src'),
       },
     },
   });
   ```

3. **Setup File**
   ```typescript
   // Archivo: src/test/setup.ts
   // NUEVO

   import '@testing-library/jest-dom';
   import { expect, afterEach } from 'vitest';
   import { cleanup } from '@testing-library/react';
   import * as matchers from '@testing-library/jest-dom/matchers';

   expect.extend(matchers);

   afterEach(() => {
     cleanup();
   });
   ```

4. **Test Utilities**
   ```typescript
   // Archivo: src/test/utils.tsx
   // NUEVO

   import { render } from '@testing-library/react';
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
   import { ThemeProvider } from '@/lib/providers/ThemeProvider';

   const createTestQueryClient = () => new QueryClient({
     defaultOptions: {
       queries: { retry: false },
       mutations: { retry: false },
     },
   });

   export function renderWithProviders(ui: React.ReactElement) {
     const testQueryClient = createTestQueryClient();

     return render(
       <ThemeProvider>
         <QueryClientProvider client={testQueryClient}>
           {ui}
         </QueryClientProvider>
       </ThemeProvider>
     );
   }

   export * from '@testing-library/react';
   ```

5. **Example Tests**
   ```typescript
   // Archivo: src/components/dashboard/MetricCard.test.tsx
   // NUEVO

   import { describe, it, expect } from 'vitest';
   import { renderWithProviders, screen } from '@/test/utils';
   import { MetricCard } from './MetricCard';

   describe('MetricCard', () => {
     it('renders title and value', () => {
       renderWithProviders(
         <MetricCard
           title="Test Metric"
           value={100}
           change={5}
           trend="up"
           icon="dollar-sign"
         />
       );

       expect(screen.getByText('Test Metric')).toBeInTheDocument();
       expect(screen.getByText('100')).toBeInTheDocument();
     });

     it('shows positive trend correctly', () => {
       renderWithProviders(
         <MetricCard
           title="Revenue"
           value={1000}
           change={12.5}
           trend="up"
           icon="trending-up"
         />
       );

       expect(screen.getByText(/12.5%/)).toBeInTheDocument();
       expect(screen.getByText(/12.5%/).className).toContain('text-green');
     });

     it('renders loading state', () => {
       renderWithProviders(
         <MetricCard
           title="Loading..."
           value={0}
           change={0}
           trend="neutral"
           icon="loader"
           isLoading
         />
       );

       expect(screen.getByTestId('skeleton')).toBeInTheDocument();
     });
   });
   ```

   ```typescript
   // Archivo: src/lib/hooks/useOrders.test.ts
   // NUEVO

   import { describe, it, expect, vi } from 'vitest';
   import { renderHook, waitFor } from '@testing-library/react';
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
   import { useOrders } from './useOrders';
   import * as apiClient from '@/lib/api/client';

   vi.mock('@/lib/api/client');

   const wrapper = ({ children }) => {
     const testQueryClient = new QueryClient({
       defaultOptions: { queries: { retry: false } },
     });
     return (
       <QueryClientProvider client={testQueryClient}>
         {children}
       </QueryClientProvider>
     );
   };

   describe('useOrders', () => {
     it('fetches orders successfully', async () => {
       const mockOrders = [
         { id: '1', from: '123', status: 'pending' },
         { id: '2', from: '456', status: 'confirmed' },
       ];

       vi.spyOn(apiClient, 'getOrders').mockResolvedValue({
         orders: mockOrders,
         total: 2,
         hasMore: false,
       });

       const { result } = renderHook(() => useOrders({}), { wrapper });

       await waitFor(() => expect(result.current.isSuccess).toBe(true));

       expect(result.current.data?.orders).toEqual(mockOrders);
       expect(result.current.data?.total).toBe(2);
     });

     it('handles error state', async () => {
       vi.spyOn(apiClient, 'getOrders').mockRejectedValue(new Error('API Error'));

       const { result } = renderHook(() => useOrders({}), { wrapper });

       await waitFor(() => expect(result.current.isError).toBe(true));
       expect(result.current.error).toBeDefined();
     });
   });
   ```

6. **Add Test Scripts**
   ```json
   // Archivo: package.json
   // AGREGAR scripts

   {
     "scripts": {
       "test": "vitest",
       "test:ui": "vitest --ui",
       "test:coverage": "vitest --coverage",
       "test:watch": "vitest --watch"
     }
   }
   ```

**Archivos a crear:**
- `vitest.config.ts`
- `src/test/setup.ts`
- `src/test/utils.tsx`
- `src/components/dashboard/MetricCard.test.tsx`
- `src/lib/hooks/useOrders.test.ts`
- Tests para otros componentes críticos

**Coverage Target:** 70%+ para hooks y componentes críticos

---

#### **Día 3: E2E Testing (Opcional)**

**Tareas:**

1. **Install Playwright**
   ```bash
   npm install --save-dev @playwright/test
   npx playwright install
   ```

2. **Playwright Configuration**
   ```typescript
   // Archivo: playwright.config.ts
   // NUEVO

   import { defineConfig } from '@playwright/test';

   export default defineConfig({
     testDir: './e2e',
     fullyParallel: true,
     forbidOnly: !!process.env.CI,
     retries: process.env.CI ? 2 : 0,
     workers: process.env.CI ? 1 : undefined,
     reporter: 'html',
     use: {
       baseURL: 'http://localhost:3001',
       trace: 'on-first-retry',
       screenshot: 'only-on-failure',
     },

     projects: [
       {
         name: 'chromium',
         use: { browserName: 'chromium' },
       },
     ],

     webServer: {
       command: 'npm run dev',
       url: 'http://localhost:3001',
       reuseExistingServer: !process.env.CI,
     },
   });
   ```

3. **Example E2E Test**
   ```typescript
   // Archivo: e2e/dashboard.spec.ts
   // NUEVO

   import { test, expect } from '@playwright/test';

   test.describe('Dashboard', () => {
     test('should display metric cards', async ({ page }) => {
       await page.goto('/');

       await expect(page.getByText('Pedidos Hoy')).toBeVisible();
       await expect(page.getByText('Revenue 24h')).toBeVisible();
       await expect(page.getByText('Gemini Calls')).toBeVisible();
       await expect(page.getByText('Cache Hit Rate')).toBeVisible();
     });

     test('should navigate to orders page', async ({ page }) => {
       await page.goto('/');

       await page.click('text=Pedidos');
       await expect(page).toHaveURL('/pedidos');
       await expect(page.getByText('Todos los Pedidos')).toBeVisible();
     });

     test('should filter orders', async ({ page }) => {
       await page.goto('/pedidos');

       // Select status filter
       await page.click('text=Todos los estados');
       await page.click('text=Pendiente');

       // Should update URL
       await expect(page).toHaveURL(/status=pending/);
     });
   });
   ```

**Scripts:**
```json
{
  "scripts": {
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui",
    "e2e:report": "playwright show-report"
  }
}
```

---

#### **Día 4: Code Quality & Linting**

**Tareas:**

1. **ESLint Configuration**
   ```json
   // Archivo: .eslintrc.json
   // ACTUALIZAR

   {
     "extends": [
       "next/core-web-vitals",
       "plugin:@typescript-eslint/recommended"
     ],
     "rules": {
       "@typescript-eslint/no-unused-vars": "error",
       "@typescript-eslint/no-explicit-any": "warn",
       "react-hooks/rules-of-hooks": "error",
       "react-hooks/exhaustive-deps": "warn",
       "no-console": ["warn", { "allow": ["warn", "error"] }]
     }
   }
   ```

2. **Prettier Setup**
   ```json
   // Archivo: .prettierrc
   // NUEVO

   {
     "semi": true,
     "trailingComma": "es5",
     "singleQuote": true,
     "printWidth": 100,
     "tabWidth": 2,
     "useTabs": false
   }
   ```

3. **Husky Pre-commit Hooks**
   ```bash
   npm install --save-dev husky lint-staged
   npx husky init
   ```

   ```bash
   # Archivo: .husky/pre-commit
   # NUEVO

   #!/usr/bin/env sh
   . "$(dirname -- "$0")/_/husky.sh"

   npx lint-staged
   ```

   ```json
   // Archivo: package.json
   // AGREGAR

   {
     "lint-staged": {
       "*.{ts,tsx}": [
         "eslint --fix",
         "prettier --write",
         "vitest related --run"
       ],
       "*.{json,md}": ["prettier --write"]
     }
   }
   ```

4. **TypeScript Strict Mode**
   ```json
   // Archivo: tsconfig.json
   // ACTUALIZAR para ser más estricto

   {
     "compilerOptions": {
       "strict": true,
       "noUncheckedIndexedAccess": true,
       "noImplicitReturns": true,
       "noFallthroughCasesInSwitch": true,
       "noUnusedLocals": true,
       "noUnusedParameters": true
     }
   }
   ```

**Verificación:**
```bash
# Lint everything
npm run lint

# Format code
npx prettier --write .

# Fix TypeScript errors
npx tsc --noEmit
```

---

#### **Día 5: Documentation & Code Comments**

**Tareas:**

1. **Component Documentation**
   ```tsx
   // Archivo: src/components/dashboard/MetricCard.tsx
   // AGREGAR JSDoc comments

   /**
    * MetricCard - Displays a metric with title, value, trend indicator
    *
    * @component
    * @example
    * ```tsx
    * <MetricCard
    *   title="Pedidos Hoy"
    *   value={42}
    *   change={12.5}
    *   trend="up"
    *   icon="shopping-cart"
    * />
    * ```
    */
   export interface MetricCardProps {
     /** The metric title */
     title: string;
     /** The current metric value */
     value: number | string;
     /** Percentage change from previous period */
     change: number;
     /** Trend direction */
     trend: 'up' | 'down' | 'neutral';
     /** Lucide icon name */
     icon: string;
     /** Loading state */
     isLoading?: boolean;
   }

   export function MetricCard({ title, value, change, trend, icon, isLoading }: MetricCardProps) {
     // ...
   }
   ```

2. **API Documentation**
   ```typescript
   // Archivo: src/lib/api/client.ts
   // AGREGAR JSDoc

   export class ApiClient {
     /**
      * Fetches dashboard metrics
      * @returns Promise with metrics data
      * @throws {Error} If API request fails
      */
     async getMetrics(): Promise<DashboardMetrics> {
       const response = await this.get<DashboardMetrics>('/metrics/dashboard');
       return response;
     }

     /**
      * Fetches orders with optional filters
      * @param filters - Filter options for orders
      * @param filters.page - Page number (default: 1)
      * @param filters.limit - Items per page (default: 20)
      * @param filters.status - Filter by order status
      * @returns Promise with paginated orders
      */
     async getOrders(filters: OrderFilters): Promise<OrdersResponse> {
       // ...
     }
   }
   ```

3. **Update README**
   ```markdown
   # Archivo: dashboard-next/README.md
   # ACTUALIZAR con guía completa

   # CapiBobbaBot Dashboard

   ## 📚 Tech Stack
   - Next.js 14 (App Router)
   - TypeScript
   - Tailwind CSS + shadcn/ui
   - TanStack Query + TanStack Table
   - Recharts
   - Zustand

   ## 🚀 Quick Start
   \`\`\`bash
   # Install dependencies
   npm install

   # Run dev server
   npm run dev

   # Run tests
   npm test

   # Build for production
   npm run build
   \`\`\`

   ## 📂 Project Structure
   \`\`\`
   src/
   ├── app/              # Next.js App Router pages
   ├── components/       # React components
   │   ├── ui/          # shadcn/ui primitives
   │   ├── dashboard/   # Dashboard-specific components
   │   ├── orders/      # Orders management
   │   └── analytics/   # Analytics charts
   ├── lib/
   │   ├── api/         # API client
   │   ├── hooks/       # Custom React hooks
   │   ├── providers/   # Context providers
   │   └── utils/       # Utility functions
   └── types/           # TypeScript definitions
   \`\`\`

   ## 🧪 Testing
   - Unit tests: `npm test`
   - E2E tests: `npm run e2e`
   - Coverage: `npm run test:coverage`

   ## 📊 Performance
   - LCP: < 900ms
   - CLS: < 0.05
   - Bundle: < 400KB (gzipped)

   ## 🔧 Environment Variables
   \`\`\`env
   NEXT_PUBLIC_API_URL=https://capibobbabot.onrender.com/api
   NEXT_PUBLIC_WS_URL=https://capibobbabot.onrender.com
   NEXT_PUBLIC_ENABLE_REALTIME=true
   \`\`\`
   ```

**Deliverables Sprint 9:**
- ✅ Unit tests (70%+ coverage)
- ✅ E2E tests (critical flows)
- ✅ ESLint + Prettier configured
- ✅ Pre-commit hooks
- ✅ TypeScript strict mode
- ✅ Comprehensive documentation

---

### **Sprint 10: Advanced Optimizations** (Semana 5) ⚡

**Objetivo:** Optimizaciones finales y features avanzadas
**Duración:** 5 días
**Prioridad:** MEDIA

#### **Día 1: Server Components Optimization**

**Tareas:**

1. **Convert to Server Components**
   ```tsx
   // Archivo: src/app/page.tsx
   // CONVERTIR a Server Component

   import { Suspense } from 'react';
   import { MetricCardSkeleton } from '@/components/dashboard/MetricCardSkeleton';

   // Server Component (async)
   export default async function DashboardPage() {
     // Server-side data fetching (no waterfall!)
     const metricsPromise = fetch(`${process.env.API_URL}/metrics/dashboard`, {
       next: { revalidate: 60 }, // ISR: Revalidate every 60s
     }).then(res => res.json());

     const ordersPromise = fetch(`${process.env.API_URL}/orders?limit=10`, {
       next: { revalidate: 30 },
     }).then(res => res.json());

     // Parallel fetching
     const [metrics, orders] = await Promise.all([metricsPromise, ordersPromise]);

     return (
       <DashboardLayout>
         <div className="grid gap-4 md:grid-cols-4">
           <MetricCard data={metrics.orders} />
           <MetricCard data={metrics.revenue} />
           <MetricCard data={metrics.gemini} />
           <MetricCard data={metrics.cache} />
         </div>

         <Suspense fallback={<ChartSkeleton />}>
           <SalesChart data={metrics.salesTimeline} />
         </Suspense>

         <Suspense fallback={<TableSkeleton />}>
           <RecentOrdersTable data={orders} />
         </Suspense>
       </DashboardLayout>
     );
   }
   ```

2. **Streaming SSR**
   ```tsx
   // Archivo: src/app/analytics/page.tsx
   // Usar Suspense boundaries para streaming

   export default function AnalyticsPage() {
     return (
       <DashboardLayout>
         {/* Stats cards load immediately */}
         <Suspense fallback={<StatsSkeletons />}>
           <StatsCards />
         </Suspense>

         {/* Charts stream in after */}
         <Suspense fallback={<ChartsSkeletons />}>
           <AnalyticsCharts />
         </Suspense>
       </DashboardLayout>
     );
   }
   ```

---

#### **Día 2: Image Optimization**

**Tareas:**

1. **Create Optimized Icons**
   ```bash
   # Generate multiple sizes
   npm install sharp
   ```

   ```javascript
   // Archivo: scripts/generate-icons.js
   // NUEVO

   const sharp = require('sharp');
   const fs = require('fs');

   const sizes = [192, 512];
   const input = 'public/icon.svg';

   sizes.forEach(size => {
     sharp(input)
       .resize(size, size)
       .png()
       .toFile(`public/icon-${size}.png`);
   });
   ```

2. **Lazy Load Images**
   ```tsx
   // All images below fold should be lazy
   <Image
     src="/chart-placeholder.png"
     alt="Chart"
     loading="lazy"
     quality={75}
   />
   ```

---

#### **Día 3: Advanced Caching Strategies**

**Tareas:**

1. **React Query Persistent Cache**
   ```typescript
   // Archivo: src/lib/providers/QueryProvider.tsx
   // AGREGAR persistence

   import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
   import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

   const persister = createSyncStoragePersister({
     storage: typeof window !== 'undefined' ? window.localStorage : null,
   });

   export function QueryProvider({ children }) {
     return (
       <PersistQueryClientProvider
         client={queryClient}
         persistOptions={{ persister }}
       >
         {children}
       </PersistQueryClientProvider>
     );
   }
   ```

2. **Service Worker Advanced Caching**
   ```typescript
   // Archivo: public/sw.js
   // MEJORAR estrategias de cache

   self.addEventListener('fetch', (event) => {
     const { request } = event;

     // API: Network-first with timeout
     if (request.url.includes('/api/')) {
       event.respondWith(
         Promise.race([
           fetch(request),
           new Promise((_, reject) =>
             setTimeout(() => reject(new Error('timeout')), 3000)
           )
         ]).catch(() => caches.match(request))
       );
     }

     // Static assets: Cache-first
     if (request.destination === 'image' || request.destination === 'script') {
       event.respondWith(
         caches.match(request).then(cached =>
           cached || fetch(request).then(response => {
             const cache = await caches.open('static-v1');
             cache.put(request, response.clone());
             return response;
           })
         )
       );
     }
   });
   ```

---

#### **Día 4: Accessibility Enhancements**

**Tareas:**

1. **Keyboard Navigation**
   ```tsx
   // Archivo: src/components/layout/Sidebar.tsx
   // MEJORAR keyboard nav

   export function Sidebar() {
     const handleKeyDown = (e: KeyboardEvent, href: string) => {
       if (e.key === 'Enter' || e.key === ' ') {
         e.preventDefault();
         router.push(href);
       }
     };

     return (
       <nav role="navigation" aria-label="Main navigation">
         <ul>
           {routes.map(route => (
             <li key={route.href}>
               <Link
                 href={route.href}
                 role="menuitem"
                 tabIndex={0}
                 onKeyDown={(e) => handleKeyDown(e, route.href)}
                 aria-current={isActive ? 'page' : undefined}
               >
                 {route.name}
               </Link>
             </li>
           ))}
         </ul>
       </nav>
     );
   }
   ```

2. **ARIA Labels**
   ```tsx
   // Agregar en todos los componentes interactivos

   <button
     aria-label="Cerrar modal"
     aria-describedby="modal-description"
   >
     <X />
   </button>

   <input
     aria-label="Buscar pedidos"
     aria-invalid={hasError}
     aria-errormessage="search-error"
   />
   ```

3. **Skip to Main Content**
   ```tsx
   // Archivo: src/app/layout.tsx
   // AGREGAR

   <body>
     <a
       href="#main-content"
       className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white"
     >
       Saltar al contenido principal
     </a>

     <Sidebar />

     <main id="main-content" role="main">
       {children}
     </main>
   </body>
   ```

---

#### **Día 5: Monitoring & Analytics**

**Tareas:**

1. **Setup Sentry (Error Tracking)**
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```

   ```typescript
   // Archivo: sentry.client.config.ts
   // AUTO-GENERATED, configurar

   Sentry.init({
     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
     tracesSampleRate: 0.1,
     environment: process.env.NODE_ENV,
     beforeSend(event) {
       // Filter sensitive data
       if (event.request?.headers) {
         delete event.request.headers['Authorization'];
       }
       return event;
     },
   });
   ```

2. **Web Vitals Tracking**
   ```tsx
   // Archivo: src/app/layout.tsx
   // AGREGAR

   export function reportWebVitals(metric) {
     // Send to analytics
     if (window.gtag) {
       window.gtag('event', metric.name, {
         value: Math.round(metric.value),
         event_label: metric.id,
         non_interaction: true,
       });
     }

     // Send to custom endpoint
     fetch('/api/analytics/vitals', {
       method: 'POST',
       body: JSON.stringify(metric),
     });
   }
   ```

3. **Custom Event Tracking**
   ```typescript
   // Archivo: src/lib/analytics.ts
   // NUEVO

   export const analytics = {
     track(event: string, properties?: Record<string, any>) {
       if (typeof window === 'undefined') return;

       // Custom analytics
       fetch('/api/analytics/events', {
         method: 'POST',
         body: JSON.stringify({ event, properties, timestamp: Date.now() }),
       });

       // Google Analytics
       if (window.gtag) {
         window.gtag('event', event, properties);
       }
     },

     page(path: string) {
       this.track('page_view', { path });
     },
   };

   // Usage in components
   analytics.track('order_exported', { format: 'excel', count: 10 });
   ```

**Deliverables Sprint 10:**
- ✅ Server Components optimization
- ✅ Image optimization
- ✅ Advanced caching
- ✅ Full accessibility (WCAG AA)
- ✅ Error tracking (Sentry)
- ✅ Web vitals monitoring

---

## 📊 **Tracking & Métricas**

### **KPIs por Sprint**

| Sprint | Métrica Principal | Target | Verificación |
|--------|------------------|--------|--------------|
| Sprint 6 | LCP, CLS, Bundle | < 900ms, < 0.05, < 400KB | Lighthouse CI |
| Sprint 7 | Features completadas | 5/5 tabs config | Manual testing |
| Sprint 8 | Analytics features | 3 charts nuevos | Visual inspection |
| Sprint 9 | Test coverage | > 70% | `npm run test:coverage` |
| Sprint 10 | Accessibility | WCAG AA compliant | axe DevTools |

### **Performance Budget**

```json
{
  "budget": {
    "LCP": { "max": 900, "unit": "ms" },
    "CLS": { "max": 0.05, "unit": "score" },
    "FCP": { "max": 700, "unit": "ms" },
    "TTI": { "max": 1500, "unit": "ms" },
    "Bundle": { "max": 400, "unit": "KB" },
    "Lighthouse": { "min": 90, "unit": "score" }
  }
}
```

---

## 🔄 **Proceso de Implementación**

### **Workflow por Sprint**

1. **Inicio de Sprint (Lunes)**
   - Revisar roadmap y tareas del sprint
   - Crear branch: `sprint-N-nombre`
   - Setup environment si es necesario

2. **Durante el Sprint (Lunes-Viernes)**
   - Implementar features según roadmap
   - Commit frecuentes con mensajes descriptivos
   - Testing continuo
   - Update docs en `/docs/sprints/SPRINT_N_SUMMARY.md`

3. **Fin de Sprint (Viernes)**
   - Code review completo
   - Run full test suite
   - Performance testing
   - Merge to main
   - Deploy to production
   - Documentar en `SPRINT_N_SUMMARY.md`

### **Git Workflow**

```bash
# Inicio de sprint
git checkout main
git pull origin main
git checkout -b sprint-6-performance-optimization

# Durante desarrollo
git add .
git commit -m "perf: optimize CLS with fixed heights

- Add fixed heights to all chart containers
- Implement precise skeleton loaders
- Reserve space for async images

Files: SalesChart.tsx, MetricCard.tsx"

# Fin de sprint
git push origin sprint-6-performance-optimization
# Create PR en GitHub
# After approval:
git checkout main
git merge sprint-6-performance-optimization
git push origin main
```

### **Commit Message Format**

```
tipo(scope): descripción breve

Descripción detallada del cambio

Cambios:
- Punto 1
- Punto 2

Archivos: file1.tsx, file2.ts
```

**Tipos:**
- `feat`: Nueva feature
- `fix`: Bug fix
- `perf`: Performance improvement
- `refactor`: Code refactoring
- `test`: Add/update tests
- `docs`: Documentation
- `style`: Code formatting
- `chore`: Build/config changes

---

## 📅 **Timeline Estimado**

```
Sprint 6:  Semana 1  (Oct 10-14) - Performance Optimization
Sprint 7:  Semana 2  (Oct 17-21) - Advanced Features
Sprint 8:  Semana 3  (Oct 24-28) - Analytics & Reporting
Sprint 9:  Semana 4  (Oct 31-Nov 4) - Testing & QA
Sprint 10: Semana 5  (Nov 7-11) - Advanced Optimizations

Total: 5 semanas
```

---

## 🎯 **Criterios de Éxito**

### **Technical Excellence**
- ✅ 0 TypeScript errors
- ✅ 0 ESLint critical warnings
- ✅ Test coverage > 70%
- ✅ Lighthouse score > 90
- ✅ WCAG AA compliant

### **Performance**
- ✅ LCP < 900ms
- ✅ CLS < 0.05
- ✅ FCP < 700ms
- ✅ Bundle < 400KB

### **Features**
- ✅ Configuración completa
- ✅ Analytics dashboard completo
- ✅ Export funcionalidad
- ✅ PWA installable
- ✅ Scheduled reports

### **Documentation**
- ✅ README actualizado
- ✅ Component docs (JSDoc)
- ✅ API documentation
- ✅ Sprint summaries

---

## 📝 **Notas Finales**

### **Priorización**

Si hay limitaciones de tiempo, priorizar en este orden:

1. **Sprint 6** (Performance) - CRÍTICO
2. **Sprint 7** (Features) - ALTA
3. **Sprint 9** (Testing) - ALTA
4. **Sprint 8** (Analytics) - MEDIA
5. **Sprint 10** (Advanced) - BAJA

### **Mantenimiento Post-Roadmap**

Una vez completados los sprints:

- **Semanal**: Review performance metrics
- **Mensual**: Update dependencies
- **Trimestral**: Accessibility audit
- **Continuo**: Monitor Sentry errors

### **Escalabilidad Futura**

Features a considerar después del roadmap:

- Multi-tenant support
- Advanced RBAC
- AI-powered insights (Gemini integration)
- Mobile app (React Native)
- Real-time collaboration
- Advanced analytics (ML forecasting)

---

**Última Actualización:** 2025-10-09
**Próxima Revisión:** Al completar cada sprint
**Responsable:** Dashboard Expert Agent

---

**🚀 ¡Listo para comenzar Sprint 6!**
