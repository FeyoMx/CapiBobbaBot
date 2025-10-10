# 🤖 CapiBobbaBot Dashboard - Next.js 14

Dashboard moderno y profesional para administrar el chatbot de WhatsApp CapiBobbaBot, construido con las últimas tecnologías web.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**Versión Actual:** v0.6.0
**Estado:** ✅ Production Ready
**Última actualización:** 2025-10-09
**Sprint Actual:** Sprint 6 - Performance Optimization ✅

---

## 📸 Preview

<div align="center">
  <img src="screenshots/dashboard-overview.png" alt="Dashboard Overview" width="800"/>
  <p><i>Dashboard principal con métricas en tiempo real</i></p>
</div>

---

## 🎯 Features Principales

### ✅ Dashboard Overview
- 📊 **KPIs en tiempo real**: Pedidos, Revenue, Gemini AI, Cache hits
- 📈 **Gráficos interactivos**: Ventas, productos, uso de IA
- 🔄 **Actualizaciones automáticas**: Polling inteligente cada 60s
- 💾 **Datos históricos**: Tendencias y comparativas

### ✅ Gestión de Pedidos
- 📋 **Tabla completa**: Filtros, búsqueda, paginación
- 🔍 **Vista detallada**: Modal con info completa del pedido
- 🔄 **Estados en tiempo real**: WebSocket updates
- 📥 **Export CSV**: Descarga datos fácilmente

### ✅ Analytics Avanzado
- 📊 **Gráficos personalizables**: Ventas, productos, IA
- 🎯 **Métricas clave**: Ticket promedio, conversión, satisfacción
- 📅 **Rangos de fecha**: Daily, weekly, monthly
- 📈 **Tendencias**: Análisis histórico

### ✅ Seguridad & Monitoreo
- 🛡️ **Eventos de seguridad**: Rate limiting, bloqueos, alertas
- 📊 **Estadísticas**: Intentos de spam, IPs bloqueadas
- 🔍 **Patrones detectados**: Análisis inteligente
- ⚡ **Acciones recomendadas**: Sugerencias automáticas

### ✅ Configuración Completa
- ⚙️ **3 Categorías**: Negocio, Gemini AI, Seguridad
- 💾 **Persistencia**: Guarda cambios en backend
- 🎨 **UI intuitiva**: Tabs, forms validados, feedback visual
- 🔧 **Control total**: Todos los parámetros configurables

### ✅ UX de Primera Clase
- 🌙 **Dark Mode**: Light, Dark, System (auto-detect)
- 📱 **Responsive**: Mobile-first design
- ⚡ **Performance**: Code splitting, lazy loading
- ♿ **Accesibilidad**: WCAG AA compliant

---

## 🚀 Inicio Rápido

### Pre-requisitos

- Node.js 18.17 o superior
- npm 9+ o yarn 1.22+
- Backend de CapiBobbaBot corriendo

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/CapiBobbaBot.git
cd CapiBobbaBot/dashboard-next

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores

# 4. Iniciar en desarrollo
npm run dev

# Dashboard disponible en: http://localhost:3001
```

### Variables de Entorno

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
```

Para producción, ver [Guía de Deployment](docs/deployment/DEPLOY.md).

---

## 📚 Documentación

### 📖 Documentos Principales

- **[Índice de Documentación](docs/DOCUMENTATION_INDEX.md)** - 🗂️ Vista completa de toda la documentación
- **[Análisis UI/UX](docs/technical/ANALISIS_DASHBOARD_UIUX.md)** - Análisis técnico y recomendaciones
- **[Sprint 5 Summary](docs/technical/SPRINT5_SUMMARY.md)** - Último sprint completado
- **[Guía de Deployment](docs/deployment/DEPLOY.md)** - Cómo desplegar a producción

### 📁 Estructura del Proyecto

```
dashboard-next/
├── docs/                       # 📚 Documentación organizada
│   ├── DOCUMENTATION_INDEX.md  # Índice principal
│   ├── technical/              # Docs técnicos
│   └── deployment/             # Guías de deploy
│
├── src/
│   ├── app/                    # 🗂️ Next.js App Router
│   │   ├── page.tsx            # Dashboard principal
│   │   ├── pedidos/            # Página de pedidos
│   │   ├── analytics/          # Analytics avanzado
│   │   ├── seguridad/          # Seguridad y eventos
│   │   ├── configuracion/      # Configuración completa
│   │   └── chat/               # Chat interactivo (futuro)
│   │
│   ├── components/             # 🧩 Componentes React
│   │   ├── dashboard/          # Componentes del dashboard
│   │   ├── orders/             # Componentes de pedidos
│   │   ├── analytics/          # Componentes de analytics
│   │   ├── security/           # Componentes de seguridad
│   │   ├── layout/             # Layout y navegación
│   │   └── ui/                 # shadcn/ui components
│   │
│   ├── lib/                    # 🛠️ Utilities y configuración
│   │   ├── api/                # API client (Axios)
│   │   ├── hooks/              # React Query hooks
│   │   └── providers/          # Context providers
│   │
│   └── types/                  # 📝 TypeScript types
│
├── public/                     # 🖼️ Assets estáticos
├── .env.example                # Ejemplo de variables
└── README.md                   # Este archivo
```

---

## 🛠️ Stack Tecnológico

### Core
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, RSC, Server Actions)
- **Language**: [TypeScript 5.9](https://www.typescriptlang.org/) (Strict mode)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)

### Data & State
- **Data Fetching**: [TanStack Query 5](https://tanstack.com/query) (React Query)
- **HTTP Client**: [Axios 1.12](https://axios-http.com/)
- **State Management**: React Context + Zustand (future)
- **WebSocket**: Native WebSocket API

### Visualizations
- **Charts**: [Recharts 3.2](https://recharts.org/)
- **Tables**: [TanStack Table 8](https://tanstack.com/table) (future)
- **Icons**: [Lucide React](https://lucide.dev/)

### Development
- **Linting**: ESLint + TypeScript ESLint
- **Formatting**: Prettier (future)
- **Testing**: Jest + React Testing Library (future)

---

## 📊 APIs Backend Requeridas

El dashboard consume los siguientes endpoints:

```typescript
// Métricas
GET /api/metrics/dashboard
GET /api/metrics/sales-chart?range=daily
GET /api/metrics/revenue-by-product
GET /api/metrics/gemini-usage

// Pedidos
GET /api/orders?page=1&limit=10&status=pending
GET /api/orders/:id
PATCH /api/orders/:id/status

// Seguridad
GET /api/security/events
GET /api/security/stats
PATCH /api/security/events/:id/resolve

// Configuración
GET /api/config/business
POST /api/config/business
GET /api/config/gemini
POST /api/config/security

// Health & Logs
GET /api/health
GET /api/message-log
```

Ver [Análisis UI/UX](docs/technical/ANALISIS_DASHBOARD_UIUX.md#-estado-de-conectividad-api) para detalles de cada endpoint.

---

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Iniciar servidor de desarrollo (port 3001)

# Build
npm run build        # Build de producción
npm start            # Iniciar servidor de producción

# Calidad de código
npm run lint         # Linting con ESLint
npm run type-check   # Verificar tipos TypeScript

# Utilidades
npm run clean        # Limpiar cache de Next.js
npm run analyze      # Analizar bundle size
```

---

## 🎨 Design System

### Colores
Definidos en [globals.css](src/app/globals.css):
- **Primary**: Azul (#0070f3)
- **Secondary**: Gris (#6b7280)
- **Success**: Verde (#10b981)
- **Warning**: Amarillo (#f59e0b)
- **Destructive**: Rojo (#ef4444)

### Tipografía
- **Font**: Inter (Google Fonts)
- **Weights**: 400, 500, 600, 700
- **Scale**: text-xs → text-3xl

### Spacing
- **Base**: 4px (Tailwind default)
- **Scale**: 0, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64

---

## 🧪 Testing (Future)

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

---

## 🚀 Deployment

### Vercel (Recomendado)

```bash
# CLI
npm i -g vercel
vercel --prod
```

O conecta tu repo en [vercel.com](https://vercel.com).

### Render

Usa el archivo [render.yaml](render.yaml) incluido para auto-configuración.

### Docker

```bash
docker build -t capibobba-dashboard .
docker run -p 3001:3001 capibobba-dashboard
```

Ver [Guía de Deployment](docs/deployment/DEPLOY.md) completa.

---

## 🎯 Roadmap

### v0.6.0 - Mejoras de UX (Próximo)
- [ ] Implementar todos los filtros de pedidos
- [ ] Paginación real con backend
- [ ] Export CSV funcional
- [ ] Notificaciones toast (shadcn/ui)

### v0.7.0 - Analytics Avanzado
- [ ] Gráficos de tendencias personalizables
- [ ] Comparativas mes a mes
- [ ] Dashboard de NPS y encuestas
- [ ] Reportes PDF

### v0.8.0 - Features Premium
- [ ] Multi-idioma (i18n)
- [ ] Roles y permisos
- [ ] Auditoría de cambios
- [ ] API pública del dashboard

### v1.0.0 - Production
- [ ] Testing completo (>80% coverage)
- [ ] Documentación de componentes (Storybook)
- [ ] Performance audit (Lighthouse >95)
- [ ] Accessibility audit (WCAG AAA)

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'feat: Add AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

Ver [CONTRIBUTING.md](../CONTRIBUTING.md) para más detalles.

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](../LICENSE) para más información.

---

## 🆘 Soporte

- **Issues**: [GitHub Issues](https://github.com/tu-usuario/CapiBobbaBot/issues)
- **Documentación**: [docs/](docs/)
- **Backend**: Ver [project.md](../project.md)

---

## 📊 Métricas de Calidad

| Métrica | Actual | Objetivo | Status |
|---------|--------|----------|--------|
| TypeScript Coverage | 100% | 100% | ✅ |
| **CLS** (Cumulative Layout Shift) | **0.00** | <0.05 | ✅ |
| **TTFB** (Time to First Byte) | **387ms** | <400ms | ✅ |
| **Bundle Size** (gzip) | **~365KB** | <400KB | ✅ |
| **Lighthouse CI** | Configurado | Automated | ✅ |
| FCP (First Contentful Paint) | 1,532ms | <700ms | ⚠️ |

**Sprint 6 Achievements:**
- ✅ CLS eliminado completamente (fixed heights)
- ✅ Lazy loading de 9 chunks on-demand
- ✅ Resource hints implementados (dns-prefetch, preconnect)
- ✅ Lighthouse CI workflow configurado y listo

Ver [Performance Report](../docs/dashboard/LIGHTHOUSE_PERFORMANCE_REPORT.md) para análisis completo.

---

## 🙏 Créditos

Desarrollado con ❤️ por el equipo de CapiBobbaBot.

### Tecnologías utilizadas:
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query)
- [Recharts](https://recharts.org/)
- [Lucide Icons](https://lucide.dev/)

---

**¿Listo para empezar?** 🚀

```bash
npm install && npm run dev
```

Visita http://localhost:3001 y explora el dashboard.
