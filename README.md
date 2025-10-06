# CapiBobbaBot 🧋

Un sistema completo de automatización para la tienda de bubble tea "CapiBobba", que incluye un chatbot inteligente de WhatsApp, dashboard administrativo en tiempo real, sistema de monitoreo, seguridad avanzada y análisis de datos.

**Versión actual**: 2.11.1
**Estado**: Producción en Render.com
**IA**: Google Gemini 2.5 Flash (Latest)

---

## ✨ Características Principales

### 🤖 Chatbot Inteligente
- **IA Conversacional**: Integración con Google Gemini 2.5 Flash para respuestas naturales e inteligentes
- **Menú Interactivo**: Navegación con botones y respuestas de formato libre
- **Flujo de Pedidos Automatizado**: Guía completa desde selección de productos hasta confirmación
- **Sistema de Reacciones Inteligentes**: Respuestas emocionales contextuales (emoji reactions)
- **Caché Inteligente**: Sistema de caché con Gemini para optimizar costos y velocidad
- **Persistencia con Redis**: Mantiene contexto de conversación entre sesiones

### 📊 Dashboard Administrativo (Next.js 14)
- **Panel de Control en Tiempo Real**: Métricas, pedidos, analytics y seguridad
- **Visualizaciones Avanzadas**: Gráficos interactivos con Recharts
- **WebSocket Live**: Actualizaciones automáticas sin recargar página
- **Dark Mode**: Interfaz moderna con Tailwind CSS y Shadcn UI
- **Gestión de Pedidos**: Vista completa con filtros y acciones rápidas
- **Analytics Avanzado**: Tendencias de ventas, productos top, performance de IA
- **Panel de Seguridad**: Monitoreo de eventos y estadísticas en tiempo real
- **Responsive Design**: Optimizado para desktop, tablet y móvil

### 🔒 Sistema de Seguridad
- **Rate Limiting**: Protección contra spam y abuso
- **Validación de Mensajes**: Detección de patrones maliciosos
- **Backups Automáticos**: Respaldo periódico de datos críticos
- **Monitoreo de Eventos**: Tracking de actividad sospechosa
- **Alertas en Tiempo Real**: Notificaciones de incidentes de seguridad

### 📈 Sistema de Monitoreo
- **Health Checks Automáticos**: Verificación continua de componentes
- **Métricas de Sistema**: CPU, memoria, disco, conexiones
- **Métricas de Negocio**: Pedidos, conversiones, revenue
- **WebSocket Server**: Comunicación en tiempo real con dashboard
- **Memory Monitor**: Detección de memory leaks y optimización

### 🔄 Integración n8n
- **Workflows Automatizados**: Procesamiento de mensajes y pedidos
- **Retry Logic**: Sistema de reintentos en 10 nodos críticos
- **Error Handling**: Workflow dedicado para manejo de errores
- **Google Sheets**: Almacenamiento de pedidos y clientes
- **Google Drive**: Respaldo de imágenes y archivos
- **Telegram Alerts**: Notificaciones críticas a administradores

---

## 🛠️ Stack Tecnológico

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **IA**: Google Gemini 2.5 Flash API
- **Base de Datos**: Redis 7.4+ (persistencia y caché)
- **Mensajería**: WhatsApp Cloud API (Meta)
- **Automatización**: n8n workflows

### Frontend (Dashboard)
- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **UI**: Tailwind CSS + Shadcn UI
- **Gráficos**: Recharts
- **Estado**: TanStack Query (React Query)
- **Tiempo Real**: WebSocket
- **HTTP Client**: Axios

### DevOps
- **Hosting**: Render.com
- **CI/CD**: Auto-deploy desde GitHub
- **Monitoreo**: Sistema custom en tiempo real
- **Logs**: Winston + archivos JSONL

---

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js v18 o superior
- Redis 7.0+ (local con Docker o servicio cloud)
- Cuenta Meta for Developers (WhatsApp API)
- API Key de Google Gemini
- (Opcional) Instancia de n8n
- (Opcional) Cuenta Render.com para deploy

### Instalación Local

```bash
# 1. Clonar repositorio
git clone https://github.com/FeyoMx/CapiBobbaBot.git
cd CapiBobbaBot

# 2. Instalar dependencias backend
npm install

# 3. Instalar dependencias dashboard
cd dashboard-next
npm install
cd ..

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales
```

### Variables de Entorno Esenciales

```env
# WhatsApp API (Meta)
VERIFY_TOKEN="tu_token_verificacion"
WHATSAPP_TOKEN="tu_token_acceso_permanente"
PHONE_NUMBER_ID="id_numero_telefono"

# Google Gemini
GEMINI_API_KEY="tu_gemini_api_key"

# Redis
REDIS_URL="redis://localhost:6379"

# Administradores
ADMIN_WHATSAPP_NUMBERS="521XXXXXXXXXX,521YYYYYYYYYY"

# n8n (opcional)
N8N_WEBHOOK_URL="https://tu-n8n.com/webhook/id"
```

Ver [.env.example](.env.example) para todas las variables disponibles.

### Ejecutar en Desarrollo

```bash
# Terminal 1: Backend
npm start

# Terminal 2: Dashboard
cd dashboard-next
npm run dev

# Terminal 3: Redis (Docker)
docker run -d -p 6379:6379 redis:7.4-alpine
```

**URLs locales**:
- Backend API: `http://localhost:3000`
- Dashboard: `http://localhost:3001`
- Health Check: `http://localhost:3000/api/health`

---

## 📂 Estructura del Proyecto

```
CapiBobbaBot/
├── chatbot.js              # Servidor principal del bot
├── business_data.js        # Configuración del negocio (menú, promos)
├── gemini-cache.js         # Sistema de caché inteligente
├── package.json            # Dependencias backend
├── render.yaml             # Configuración Render.com
│
├── dashboard-next/         # 📊 Dashboard Next.js 14
│   ├── src/
│   │   ├── app/           # Pages (App Router)
│   │   ├── components/    # Componentes React
│   │   ├── lib/           # Utilities, hooks, API client
│   │   └── types/         # TypeScript types
│   └── package.json       # Dependencias dashboard
│
├── monitoring/            # 📈 Sistema de monitoreo
│   ├── metrics.js         # Recolector de métricas
│   ├── health-checker.js  # Health checks automáticos
│   ├── websocket-server.js # Server WebSocket
│   └── memory-monitor.js  # Monitor de memoria
│
├── security/              # 🔒 Módulos de seguridad
│   ├── rate-limiter.js    # Rate limiting
│   ├── validator.js       # Validación de mensajes
│   └── backup-manager.js  # Backups automáticos
│
├── reactions/             # 😊 Sistema de reacciones
│   └── intelligent-reactions.js
│
├── scripts/               # 🔧 Scripts de utilidad
│   ├── test-security.js
│   └── check-security-health.js
│
├── docs/                  # 📚 Documentación completa
│   ├── README.md          # Índice de documentación
│   ├── dashboard/         # Docs del dashboard
│   ├── sprints/           # Resúmenes de sprints
│   ├── security/          # Docs de seguridad
│   └── workflows/         # Análisis de workflows
│
├── workflow_analysis/     # n8n Workflows
│   └── Enhanced Message Normalizer.js
│
├── .claude/               # Configuración Claude Code
│   └── agents/            # Subagentes especializados
│
├── config/                # Configuraciones
├── backups/               # Backups automáticos
└── dashboard/             # Dashboard antiguo (legacy)
```

---

## 📊 Funcionalidades del Dashboard

### Páginas Principales

1. **Overview** (`/`)
   - KPIs en tiempo real: Pedidos, Revenue, Gemini Calls, Cache Hit Rate
   - Gráficos de tendencias (ventas, revenue, uso de IA)
   - Tabla de pedidos recientes con acciones rápidas

2. **Pedidos** (`/pedidos`)
   - Lista completa con paginación y filtros
   - Vista detallada de cada pedido
   - Actualización de estados
   - Export de datos

3. **Analytics** (`/analytics`)
   - Análisis de ventas (diario, semanal, mensual)
   - Top 5 productos por ingresos
   - Performance de Gemini AI (response time, cache hits)
   - Métricas de conversión

4. **Seguridad** (`/seguridad`)
   - Eventos de seguridad en tiempo real
   - Estadísticas de rate limiting
   - Actividad sospechosa
   - Panel de control de backups

5. **Encuestas** (`/encuestas`)
   - Resultados de encuestas de satisfacción
   - Análisis de feedback de clientes
   - Visualización de tendencias

6. **Configuración** (`/configuracion`)
   - Gestión de business_data.js
   - Configuración de parámetros del bot
   - Variables del sistema

---

## 🔐 Seguridad y Privacidad

- **Rate Limiting**: Máximo 30 mensajes/minuto por usuario
- **Validación de Entrada**: Sanitización de todos los mensajes
- **Backups Automáticos**: Cada 6 horas
- **Logs de Auditoría**: Tracking completo de eventos
- **Política de Privacidad**: Cumple con requisitos de Meta
- **HTTPS**: Todas las comunicaciones encriptadas

Ver [docs/PRIVACY_POLICY.md](docs/PRIVACY_POLICY.md) para más detalles.

---

## 📈 Monitoreo y Observabilidad

### Health Checks

```bash
# Verificar estado del sistema
curl https://capibobbabot.onrender.com/api/health
```

**Componentes monitoreados**:
- Recursos del sistema (CPU, memoria, disco)
- Conectividad del bot (WhatsApp API)
- Conexión Redis
- Webhooks n8n
- Métricas de negocio
- Disk space
- Memory leaks

### Métricas Disponibles

- **Sistema**: CPU, memoria, disco, uptime
- **Negocio**: Pedidos, revenue, conversiones
- **IA**: Llamadas Gemini, cache hit rate, response time
- **Seguridad**: Rate limit hits, eventos bloqueados

---

## 🔄 Workflows n8n

El sistema incluye workflows automatizados para:

- ✅ **Procesamiento de mensajes** con retry logic (3 intentos)
- ✅ **Guardado de pedidos** en Google Sheets (2 intentos)
- ✅ **Upload de imágenes** a Google Drive (3 intentos)
- ✅ **Notificaciones Telegram** con manejo de errores
- ✅ **Workflow de errores** para tracking y alertas
- ✅ **Error rate**: 0% (validado en producción)

Ver [docs/workflows/](docs/workflows/) para documentación completa.

---

## 📦 Deploy en Render.com

El proyecto está configurado para auto-deploy desde GitHub.

### Configuración

```yaml
# render.yaml
services:
  - type: web
    name: capibobbabot
    env: node
    buildCommand: npm install --production
    startCommand: node --max-old-space-size=400 --expose-gc chatbot.js
    autoDeploy: true
```

### Variables de Entorno en Render

Configurar todas las variables del `.env.example` en el dashboard de Render.

**URLs de producción**:
- Backend: `https://capibobbabot.onrender.com`
- Health: `https://capibobbabot.onrender.com/api/health`

---

## 🧪 Testing

```bash
# Test de seguridad
node scripts/test-security.js

# Health check completo
node scripts/check-security-health.js

# Build del dashboard
cd dashboard-next
npm run build
```

---

## 📚 Documentación Adicional

- **[project.md](project.md)** - Documentación técnica completa con changelog
- **[CLAUDE.md](CLAUDE.md)** - Instrucciones para desarrollo con Claude Code
- **[docs/README.md](docs/README.md)** - Índice completo de documentación
- **[docs/sprints/](docs/sprints/)** - Resúmenes de sprints de desarrollo
- **[docs/dashboard/](docs/dashboard/)** - Análisis y propuestas del dashboard
- **[.claude/agents/README.md](.claude/agents/README.md)** - Subagentes especializados

---

## 🎯 Roadmap

### Completado ✅
- [x] Bot conversacional con Gemini AI
- [x] Dashboard Next.js 14 completo
- [x] Sistema de seguridad y monitoreo
- [x] Workflows n8n con retry logic
- [x] WebSocket para tiempo real
- [x] Sistema de reacciones inteligentes

### En Progreso 🚧
- [ ] Sistema de encuestas de satisfacción (80%)
- [ ] Analytics avanzado con ML
- [ ] Integración con pasarela de pagos

### Futuro 🔮
- [ ] Modo multi-idioma
- [ ] Integración con CRM
- [ ] App móvil nativa
- [ ] Sistema de fidelización

Ver [docs/ROADMAP.md](docs/ROADMAP.md) para más detalles.

---

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'feat: add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

### Formato de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bugs
- `docs:` Solo documentación
- `refactor:` Refactorización de código
- `perf:` Mejoras de performance
- `security:` Mejoras de seguridad

---

## ✍️ Autor

**FeyoMx**
- GitHub: [@FeyoMx](https://github.com/FeyoMx)

---

## 📜 Licencia

Este proyecto está bajo la Licencia ISC.

---

## 🙏 Agradecimientos

- Google Gemini por la IA conversacional
- Meta por WhatsApp Cloud API
- Comunidad de n8n
- Shadcn por los componentes UI

---

## 📞 Soporte

Para reportar bugs o solicitar features:
- GitHub Issues: [Crear Issue](https://github.com/FeyoMx/CapiBobbaBot/issues)
- Documentación: [project.md](project.md)

---

**🧋 CapiBobbaBot - Automatización inteligente para tu negocio de bubble tea**

*Última actualización: Octubre 6, 2025 - v2.11.1*
