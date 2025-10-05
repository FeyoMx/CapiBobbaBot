# CapiBobbaBot Dashboard - Next.js 14

Dashboard modernizado para CapiBobbaBot con Next.js 14, TypeScript, y Tailwind CSS.

## 🚀 Sprint 1 - Foundation (COMPLETADO)

### ✅ Implementado

- ✅ Next.js 14 + TypeScript + Tailwind CSS
- ✅ Configuración completa (tsconfig, tailwind.config, next.config)
- ✅ Componentes UI base (Button, Card) con shadcn/ui
- ✅ Layout root con header
- ✅ Página de overview básica
- ✅ Dependencias instaladas:
  - @tanstack/react-query
  - @tanstack/react-table
  - recharts
  - date-fns
  - zustand
  - lucide-react
  - axios

## 🏃 Cómo Ejecutar

### Desarrollo

```bash
cd dashboard-next
npm run dev
```

El dashboard estará disponible en: http://localhost:3001

### Build de Producción

```bash
npm run build
npm start
```

## 📁 Estructura

```
dashboard-next/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Overview page
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   └── ui/                 # shadcn/ui components
│   │       ├── button.tsx
│   │       └── card.tsx
│   ├── lib/
│   │   ├── api/                # API client (próximo sprint)
│   │   ├── hooks/              # Custom hooks (próximo sprint)
│   │   └── utils.ts            # Utility functions
│   └── types/                  # TypeScript types (próximo sprint)
├── public/                     # Static files
├── .env.local                  # Environment variables
├── next.config.mjs            # Next.js configuration
├── tailwind.config.ts         # Tailwind configuration
└── tsconfig.json              # TypeScript configuration
```

## 🎯 Siguiente Sprint: Overview Dashboard

### Tareas Pendientes (Sprint 2)

1. **Sidebar Navigation**
   - [ ] Componente Sidebar con rutas
   - [ ] Responsive (colapsable en mobile)
   - [ ] Active state indicators

2. **Metric Cards Dinámicos**
   - [ ] Integrar con API real
   - [ ] Mostrar cambios y tendencias
   - [ ] Loading states

3. **Gráficos con Recharts**
   - [ ] Sales over time chart
   - [ ] Revenue by product
   - [ ] Gemini usage chart

4. **API Integration**
   - [ ] TanStack Query setup
   - [ ] API client con tipos
   - [ ] Error handling

5. **Recent Orders Table**
   - [ ] Tabla básica con datos recientes
   - [ ] Link a página de pedidos completa

## 🔧 Variables de Entorno

Archivo: `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_WS_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_REALTIME=true
```

## 📚 Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Data Fetching**: TanStack Query
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: Zustand
- **Tables**: TanStack Table

## 🎨 Design System

- **Colors**: Configurados en globals.css con soporte para dark mode
- **Components**: shadcn/ui para consistencia
- **Typography**: Inter font
- **Spacing**: Tailwind default

## 📊 Métricas de Performance

Objetivos:
- Bundle size: < 200KB
- TTI (Time to Interactive): < 1.5s
- Lighthouse score: > 90
- Mobile-first responsive

## 🔗 Links Útiles

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query)
- [Recharts](https://recharts.org/)

---

**Status**: Sprint 1 Completado ✅
**Última actualización**: 2025-10-05
**Versión**: 0.1.0
