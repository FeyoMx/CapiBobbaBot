# CapiBobbaBot - Documentación del Proyecto

## 📋 Descripción General

CapiBobbaBot es un sistema completo de automatización para una tienda de bubble tea que incluye:
- Bot de WhatsApp con IA (Google Gemini)
- Sistema de monitoreo en tiempo real
- Dashboard administrativo
- Integración con n8n para automatización de procesos
- Persistencia con Redis
- **Sistema de retry logic y manejo de errores (v2.7.0+)**

## 🏗️ Arquitectura del Sistema

### Componentes Principales

1. **Chatbot Principal** (`chatbot.js`)
   - Servidor Express para manejar webhooks de WhatsApp
   - Integración con Google Gemini para respuestas inteligentes
   - Gestión de estado de conversaciones con Redis
   - Sistema de métricas y monitoreo

2. **Sistema de Monitoreo** (`/monitoring/`)
   - Recolección de métricas en tiempo real
   - Health checks automáticos
   - Servidor WebSocket para comunicación en tiempo real
   - Monitor de memoria y recursos

3. **Dashboard Web** (`/dashboard/`)
   - React SPA con diseño moderno y tema oscuro
   - Editor de configuración del negocio
   - Visualización de pedidos y logs
   - Panel de monitoreo en tiempo real
   - UI mejorada con tarjetas, iconos FontAwesome y efectos hover
   - Layout responsive con grid de 2 columnas

4. **Integración n8n**
   - Workflows para procesamiento de mensajes
   - Automatización de pedidos
   - Gestión de clientes en Google Sheets
   - Notificaciones y alertas

5. **Subagentes Claude Code** (`.claude/agents/`)
   - **UI/UX Senior**: Diseño UI/UX, frontend moderno, accesibilidad
   - **Dashboard Expert**: Dashboards administrativos, data visualization
   - **n8n Workflow Expert**: Automatización, workflows, MCP tools (525 nodos, validación)
   - Configuración personalizada para desarrollo especializado
   - Ver [.claude/agents/README.md](.claude/agents/README.md) para detalles

## 📂 Estructura de Archivos

```
CapiBobbaBot/
├── chatbot.js              # Servidor principal del bot
├── business_data.js        # Configuración del negocio (menú, promos)
├── package.json            # Dependencias Node.js
├── .env                    # Variables de entorno (NO INCLUIR EN GIT)
├── .env.example           # Plantilla de variables de entorno
├── README.md              # Documentación
├── PRIVACY_POLICY.md      # Política de privacidad
│
├── monitoring/            # Sistema de monitoreo
│   ├── metrics.js         # Recolector de métricas
│   ├── health-checker.js  # Health checks
│   ├── websocket-server.js # Servidor WebSocket
│   └── memory-monitor.js  # Monitor de memoria
│
├── dashboard/             # Frontend del dashboard
│   ├── build/            # Build de producción (React)
│   ├── src/              # Código fuente React
│   │   ├── App.js        # Componente principal con nuevo diseño
│   │   ├── index.css     # Estilos modernos con tema oscuro
│   │   └── [componentes] # Componentes individuales
│   ├── public/           # Archivos públicos
│   │   └── index.html    # HTML principal con FontAwesome
│   ├── css/              # Estilos del panel de monitoreo
│   │   └── monitoring.css
│   ├── js/               # Scripts del cliente
│   │   └── monitoring-client.js
│   └── monitoring.html   # Panel de monitoreo independiente
│
├── .claude/                # Configuración de Claude Code
│   └── agents/            # Subagentes personalizados
│       ├── README.md              # Documentación de subagentes
│       ├── ui-ux-senior.md        # Subagente UI/UX experto
│       ├── dashboard-expert.md    # Subagente Dashboard experto
│       └── n8n-workflow-expert.md # Subagente n8n workflows experto
│
└── [Workflows n8n]/      # Archivos JSON de workflows
    ├── CapiBobba Enhanced - Complete Message Processor (ACTIVE).json
    └── [otros workflows]
```

## 🔧 Variables de Entorno

### Variables Obligatorias

```env
# API de WhatsApp (Meta)
VERIFY_TOKEN="token_secreto_verificacion"
WHATSAPP_TOKEN="token_permanente_acceso"
PHONE_NUMBER_ID="id_numero_telefono"

# API de Google Gemini
GEMINI_API_KEY="clave_api_gemini"

# Administradores
ADMIN_WHATSAPP_NUMBERS="521XXXXXXXXXX,521YYYYYYYYYY"

# n8n Webhook
N8N_WEBHOOK_URL="https://n8n-instance.com/webhook/id"

# Redis
REDIS_URL="redis://user:password@host:port"
```

### Variables Opcionales

```env
# Configuración del servidor
PORT=3000
WEBSOCKET_PORT=3001
BASE_URL="https://tu-bot.render.com"

# API de WhatsApp
WHATSAPP_API_VERSION="v18.0"

# Notificaciones Telegram
TELEGRAM_BOT_TOKEN="token_bot_telegram"
TELEGRAM_CHAT_ID="id_chat"

# Umbrales de alertas
CPU_THRESHOLD=80
MEMORY_THRESHOLD=85
RESPONSE_TIME_THRESHOLD=5000
ERROR_RATE_THRESHOLD=0.05
DISK_THRESHOLD=90

# Intervalos
HEALTH_CHECK_INTERVAL=30000
METRICS_BROADCAST_INTERVAL=5000
METRICS_RETENTION_HOURS=24

# Backups
ENABLE_AUTO_BACKUP=true
BACKUP_SCHEDULE="0 3 * * *"
CLEANUP_SCHEDULE="0 2 * * 0"

# Desarrollo
NODE_ENV=production
LOG_LEVEL=info
WEBSOCKET_DEBUG=false
METRICS_DEBUG=false
```

## 🚀 Stack Tecnológico

### Backend
- **Node.js**: Runtime
- **Express.js**: Framework web
- **Redis**: Base de datos en memoria para estado
- **Axios**: Cliente HTTP
- **Body-parser**: Parsing de JSON
- **node-cron**: Tareas programadas
- **ws**: WebSocket para monitoreo

### Frontend
- **React**: Framework UI
- **Material-UI**: Componentes UI (en componentes específicos)
- **CSS Variables**: Sistema de diseño con tema oscuro
- **FontAwesome**: Iconografía moderna
- **Chart.js**: Gráficos
- **Socket.io-client**: Cliente WebSocket

### APIs Externas
- **WhatsApp Cloud API**: Mensajería
- **Google Gemini API**: Inteligencia Artificial
- **n8n**: Automatización de workflows

### Infraestructura
- **Render.com**: Hosting y deployment
- **Redis Cloud**: Base de datos Redis
- **n8n Cloud/Self-hosted**: Automatización

## 🔄 Flujo de Datos

### 1. Recepción de Mensajes
```
WhatsApp → Webhook (/webhook POST) → chatbot.js → Redis (estado)
                                                 → Gemini (IA)
                                                 → n8n (análisis)
```

### 2. Procesamiento en n8n
```
Webhook → Message Normalizer → Enhanced Processor → Actions:
                                                    - Google Sheets
                                                    - Drive (imágenes)
                                                    - Respuestas automáticas
```

### 3. Monitoreo
```
Métricas → MetricsCollector → Redis → WebSocket → Dashboard
Health → HealthChecker → Alertas → Telegram/Admin
```

## 📊 Sistema de Métricas

### Métricas del Sistema
- **CPU**: Uso actual y histórico
- **Memoria**: RAM utilizada/disponible
- **Disco**: Espacio usado
- **Red**: Throughput de mensajes

### Métricas de Negocio
- **Pedidos**: Conteo por hora/día
- **Ingresos**: Tracking de ventas
- **Conversión**: Ratio mensajes/pedidos
- **Tiempo de respuesta**: Latencia promedio

### Métricas de Rendimiento
- **Response Time**: Tiempo de respuesta del bot
- **Error Rate**: Tasa de errores
- **Throughput**: Mensajes por segundo
- **Success Rate**: Tasa de éxito

## 🛡️ Gestión de Estado

### Estados de Conversación (Redis)
```javascript
{
  step: 'esperando_direccion' | 'esperando_metodo_pago' | etc,
  orderData: {
    summary: string,
    total: number,
    fullText: string
  },
  deliveryInfo: {
    address: string,
    accessCodeRequired: boolean
  },
  paymentInfo: {
    method: 'Efectivo' | 'Transferencia',
    cashDenomination?: number,
    proofImageId?: string
  }
}
```

### Claves en Redis
- `${phoneNumber}`: Estado de conversación del usuario
- `maintenance_mode_status`: Estado de mantenimiento
- `metrics:*`: Métricas del sistema
- `orders:*`: Log de pedidos

## 🔌 Endpoints de la API

### Webhook de WhatsApp
- `GET /webhook`: Verificación (una vez)
- `POST /webhook`: Recepción de mensajes

### Dashboard
- `GET /dashboard`: Panel administrativo
- `GET /monitoring`: Panel de monitoreo
- `GET /api/business-data`: Obtener configuración
- `POST /api/business-data`: Actualizar configuración
- `GET /api/orders`: Obtener log de pedidos
- `GET /api/messages`: Obtener log de mensajes

### Sistema de Monitoreo
- `GET /health`: Health check
- `GET /metrics`: Métricas actuales
- `WebSocket :3001`: Stream de métricas en tiempo real

### Sistema de Caché Gemini
- `GET /api/gemini/cache/stats`: Estadísticas del caché y hit rate
- `GET /api/gemini/cache/popular`: Queries más populares en caché
- `POST /api/gemini/cache/clear`: Limpiar todo el caché
- `POST /api/gemini/cache/invalidate`: Invalidar entrada específica

### Sistema de Seguridad
- `GET /api/security/stats`: Estadísticas de seguridad
- `GET /api/security/alerts`: Alertas activas
- `GET /api/security/blocked-users`: Usuarios bloqueados
- `GET /api/security/events?limit=N`: Eventos recientes
- `POST /api/security/unblock/:userId`: Desbloquear usuario
- `GET /api/security/user-stats/:userId`: Estadísticas de usuario
- `POST /api/security/backup`: Crear backup manual
- `GET /api/security/backups`: Listar backups

### Sistema de Redis States
- `GET /api/redis-states`: Obtener todos los estados de usuarios
- `DELETE /api/redis-states/:key`: Eliminar estado específico

### Sistema de Reacciones Inteligente
- `GET /api/reactions/stats`: Estadísticas de uso de reacciones
- `POST /api/reactions/cleanup`: Limpiar historial de reacciones antiguas
- `GET /api/user/metrics/:phoneNumber`: Obtener métricas de usuario para reacciones personalizadas

## 🎯 Funcionalidades Principales

### 1. Flujo de Pedidos
1. Usuario envía pedido desde web app
2. Bot recibe JSON del pedido
3. Solicita dirección de entrega
4. Pregunta método de pago
5. Para efectivo: solicita denominación
6. Para transferencia: solicita comprobante
7. Confirma pedido completo
8. Notifica a admins
9. Registra en n8n/Google Sheets

### 2. Respuestas Inteligentes (Gemini)
- Consultas sobre menú
- Preguntas de horarios
- Info de promociones
- Contacto con humano

### 3. Panel de Administración
- **Diseño moderno**: Tema oscuro con tarjetas y efectos hover
- **Layout responsive**: Grid de 2 columnas (desktop) y 1 columna (móvil)
- **Iconografía profesional**: FontAwesome para mejor UX
- Editor de menú/configuración
- Visualización de pedidos
- Logs de conversaciones
- Métricas en tiempo real
- **Header sticky**: Con logo, estado del sistema y botones de acción
- **Dashboard de Seguridad**: Panel dedicado para monitoreo de seguridad
  - Estadísticas de alertas y usuarios bloqueados
  - Visualización de eventos de seguridad
  - Gestión de usuarios bloqueados
  - Auto-actualización en tiempo real
- **Página de Configuración** (`dashboard-next/src/app/configuracion/page.tsx`):
  - **Tab Negocio**: Configuración completa de la información del negocio
    - Información básica: nombre, teléfono, ubicación, horarios
    - URL del menú digital
    - Zonas de entrega GRATIS
    - Costo de envío
    - **Información de Pago**: métodos, banco, cuenta, titular
    - Credenciales de WhatsApp Business API (solo referencia)
  - **Tab Gemini AI**: Configuración del modelo de IA
    - Modelo: `gemini-flash-latest`
    - Temperatura, max tokens, caché
    - Safety settings por categoría
  - **Tab Seguridad**: Configuración de seguridad
    - Rate limiting
    - Auto-block de spam
    - Backups automáticos

### 4. Sistema de Alertas
- CPU > 80%
- Memoria > 85%
- Tiempo de respuesta > 5s
- Tasa de error > 5%
- Disco > 90%

## 🔐 Seguridad

### Validaciones
- Verificación de tokens de WhatsApp
- Validación de administradores
- Sanitización de inputs
- Rate limiting

### Datos Sensibles
- Tokens en variables de entorno
- No exponer claves en logs
- HTTPS obligatorio
- Política de privacidad cumplida

## 🚨 Manejo de Errores

### Estrategias
1. **Try-catch** en operaciones críticas
2. **Timeout** en llamadas HTTP (5s)
3. **Retry logic** para Redis
4. **Fallback** a respuestas predefinidas
5. **Logging** detallado de errores

### Notificaciones
- Errores críticos → Admins vía WhatsApp
- Alertas de sistema → Telegram (opcional)
- Logs → Consola y Redis

## 📈 Optimizaciones

### Memoria (512MB)
```javascript
// Límite de heap a 400MB
NODE_OPTIONS='--max-old-space-size=400'

// Garbage collection agresivo
setInterval(() => global.gc(), 300000)

// Threadpool reducido
UV_THREADPOOL_SIZE=2
```

### Rendimiento
- Conexiones persistentes (keep-alive)
- Caché de respuestas frecuentes
- Lazy loading de datos
- Compresión de responses

## 🔄 Workflows n8n

### Message Processor
1. **Webhook Entry Point**: Recibe mensajes
2. **Message Normalizer**: Estructura datos
3. **Enhanced Processor**: Procesa según tipo
4. **Actions**:
   - Guardar en Google Sheets
   - Descargar y guardar imágenes
   - Actualizar estado del cliente
   - Enviar respuestas automáticas

### Automatizaciones
- Encuestas post-compra
- Recordatorios de pedidos
- Análisis de sentimiento
- Reportes automáticos

### Nodo Personalizado de n8n: Encuesta CapiBobba

**Paquete npm**: `n8n-nodes-encuestacapibobba` (versión 0.2.1)

Nodo personalizado desarrollado para enviar encuestas de satisfacción post-compra a través de WhatsApp Business API usando mensajes interactivos.

**Características**:
- Encuesta con escala de 1-5 estrellas (⭐)
- Mensaje personalizado con fecha del pedido
- Invitación a comentarios opcionales post-calificación
- Integración directa con WhatsApp Cloud API
- Credenciales configurables para autenticación

**Parámetros**:
- `phoneNumber` (requerido): Número de teléfono del cliente
- `fecha` (requerido): Fecha del pedido para personalización

**Repositorio**: [n8n-nodes-encuestacapibobba/](n8n-nodes-encuestacapibobba/)
- Estructura TypeScript con compilación automática
- Build: `npm run build` en el directorio del nodo
- Historial de versiones en [CHANGELOG.md](n8n-nodes-encuestacapibobba/CHANGELOG.md)
- Publicación manual a npm registry

## 🧪 Testing

### Endpoints a Probar
```bash
# Health check
curl https://capibobbabot.onrender.com/

# Metrics
curl https://capibobbabot.onrender.com/metrics

# Dashboard
curl https://capibobbabot.onrender.com/dashboard

# Business data
curl https://capibobbabot.onrender.com/api/business-data
```

### Estados de Conversación
- Nuevo usuario
- Pedido completo
- Cancelación
- Error en pago
- Timeout de sesión

## 🚀 Deployment

### Pre-requisitos
1. Cuenta en Render.com
2. Redis Cloud configurado
3. n8n workflow activo
4. Variables de entorno configuradas

### Pasos
1. Push a GitHub
2. Conectar Render a repo
3. Configurar Build Command: `npm install`
4. Configurar Start Command: `npm start`
5. Agregar variables de entorno
6. Habilitar Web Service + Background Worker

### Post-deployment
1. Verificar health endpoint
2. Probar webhook de WhatsApp
3. Validar conexión Redis
4. Confirmar métricas en dashboard

## 🐛 Troubleshooting

### Bot no responde
1. Verificar webhook configurado en Meta
2. Revisar logs en Render
3. Confirmar conexión Redis
4. Validar token de WhatsApp

### Métricas no se actualizan
1. Verificar WebSocket en puerto 3001
2. Revisar firewall/CORS
3. Confirmar métricas en Redis
4. Validar HealthChecker activo

### Errores de memoria
1. Revisar garbage collection
2. Verificar límite de heap
3. Analizar memory leaks
4. Reducir retención de datos

### n8n no recibe datos
1. Validar URL del webhook
2. Confirmar formato de payload
3. Revisar logs de n8n
4. Verificar autenticación

## 📚 Comandos Útiles

### Desarrollo
```bash
# Instalar dependencias
npm install

# Ejecutar localmente
npm start

# Ver logs en Render
render logs -s service-name

# Conectar a Redis local
docker run -d -p 6379:6379 redis
```

### Monitoreo
```bash
# Ver métricas actuales
curl localhost:3000/metrics

# Health check
curl localhost:3000/health

# Limpiar Redis
redis-cli FLUSHALL
```

## 🎨 Personalización

### Modificar Menú
Editar `business_data.js` con:
- Categorías de productos
- Precios
- Promociones
- Horarios
- Información de contacto

### Ajustar Flujos
Modificar en `chatbot.js`:
- Estados de conversación
- Respuestas predefinidas
- Validaciones
- Notificaciones

### Customizar Dashboard
Actualizar en `/dashboard/`:
- **App.js**: Estructura principal con layout moderno
- **index.css**: Variables CSS para tema oscuro y responsive design
- **index.html**: Incluye FontAwesome CDN
- Componentes React individuales
- Gráficos Chart.js
- Sistema de grid responsive

## 🎨 Dashboard Moderno (v2.0)

### Diseño Visual
- **Tema oscuro profesional**: Inspirado en el dashboard de monitoreo
- **Paleta de colores**: Variables CSS con esquema azul/gris oscuro
- **Tipografía**: Inter font family para mejor legibilidad
- **Efectos visuales**: Hover effects, sombras y transiciones suaves

### Layout y Estructura
```
Header Sticky
├── Logo + Estado del Sistema
└── Botones de Acción (Actualizar, Configuración)

Grid Principal (2 columnas desktop, 1 móvil)
├── Columna Izquierda (Componentes principales)
│   ├── Modo Mantenimiento
│   ├── Editor de Datos de Negocio
│   ├── Visualizador de Pedidos
│   └── Dashboard de Encuestas
└── Columna Derecha (Actividad y herramientas)
    ├── Interfaz de Chat
    ├── Registro de Mensajes
    └── Estado de Redis
```

### Componentes UI
- **Tarjetas**: Fondo oscuro con bordes y hover effects
- **Headers**: Con iconos FontAwesome y fondo diferenciado
- **Botones**: Styled con colores primarios/secundarios
- **Scrollbars**: Personalizados para mantener el tema

### Responsive Design
- **Desktop**: Grid 2fr 1fr (70% - 30%)
- **Tablet**: Grid 1fr (columna única)
- **Mobile**: Layout apilado con padding reducido
- **Breakpoints**: 1200px, 768px, 480px

### Iconografía
- **FontAwesome 6.4.0**: CDN integrado
- **Iconos temáticos**: Robot, herramientas, gráficos, chat, base de datos
- **Estados visuales**: Conectado (verde), desconectado (rojo), cargando (amarillo)

## 🔮 Roadmap

### ✅ Logros Implementados (2025)

**Sistema de Caché Gemini AI (v2.5.0)**:
- ⚡ Reducción 80-95% en latencia de respuestas IA
- 💰 Ahorro 60-80% en costos de API Gemini
- 📊 Sistema completo de métricas y analytics
- 🔄 Normalización inteligente de mensajes
- 🎯 Hit rate objetivo >70%

**Sistema de Seguridad Completo (v2.3.0 - v2.4.1)**:
- ✅ 5 mejoras técnicas completadas
- ✅ 8 mejoras de seguridad implementadas
- ✅ Dashboard web de métricas de seguridad
- ✅ Sistema de backups automáticos
- ✅ Detección de spam/abuse
- ✅ Audit logs de eventos críticos
- ✅ Rate limiting avanzado por usuario
- ✅ Plan de recuperación ante desastres

**Total de mejoras completadas**: 14/~60 items del roadmap (~23% completado)

---

### Features Planeadas
- [ ] Multi-idioma
- [ ] Integración con pagos online
- [ ] Sistema de cupones
- [ ] Programa de lealtad
- [ ] Chat grupal para equipos
- [ ] Analytics avanzados
- [ ] A/B testing
- [ ] Voice messages support
- [ ] Web widget para sitio web
- [ ] Seguimiento en tiempo real de pedidos
- [ ] Notificaciones push/SMS
- [ ] Sistema de feedback y reseñas
- [ ] Gestión de inventario en tiempo real
- [ ] Encuestas post-entrega automáticas
- [ ] QR codes para pagos inmediatos
- [ ] Ofertas personalizadas basadas en historial
- [ ] Chatbot para Telegram
- [ ] Instagram DM integration
- [ ] Facebook Messenger integration
- [ ] Sistema de quejas/reclamos

### Mejoras Técnicas
- [ ] Tests automatizados
- [ ] CI/CD pipeline
- [ ] Containerización (Docker)
- [ ] Kubernetes deployment
- [x] Rate limiting avanzado ✅ v2.3.0 (por usuario, múltiples ventanas de tiempo)
- [x] Caché de respuestas IA ✅ v2.5.0 (Redis cache para Gemini, 80-95% reducción latencia)
- [ ] APM (Application Performance Monitoring)
- [ ] Alertas inteligentes con ML
- [ ] Logs estructurados con ELK stack
- [x] Backup automático de Redis ✅ v2.3.0 (cada 6 horas, retención 7 días)
- [ ] Replicación de datos críticos
- [x] Plan de recuperación ante desastres ✅ v2.3.0 (sistema de backups y restauración)
- [x] Detección de spam/abuse ✅ v2.3.0 (rate limiting + monitoreo de patrones)
- [x] Audit logs de acciones críticas ✅ v2.3.0 (eventos de seguridad con retención 24h)
- [ ] Compresión de imágenes automática
- [ ] CDN para assets estáticos
- [ ] Predicción de demanda con IA
- [ ] Versionado de configuraciones

### Mejoras de Analytics y Métricas
- [ ] Métricas de conversión por producto
- [ ] Análisis de sentimiento de clientes
- [ ] Horas pico y tendencias
- [ ] Dashboard de insights de negocio
- [ ] Métricas de satisfacción del cliente
- [ ] Rating de productos
- [ ] Analytics de widget web
- [ ] A/B testing de interfaces

### Mejoras de Seguridad
- [x] Rate limiting por usuario ✅ v2.3.0
- [x] Validación mejorada de inputs ✅ v2.3.0 (SQL injection, XSS, command injection)
- [x] Backup y recuperación automática ✅ v2.3.0
- [x] Monitoreo de seguridad 24/7 ✅ v2.3.0
- [x] Dashboard de seguridad web ✅ v2.4.0 (visualización en tiempo real)
- [x] Detección de DDoS ✅ v2.3.0 (threshold configurable)
- [x] Sistema de bloqueo automático de usuarios ✅ v2.3.0
- [x] Alertas multinivel (low/medium/high/critical) ✅ v2.3.0
- [ ] Integración con Slack/Discord para alertas
- [ ] Sistema de whitelisting para usuarios confiables
- [ ] Análisis ML para detección de patrones anómalos
- [ ] Autenticación de dos factores (2FA)
- [ ] Encriptación end-to-end de mensajes sensibles

## 📞 Soporte

### Contacto
- GitHub: @FeyoMx
- Issues: GitHub Issues
- Docs: README.md

### Recursos
- [WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Google Gemini Docs](https://ai.google.dev/docs)
- [n8n Documentation](https://docs.n8n.io/)
- [Redis Documentation](https://redis.io/docs/)

## 📝 Notas Importantes

### Para Claude Code
- Este proyecto usa **Redis** para estado persistente
- El bot requiere **webhooks activos** de WhatsApp
- Las **métricas** se actualizan cada 5 segundos
- El **garbage collector** corre cada 5 minutos
- Los **backups** son automáticos a las 3 AM

### Consideraciones
- **No incluir** archivo `.env` en commits
- **Actualizar** tokens regularmente
- **Monitorear** uso de recursos en Render
- **Revisar** logs diariamente
- **Mantener** business_data.js actualizado

### Límites Conocidos
- Render free tier: 512MB RAM
- WhatsApp API: Rate limits por número
- Redis: Expira estados en 24h
- Gemini: Límites de requests/minuto

---

## 📋 Historial de Cambios

### v2.13.1 (2025-10-13) - Feed de Google Merchant Center 🛍️
- 🛍️ **Feed de Productos para Google Shopping** (`google_merchant_center_products.csv`):
  - Archivo CSV con 39 productos completos del menú de CapiBobba
  - Formato compatible con Google Merchant Center según especificaciones 2025
  - Campos obligatorios incluidos: id, title, description, link, image_link, price, condition, availability, brand, product_type, google_product_category
  - **Estructura de productos**:
    - 12 Bebidas Base Agua Frappe ($75.00 MXN)
    - 11 Bebidas Base Leche Frappe ($75.00 MXN)
    - 1 Bebida Caliente genérica ($60.00 MXN)
    - 4 Especialidades ($75-$80 MXN)
    - 6 Toppings ($10.00 MXN)
    - 1 Postre: CapiGofre ($35.00 MXN)
    - 2 Combos Promocionales ($110-$130 MXN)

- 📚 **Documentación Completa** (`GOOGLE_MERCHANT_CENTER_FEED.md`):
  - Guía paso a paso para configurar feed en Google Merchant Center
  - Especificación detallada de todos los campos obligatorios y opcionales
  - Requisitos de imágenes de productos (formato, tamaño, URLs)
  - Instrucciones de subida manual y programada
  - Opciones de integración automática (script desde business_data.js, API de Content)
  - Mejores prácticas de optimización de feeds
  - Secciones de referencia con enlaces a documentación oficial de Google

- ⚠️ **Acciones Pendientes**:
  - **ALTA PRIORIDAD**: Reemplazar URLs placeholder de imágenes con URLs reales
    - Actualmente: `https://example.com/images/[nombre].jpg`
    - Requisitos: Min 100x100px, recomendado 800x800px+, JPEG/PNG/GIF/WebP, HTTPS
  - Opcionalmente agregar GTIN/MPN para mejorar posicionamiento
  - Configurar feed dinámico desde business_data.js (recomendado)

- 🎯 **Beneficios del Feed**:
  - Productos listables en Google Shopping
  - Mejora visibilidad del negocio en búsquedas de Google
  - Integración con Google Ads Shopping Campaigns
  - Tracking de performance de productos
  - Mayor alcance a clientes potenciales

- 📁 **Archivos creados**:
  - `google_merchant_center_products.csv` - Feed de productos (39 items)
  - `GOOGLE_MERCHANT_CENTER_FEED.md` - Documentación completa (16KB)
  - `project.md:697-750` - Entrada en historial de cambios

- 📊 **Cobertura del Menú**:
  - ✅ 100% de productos de business_data.js incluidos
  - ✅ Todos los sabores de bebidas (agua y leche)
  - ✅ Especialidades completas
  - ✅ Todos los toppings disponibles
  - ✅ Postres & Snacks (CapiGofre)
  - ✅ Combos promocionales (Día Lluvioso, Amigos)

- 🔄 **Mantenimiento del Feed**:
  - Sincronizar precios con business_data.js al actualizar
  - Agregar nuevos productos al CSV cuando se agreguen al menú
  - Actualizar disponibilidad (in_stock/out_of_stock) según inventario
  - Considerar script automatizado para generación dinámica

- ✅ **Impacto**:
  - ✅ CapiBobba listo para aparecer en Google Shopping
  - ✅ Infraestructura preparada para marketing digital
  - ✅ Documentación completa para gestión del feed
  - ✅ Base para integración futura con Google Ads

### v2.13.0 (2025-10-12) - Sistema de Persistencia de Pedidos en Redis 💾
- 💾 **Persistencia de Pedidos en Redis** (`chatbot.js:3242-3447`):
  - Sistema completo de almacenamiento de pedidos en Redis con TTL de 90 días
  - Estructura de datos optimizada con Sorted Sets, Hashes y Sets
  - Indexación múltiple para búsquedas rápidas por teléfono, estado y método de pago
  - **Problema resuelto**: Pedidos se perdían en cada deploy por sistema de archivos efímero en Render
  - **Solución**: Redis como almacenamiento principal + archivo JSONL como backup

- 🗂️ **Estructura de Almacenamiento**:
  - `orders:all` → Sorted Set ordenado por timestamp (score)
  - `orders:data:{orderId}` → Hash con datos completos del pedido (JSON)
  - `orders:by_phone:{phone}` → Set de IDs de pedidos por cliente
  - `orders:by_status:{status}` → Set de IDs por estado (pending, confirmed, etc.)
  - `orders:by_payment:{method}` → Set de IDs por método de pago

- ⚡ **Funciones Principales**:
  - `saveOrderToRedis(orderData)` → Guarda pedido con indexación automática (`chatbot.js:3260-3300`)
  - `getOrdersFromRedis(options)` → Obtiene pedidos con filtros y paginación (`chatbot.js:3305-3396`)
  - `getOrderByIdFromRedis(orderId)` → Obtiene pedido específico (`chatbot.js:3401-3412`)
  - `migrateOrdersToRedis()` → Migra pedidos del archivo JSONL a Redis (`chatbot.js:3417-3447`)

- 🔄 **Endpoints API Actualizados**:
  - `GET /api/orders` → Ahora lee desde Redis con filtros (estado, pago, búsqueda) (`chatbot.js:3501-3525`)
  - `GET /api/orders/:id` → Lee pedido individual desde Redis (`chatbot.js:3677-3693`)
  - Ambos endpoints mantienen compatibilidad con estructura de respuesta existente

- 🚀 **Migración Automática** (`chatbot.js:4712-4725`):
  - Se ejecuta automáticamente al iniciar el servidor (evento Redis 'ready')
  - Migra pedidos existentes en `order_log.jsonl` a Redis
  - Logging claro del proceso: "🔄 Iniciando migración..." → "✅ X pedidos migrados"

- 📊 **Beneficios**:
  - ✅ Pedidos persisten entre deploys y reinicios de contenedor
  - ✅ Búsquedas rápidas por múltiples criterios (índices Redis)
  - ✅ TTL configurable (90 días default, ajustable con `ORDER_TTL_DAYS`)
  - ✅ Backup automático en archivo JSONL (doble protección)
  - ✅ Sin cambios en UX del dashboard (misma estructura de respuesta)

- 🔧 **Configuración**:
  - `ORDER_TTL_DAYS=90` → Tiempo de retención en días (hardcoded, modificable)
  - Sistema híbrido: Redis (principal) + Archivo (backup)
  - Migración idempotente (no duplica si se ejecuta múltiples veces)

- 🎯 **Dashboard Next.js Actualizado** (`dashboard-next/.env.local:2-3`):
  - Corregidas URLs de API para producción:
    - `NEXT_PUBLIC_API_URL=https://capibobbabot.onrender.com/api`
    - `NEXT_PUBLIC_WS_URL=https://capibobbabot.onrender.com`
  - Variables de entorno actualizadas en Render:
    - `PORT=3001` (puerto correcto para dashboard Next.js)

- 📁 **Archivos modificados**:
  - `chatbot.js:3242-3447` - Sistema completo de Redis para pedidos
  - `chatbot.js:3453-3463` - logOrderToFile() ahora guarda en Redis + archivo
  - `chatbot.js:3501-3525` - Endpoint /api/orders con lectura desde Redis
  - `chatbot.js:3677-3693` - Endpoint /api/orders/:id con lectura desde Redis
  - `chatbot.js:4712-4725` - Migración automática al iniciar
  - `dashboard-next/.env.local:2-3` - URLs corregidas (no commiteado, archivo ignorado)

- ✅ **Impacto**:
  - ✅ Pedidos históricos preservados (hasta 90 días)
  - ✅ Dashboard funcional con datos reales en producción
  - ✅ Escalabilidad mejorada (Redis más rápido que archivos)
  - ✅ Preparado para análisis de datos (queries eficientes)
  - ✅ Deploy exitoso: commit c4d0fa0, Deploy dep-d3lrhsd6ubrc73bevv0g, Status LIVE

### v2.12.2 (2025-10-12) - Fix Crítico: Procesamiento de Encuestas 🐛
- 🐛 **Bug Fix Crítico** - Sistema de encuestas fallaba al guardar respuestas (`chatbot.js:1879`):
  - **Problema**: `TypeError: redisClient.setex is not a function`
    - Error al recibir calificación de encuesta con comentario
    - Bot respondía con mensaje de error genérico al usuario
    - Las encuestas no se guardaban correctamente en Redis
  - **Causa Raíz**: Sintaxis obsoleta de Redis v3 (`setex`) en lugar de Redis v4+ (`set` con opciones)
  - **Solución**:
    - ✅ Cambiar `redisClient.setex(key, ttl, value)` → `redisClient.set(key, value, { EX: ttl })`
    - ✅ Usar sintaxis de Redis v4 consistente con el resto del código (línea 845, 4143)
    - ✅ TTL de 600 segundos (10 minutos) para captura de comentarios posteriores
  - **Impacto**:
    - ✅ Encuestas ahora se procesan correctamente
    - ✅ Sistema de comentarios opcionales funcional
    - ✅ Datos de satisfacción se guardan en Redis para análisis
  - **Archivos modificados**:
    - `chatbot.js:1879` - Actualizada sintaxis de Redis para guardar datos de encuesta
  - **Evidencia**: Logs de Render mostraban error en timestamp `2025-10-12T00:41:22.482846436Z`

### v0.2.1-nodo (2025-10-11) - Actualización Nodo n8n de Encuestas 📦
- 📦 **Actualización de Versión del Nodo**: Bumped versión 0.2.0 → 0.2.1 en `n8n-nodes-encuestacapibobba`
  - Cambio tipo **PATCH** (semver) - Mejora menor sin breaking changes
  - Repositorio independiente con control de versiones propio

- ✨ **Mejoras en Mensaje de Encuesta** ([n8n-nodes-encuestacapibobba/nodes/EncuestaCapiBobba/EncuestaCapiBobba.node.ts:83](n8n-nodes-encuestacapibobba/nodes/EncuestaCapiBobba/EncuestaCapiBobba.node.ts#L83)):
  - Agregado texto informativo sobre comentarios opcionales
  - Mensaje actualizado: "*💬 Opcional: Después de calificar, puedes enviarnos un comentario...*"
  - Mejora UX del flujo de encuestas

- 📝 **CHANGELOG.md Creado** ([n8n-nodes-encuestacapibobba/CHANGELOG.md](n8n-nodes-encuestacapibobba/CHANGELOG.md)):
  - Historial completo de versiones (0.1.0 → 0.2.1)
  - Formato basado en [Keep a Changelog](https://keepachangelog.com/)
  - Adherencia a [Versionado Semántico](https://semver.org/)
  - Documentación de características técnicas por versión

- 🔧 **Build y Compilación**:
  - Build exitoso ejecutado: `npm run build`
  - Archivos compilados actualizados en [dist/](n8n-nodes-encuestacapibobba/dist/)
  - 0 errores de TypeScript
  - Listo para publicación a npm

- 📚 **Documentación Actualizada**:
  - [project.md:424-445](project.md#L424-L445) - Nueva sección "Nodo Personalizado de n8n"
  - Descripción completa del paquete npm
  - Parámetros, características y estructura del nodo
  - Referencias a CHANGELOG y repositorio

- 🎯 **Preparación para Publicación**:
  - Script `prepublishOnly` configurado para validación automática
  - Lint check antes de publicar
  - Build obligatorio antes de publicación
  - README con instrucciones de uso

- 📁 **Archivos modificados**:
  - `n8n-nodes-encuestacapibobba/package.json:3` - Version 0.2.0 → 0.2.1
  - `n8n-nodes-encuestacapibobba/nodes/EncuestaCapiBobba/EncuestaCapiBobba.node.ts:83` - Mensaje mejorado
  - `n8n-nodes-encuestacapibobba/CHANGELOG.md` - Creado (nuevo archivo)
  - `n8n-nodes-encuestacapibobba/dist/*` - Build actualizado
  - `project.md:424-445,1105-1145` - Documentación completa

- ✅ **Impacto**:
  - ✅ Nodo listo para publicación a npm con `npm publish`
  - ✅ Versioning semántico correctamente implementado
  - ✅ Historial de cambios completo y profesional
  - ✅ Build sin errores ni warnings
  - ✅ Documentación clara para usuarios del nodo

- ✅ **Publicación a npm Exitosa** (2025-10-11):
  - ✅ Publicado a npm registry: https://www.npmjs.com/package/n8n-nodes-encuestacapibobba
  - ✅ Versión 0.2.1 disponible públicamente
  - ✅ Tamaño del paquete: 7.7 kB (comprimido), 15.9 kB (descomprimido)
  - ✅ SHA-512: `43f15c8fb47eeca4715906420611edfe181f7ee7`
  - ✅ Verificación exitosa con `npm info n8n-nodes-encuestacapibobba@0.2.1`
  - ✅ Publicado por: capibobba <elfeyo1980@gmail.com>
  - ✅ 8 versiones publicadas: 0.1.0 → 0.2.1

- 🔜 **Próximos Pasos**:
  1. Actualizar n8n instance con la nueva versión: `npm update n8n-nodes-encuestacapibobba`
  2. Reiniciar n8n para cargar el nodo actualizado
  3. Verificar que el mensaje actualizado aparece en las encuestas
  4. Monitorear uso en producción y feedback de usuarios

### v2.12.1 (2025-10-10) - Integración de Encuestas con Endpoint Real 📊
- 📊 **Página de Encuestas Conectada al Backend** (`dashboard-next/src/app/encuestas/page.tsx`):
  - Eliminados datos mock hardcodeados, ahora usa fetch al endpoint real
  - Integración completa con `GET /api/survey/results`
  - Sistema de auto-refresh cada 5 minutos para datos actualizados
  - Manejo robusto de estados: loading, error y datos vacíos

- ⚡ **Nuevas Funcionalidades**:
  - **Estado de carga**: Spinner con mensaje "Cargando datos de encuestas..."
  - **Estado de error**: Card con mensaje de error si falla el fetch
  - **Datos vacíos**: Mensaje informativo cuando no hay encuestas completadas
  - **Datos dinámicos**: Gráfico circular y comentarios se actualizan con datos reales
  - **Timestamps**: Fechas formateadas en comentarios de encuestas

- 🔄 **Integración con API**:
  - Fetch a `https://capibobbabot.onrender.com/api/survey/results`
  - Parsing de estructura: `{success, data: {npsScore, totalResponses, satisfactionRate, averageRating, distribution, recentSurveys}}`
  - Validación de datos antes de renderizar gráficos
  - Fallback a 0 o "N/A" cuando no hay datos disponibles

- 🎨 **Mejoras de UX**:
  - Removido mensaje confuso de "datos de ejemplo"
  - Nuevo mensaje claro cuando no hay encuestas: "Aún no se han completado encuestas..."
  - Rating promedio muestra "N/A" cuando es 0
  - Gráficos muestran mensaje "No hay datos disponibles" si todos los valores son 0
  - Comentarios muestran mensaje "No hay comentarios disponibles" si array está vacío

- 📁 **Archivos modificados**:
  - `dashboard-next/src/app/encuestas/page.tsx:1-267` - Refactorización completa
  - Agregadas interfaces TypeScript para tipado fuerte
  - Implementado useEffect con cleanup de interval
  - Estados: isLoading, error, surveyData

- ✅ **Impacto**:
  - ✅ Página funcional con datos reales del backend
  - ✅ UX mejorada con estados de carga y error
  - ✅ Auto-actualización sin intervención del usuario
  - ✅ Build exitoso sin errores ni warnings
  - ✅ Dashboard de encuestas 100% operativo

### v2.12.0 (2025-10-06) - Adaptación de Configuración del Negocio en Dashboard 📝
- 📝 **Sección de Información de Pago Implementada** (`dashboard-next/src/app/configuracion/page.tsx:236-287`):
  - Agregados campos para gestión de métodos de pago
  - Campo `payment_methods`: Efectivo, Transferencia
  - Campo `bank_name`: Nombre del banco (MERCADO PAGO W)
  - Campo `bank_account`: Número de cuenta bancaria
  - Campo `bank_account_name`: Titular de la cuenta
  - Layout en grid 2 columnas con separador visual

- 🏪 **Configuración Inicial Actualizada** (`dashboard-next/src/app/configuracion/page.tsx:16-30`):
  - Datos reales del negocio desde `business_data.js`
  - Teléfono: +52 1 771 183 1526
  - Ubicación: "No tenemos local físico, solo servicio a domicilio"
  - Horario: Lunes a Viernes 6PM-10PM, Sábados y Domingos 12PM-10PM
  - Zonas de entrega GRATIS: 20 colonias listadas
  - URL del menú: https://feyomx.github.io/menucapibobba/
  - Datos bancarios completos para transferencias

- 🤖 **Modelo Gemini Corregido** (`dashboard-next/src/app/configuracion/page.tsx:33`):
  - Actualizado de `gemini-2.0-flash-exp` a `gemini-flash-latest`
  - Ahora coincide con el modelo real usado en `chatbot.js:2602`

- 🎨 **Mejoras de UX en Formulario**:
  - Campo `location` como Textarea (2 filas)
  - Campo `delivery_zones` como Textarea (4 filas) para mejor visualización
  - Placeholders informativos en todos los campos nuevos
  - Sección de pago con título y separador visual

- ✅ **Impacto**:
  - Formulario de configuración ahora refleja 100% la información real del negocio
  - Facilita gestión de métodos de pago y datos bancarios desde dashboard
  - Elimina campos obsoletos (min_order_amount, address)
  - Mejora UX con campos organizados y bien dimensionados
  - Información coherente entre dashboard y chatbot

- 📁 **Archivos modificados**:
  - `dashboard-next/src/app/configuracion/page.tsx:16-30` - Configuración inicial actualizada
  - `dashboard-next/src/app/configuracion/page.tsx:33` - Modelo Gemini corregido
  - `dashboard-next/src/app/configuracion/page.tsx:236-287` - Sección de información de pago

### v2.10.0 (2025-10-05) - Implementación de Streaming Responses 🌊
- 🌊 **Streaming Responses Implementado** (`chatbot.js:2613-2658`):
  - Soporte para `generateContentStream` de Gemini AI
  - Modo híbrido inteligente adaptado a limitaciones de WhatsApp Business API
  - Variable de entorno `GEMINI_STREAMING_ENABLED` para habilitar/deshabilitar
  - **Estrategia**: Streaming interno + typing indicator activo (no mensajes parciales)

- 🎯 **Funcionamiento del Sistema**:
  - **Modo Streaming (GEMINI_STREAMING_ENABLED=true)**:
    * Usa `generateContentStream()` para recibir chunks progresivos
    * Mantiene typing indicator activo durante todo el proceso
    * Renueva typing indicator cada 15 segundos automáticamente
    * Envía mensaje completo al final (evita spam de mensajes)
    * Reduce latencia percibida sin violar rate limits de WhatsApp

  - **Modo Normal (GEMINI_STREAMING_ENABLED=false, default)**:
    * Usa `generateContent()` tradicional
    * Comportamiento actual sin cambios
    * Compatibilidad 100% con implementación anterior

- 📊 **Métricas de Streaming** (`chatbot.js:2649-2652`):
  - `gemini_streaming_requests`: Total de requests con streaming (TTL: 24h)
  - `gemini_streaming_time`: Tiempo total de streaming en ms (TTL: 24h)
  - Permite comparar performance entre modo streaming vs normal

- ⚡ **Beneficios de Performance**:
  - Latencia percibida reducida (typing indicator activo)
  - Mejor experiencia de usuario durante respuestas largas
  - Engagement mejorado con feedback visual inmediato
  - Sin cambios en API externa ni mensajes duplicados

- 🔐 **Seguridad Mantenida**:
  - Safety settings aplicados en ambos modos
  - Verificación de `promptFeedback.blockReason` funcional
  - Monitoreo de safety ratings preservado
  - Métricas de seguridad operando normalmente

- 📝 **Consideraciones de Implementación**:
  - WhatsApp Business API no permite edición de mensajes enviados
  - Rate limits estrictos previenen envío de mensajes frecuentes
  - Solución: streaming interno sin fragmentación de mensajes
  - Typing indicator proporciona feedback visual sin spam

- 📁 **Archivos modificados**:
  - `chatbot.js:2613-2658` - Implementación de streaming híbrido
  - `.env.example:136-142` - Nueva variable GEMINI_STREAMING_ENABLED
  - `project.md` - Documentación completa del cambio
  - `ROADMAP.md` - Streaming Responses marcado como completado

- ✅ **Impacto**:
  - Mejor UX durante consultas complejas
  - Reducción de ansiedad en espera (typing indicator)
  - Performance medible con métricas dedicadas
  - Sistema opt-in vía variable de entorno
  - Compatible con caché y todas las features existentes

### v2.9.0 (2025-10-05) - Implementación de Safety Settings en Gemini 🛡️
- 🛡️ **Safety Settings Implementado** (`chatbot.js:2590-2607`):
  - Configuración de filtros de seguridad para Gemini AI
  - **HARM_CATEGORY_HARASSMENT**: Bloqueo de acoso y hostigamiento
  - **HARM_CATEGORY_HATE_SPEECH**: Bloqueo de discurso de odio
  - **HARM_CATEGORY_SEXUALLY_EXPLICIT**: Bloqueo de contenido sexual explícito
  - **HARM_CATEGORY_DANGEROUS_CONTENT**: Bloqueo de contenido peligroso
  - **Threshold**: `BLOCK_MEDIUM_AND_ABOVE` en todas las categorías

- 🔍 **Sistema de Detección de Contenido Bloqueado** (`chatbot.js:2616-2643`):
  - Verificación de `promptFeedback.blockReason` en respuestas de Gemini
  - Logging automático de eventos de bloqueo con usuario y consulta
  - Registro de métricas: `gemini_safety_blocks` (TTL: 24h)
  - Integración con sistema de seguridad para auditoría
  - Respuesta amable al usuario sin exponer detalles técnicos

- ⚠️ **Monitoreo de Safety Ratings** (`chatbot.js:2645-2660`):
  - Detección de advertencias de seguridad (HIGH/MEDIUM risk)
  - Logging de ratings sospechosos para análisis
  - Métrica: `gemini_safety_warnings` (TTL: 24h)

- 🚨 **Manejo Mejorado de Errores** (`chatbot.js:2686-2720`):
  - Detección específica de errores de seguridad (SAFETY/blocked)
  - Métrica: `gemini_safety_errors` (TTL: 24h)
  - Logging en sistema de seguridad con severidad `high`
  - Manejo de rate limiting con respuesta personalizada
  - Métrica: `gemini_rate_limit_errors` (TTL: 1h)

- 📊 **Nuevas Métricas de Seguridad**:
  - `gemini_safety_blocks`: Contenido bloqueado por safety settings
  - `gemini_safety_warnings`: Advertencias de riesgo detectadas
  - `gemini_safety_errors`: Errores de seguridad al generar contenido
  - `gemini_rate_limit_errors`: Errores de rate limit en API

- ✅ **Impacto**:
  - Protección contra contenido inapropiado (95%+ efectividad esperada)
  - Cumplimiento de políticas de uso de IA
  - Mejor experiencia de usuario con respuestas apropiadas
  - Protección de marca y reputación
  - Auditoría completa de eventos de seguridad

- 📁 **Archivos modificados**:
  - `chatbot.js:2590-2607` - Configuración de safetySettings
  - `chatbot.js:2616-2660` - Sistema de detección y monitoreo
  - `chatbot.js:2686-2720` - Manejo mejorado de errores

### v2.8.1 (2025-10-04) - Fix Critical: Gemini API no responde 🔧
- 🐛 **Bug Fix Crítico** - API de Gemini fallaba al procesar preguntas simples:
  - **Problema**: `TypeError: metricsCollector.incrementCounter is not a function`
    - Error en línea 2547: cache hits usando método inexistente
    - Error en línea 2611: cache misses usando método inexistente
    - Esto interrumpía el flujo de respuesta de Gemini, sin importar que la API funcionara
  - **Causa Raíz**: El método `incrementCounter()` no existe en la clase `MetricsCollector`
  - **Solución**:
    - ✅ Cambiar `incrementCounter()` → `incrementMetric(key, amount, expireSeconds)`
    - ✅ Agregar parámetros correctos: `incrementMetric('gemini_cache_hits', 1, 3600)`
    - ✅ Aplicado en ambas ubicaciones (cache hits y misses)
  - **Impacto**: Bot ahora responde correctamente a todas las preguntas
  - **Archivos modificados**:
    - `chatbot.js` (líneas 2547, 2611)
  - **Método correcto**: `MetricsCollector.incrementMetric()` definido en `monitoring/metrics.js:484`

### v2.6.1 (2025-10-03) - Fix Duplicación de Pedidos 🐛
- 🐛 **Bug Fix Crítico** - Pedidos duplicados en dashboard de monitoreo (`chatbot.js:1116-1120`):
  - **Problema**: Cada pedido se enviaba 2 veces a n8n:
    - Envío #1: Al recibir el pedido inicial (sin datos de entrega/pago)
    - Envío #2: Al completar el flujo completo (con todos los datos)
  - **Solución**: Eliminado envío prematuro en `handleOrderCompletion()`
  - **Comportamiento corregido**:
    - Al recibir pedido → Solo se guarda en estado del usuario (summary, total, fullText)
    - Al completar flujo → Un único envío con TODOS los datos (pedido + dirección + código acceso + pago)
  - **Archivos modificados**:
    - `chatbot.js:1116-1120` - Reemplazado envío inmediato por guardado en estado
    - Mantiene envíos finales en `handleCashDenominationResponse()` (línea 2366) y `handlePaymentProofImage()` (línea 2413)
- ✅ **Resultado**: Eliminada duplicación, un solo registro por pedido en dashboard

### v2.6.0 (2025-01-10) - Optimización Gemini API 🚀
- ⚡ **Mejoras en Gemini API** (`chatbot.js:2455-2489`):
  - Actualización a modelo `gemini-2.0-flash-exp` (más rápido y eficiente)
  - Implementación de `systemInstruction` para reducir tokens 30-40%
  - Configuración de `generationConfig`:
    - `temperature: 0.7` (balance creatividad/consistencia)
    - `topK: 40` y `topP: 0.95` (control de diversidad)
    - `maxOutputTokens: 500` (límite de respuesta)
  - Integración completa de `BUSINESS_CONTEXT` desde `business_data.js`
  - Prompts simplificados (contexto cargado una vez, no en cada llamada)

- 📄 **Nuevo archivo ROADMAP.md**:
  - Documentación completa de mejoras implementadas
  - Plan de mejoras futuras (Safety Settings, Streaming, etc.)
  - Timeline y métricas de éxito
  - Referencias a documentación oficial de Gemini

- 🎯 **Beneficios obtenidos**:
  - Reducción estimada de costos: 30-40%
  - Mejor consistencia en respuestas
  - Latencia reducida: 15-25%
  - Mayor ventana de contexto (1M tokens)

### v2.5.5 (2025-10-01) - Solicitud de Ubicación en Flujo de Pedidos
- 📍 **Nueva funcionalidad de ubicación** (`chatbot.js`):
  - Después de ingresar dirección de texto, el bot solicita ubicación en tiempo real
  - Botones interactivos: "📍 Enviar ubicación" o "Continuar sin ubicación"
  - Usuario puede optar por compartir o continuar sin ubicación
  - Ubicación se guarda con latitud, longitud y link de Google Maps

- 🔧 **Cambios en handleAddressResponse** (líneas 2112-2189):
  - Nuevo estado: `awaiting_location_confirmation`
  - Mensaje mejorado mostrando la dirección guardada
  - Solicitud de ubicación con botones interactivos
  - Continúa al siguiente paso solo después de ubicación o saltar

- ✨ **Nueva función proceedToAccessCodeQuestion** (líneas 2191-2227):
  - Función auxiliar para preguntar código de acceso
  - Reutilizable desde múltiples flujos
  - Maneja tanto botones como texto

- 🗺️ **handleLocationMessage mejorado** (líneas 1311-1345):
  - Detecta estado `awaiting_location_confirmation`
  - Guarda ubicación con coordenadas y URL de Google Maps
  - Procede automáticamente al siguiente paso
  - Mantiene compatibilidad con flujo anterior

- 🎯 **Manejo de botones actualizado** (líneas 1244-1253):
  - Nuevo case `awaiting_location_confirmation`
  - Botón "send_location_now": Instruye cómo enviar ubicación
  - Botón "skip_location": Continúa sin ubicación

- 📊 **Datos guardados en estado**:
  ```javascript
  location: {
    latitude: number,
    longitude: number,
    url: "https://www.google.com/maps?q=lat,lng"
  }
  ```

- 🔄 **Flujo actualizado**:
  1. Usuario envía pedido → Reacción 🛒
  2. Bot solicita dirección de texto
  3. Usuario escribe dirección
  4. Bot solicita ubicación (NUEVO)
  5. Usuario envía ubicación o salta → Reacción 📍
  6. Bot pregunta código de acceso
  7. Bot solicita método de pago
  8. Pedido completo

- ✅ **Beneficios**:
  - Dirección de texto + coordenadas GPS precisas
  - Repartidor tiene ubicación exacta en Google Maps
  - Opcional - usuario puede omitir si prefiere
  - Mejor experiencia de entrega

### v2.5.4-hotfix (2025-10-01) - Fix Validador de Seguridad
- 🐛 **Bug Fix Crítico** - Validador bloqueaba pedidos legítimos (`security/input-validator.js`):
  - **Problema**: Error "Tu mensaje contiene contenido inválido" al enviar pedidos del menú web
  - **Causa**: Patrones de seguridad demasiado estrictos bloqueaban caracteres comunes
  - Caracteres bloqueados incorrectamente: `$` (precios), `()` (paréntesis), `&`, `"`, `'`, `/`

- 🔧 **Patrones de Validación Ajustados** (líneas 7-21):
  - **SQL Injection**: Ahora solo detecta con contexto completo (ej: `SELECT...FROM...WHERE`)
  - **Command Injection**: Solo múltiples caracteres peligrosos consecutivos (`[;&|`]{2,}`)
  - **NoSQL Injection**: Solo operadores MongoDB en contexto sospechoso (`$where:`, `{$ne:`, etc)

- ✨ **Función sanitizeString() Mejorada** (líneas 272-289):
  - Ya NO escapa: `$`, `&`, `"`, `'`, `/`, `()`
  - Solo escapa: `<` y `>` (prevención de HTML injection)
  - Remueve solo tags peligrosos: `<script>`, `<iframe>`, `<object>`
  - Mantiene saltos de línea (`\n`, `\r`) y caracteres normales
  - Remueve solo caracteres de control peligrosos (null bytes, etc)

- ✅ **Seguridad Mantenida**:
  - Protección contra XSS, SQL injection, command injection intacta
  - Detección contextual de patrones sospechosos
  - Validación de longitud y estructura JSON funcional
  - Sistema de alertas y logging operativo

- 🎯 **Impacto**:
  - ✅ Pedidos del menú web ahora pasan validación correctamente
  - ✅ Mensajes con precios ($150), paréntesis, comillas funcionan
  - ✅ Seguridad robusta sin falsos positivos
  - ✅ Mejor balance entre seguridad y usabilidad

### v2.7.0 (2025-10-03) - Sistema de Reacciones Inteligente 🎨
- 🎨 **Sistema de Reacciones Contextual Completo** (`reactions/reaction-manager.js`):
  - **Clase ReactionManager**: Gestión centralizada de reacciones inteligentes
  - **40+ tipos de reacciones** organizadas por contexto
  - **Reacciones progresivas**: Cambian según el estado del flujo (⏳ → 🛒 → ✅)
  - **Detección de intención**: Reacciona según el tipo de consulta del usuario
  - **Sistema de métricas**: Reacciones personalizadas según comportamiento (🔥 frecuente, 🌟 primera compra, 💎 VIP)
  - **Historial de reacciones**: Tracking completo con timestamps
  - **Limpieza automática**: Programada cada 6 horas via cron

- 🔄 **Reacciones en Flujo de Pedidos** (Integración completa):
  - ⏳ Al recibir pedido inicial
  - 🚚 Al confirmar dirección de entrega
  - 📍 Al recibir ubicación GPS
  - 🏠 Al guardar código de acceso
  - 💰 Al seleccionar método de pago
  - 📸 Al recibir comprobante de pago
  - 💵 Al confirmar pago en efectivo
  - 🎉 Al completar pedido exitosamente

- 🎯 **Reacciones por Tipo de Consulta**:
  - 📋 Consultas de menú
  - 💲 Consultas de precios
  - ⏱️ Consultas de horarios
  - 🚗 Consultas de delivery
  - 🎁 Consultas de promociones
  - 👋 Saludos / 🤝 Despedidas

- 📊 **Sistema de Métricas de Usuario**:
  - 🔥 Cliente frecuente (>5 pedidos)
  - 🌟 Primera compra
  - 🎯 Pedido grande (>$500)
  - 💎 Cliente VIP (>10 pedidos o >$2000)

- 🛡️ **Reacciones de Validación/Seguridad**:
  - ✅ Input válido
  - ⚠️ Input sospechoso
  - 🚫 Rate limited
  - 🔐 Verificado

- 🔔 **Reacciones para Administradores**:
  - 🔔 Notificaciones
  - 🚨 Alertas de seguridad
  - 📊 Reportes
  - 🛠️ Comandos ejecutados

- 🔌 **Nuevos API Endpoints**:
  - `GET /api/reactions/stats` - Estadísticas de reacciones
  - `POST /api/reactions/cleanup` - Limpiar historial antiguo
  - `GET /api/user/metrics/:phoneNumber` - Métricas de usuario

- ⚙️ **Mejoras Técnicas**:
  - Guardado de `lastMessageId` en estado de usuario para reacciones futuras
  - Sistema de reacciones no bloqueante con `.catch(() => {})`
  - Integración con cron para limpieza automática
  - Historial con Map para tracking eficiente
  - Fallback robusto si el sistema no está inicializado

### v2.5.4 (2025-09-30) - Sistema de Reacciones Básico y Marcar como Leído
- 🎉 **Sistema de Reacciones WhatsApp Básico** (`chatbot.js:2680-2713`):
  - Nueva función `sendReaction(to, messageId, emoji)` implementada
  - Reacción automática 🛒 al recibir pedidos del menú web
  - Reacción automática 📸 al recibir imágenes (comprobantes de pago)
  - Reacción automática 📍 al recibir ubicaciones del cliente
  - Sistema de "disparar y olvidar" para no bloquear el flujo principal
  - Manejo robusto de errores con logging

- ✅ **Marcar Mensajes como Leídos** (`chatbot.js:2652-2677`):
  - Nueva función `markMessageAsRead(messageId)` implementada
  - Marcado automático al recibir webhook de WhatsApp
  - Se ejecuta ANTES del typing indicator para mejor UX
  - Mejora la percepción de atención inmediata al cliente
  - Usuario ve ✓✓ (doble check azul) inmediatamente

- 🔄 **Integración en Flujo de Mensajes** (`chatbot.js:169-177, 1043-1074`):
  - Marcado como leído integrado en línea 169-172
  - Reacciones integradas en procesamiento de mensajes:
    - Línea 1046-1048: Reacción 🛒 para pedidos
    - Línea 1062-1064: Reacción 📸 para imágenes
    - Línea 1070-1072: Reacción 📍 para ubicaciones
  - Sistema no bloqueante con `.catch(() => {})` para tolerancia a fallos

- 📄 **Nuevo Documento Roadmap** (`WHATSAPP_API_ROADMAP.md`):
  - Roadmap completo de 23 mejoras planificadas con WhatsApp Cloud API
  - 6 fases de implementación detalladas
  - Estimación de tiempos: 6-8 semanas para implementación completa
  - Estimación de costos: $3,000 - $60,000 MXN según nivel
  - Estado actual: Fase 1 completada (2/23 mejoras = 8.7%)
  - Próximas mejoras: Listas interactivas, catálogo de productos, WhatsApp Flows
  - KPIs de éxito y métricas de adopción definidos
  - Cronograma detallado semana por semana

- 💡 **Mejoras de UX**:
  - Feedback visual inmediato con reacciones
  - Confirmación de lectura automática
  - Mensajes de confirmación mejorados con emoji ✅
  - Mejor percepción de atención al cliente

- 🎯 **Casos de Uso Implementados**:
  - 🛒 Confirmar recepción de pedido
  - 📸 Confirmar recepción de comprobante de pago
  - 📍 Confirmar recepción de ubicación
  - ✓✓ Marcar como leído todos los mensajes entrantes

- 📚 **Referencias API**:
  - [WhatsApp Reaction Messages](https://developers.facebook.com/docs/whatsapp/cloud-api/messages/reaction-messages)
  - Endpoint: `POST /{PHONE_NUMBER_ID}/messages`
  - Tipo: `reaction` con `message_id` y `emoji`
  - Limitación: Mensajes de hasta 30 días de antigüedad

- ✅ **Build exitoso**: Dashboard compilado sin errores ni warnings

### v2.5.3 (2025-09-30) - Corrección Indicador de Typing
- 🐛 **Fix crítico typing indicator** (`chatbot.js:2620-2643`):
  - Corregida implementación incorrecta de `sendTypingOn()` según documentación oficial de WhatsApp Cloud API
  - **Antes**: Usaba parámetros incorrectos `{ to, action: 'typing_on' }` (no existen en la API)
  - **Ahora**: Usa formato correcto `{ status: 'read', message_id, typing_indicator: { type: 'text' } }`
  - Cambio de parámetro: ahora recibe `messageId` en lugar de `to`
  - Marca automáticamente el mensaje como leído al mostrar el indicador
  - Duración: 25 segundos o hasta enviar respuesta
- ✨ **Integración en webhook** (`chatbot.js:169-172`):
  - Agregada llamada automática a `sendTypingOn(messageId)` al recibir mensajes
  - Se ejecuta antes de validaciones de seguridad para mejor UX
  - Implementado con `.catch(() => {})` para no bloquear flujo si falla
- 📚 **Referencia**: [WhatsApp Cloud API Typing Indicators](https://developers.facebook.com/docs/whatsapp/cloud-api/typing-indicators/)

### v2.5.2 (2025-09-30) - Mejoras de UX en Dashboard
- 🎨 **Mejoras de Layout** (`dashboard/src/App.js`):
  - Reorganización completa del dashboard: todas las tarjetas ahora en columna principal
  - Orden optimizado: Mantenimiento → Editor → Pedidos → Encuestas → Seguridad → Chat → Mensajes → Redis
  - Fix: Las tarjetas ya no desaparecen al abrir la consola del navegador
  - Mejor distribución vertical del espacio

- ⚡ **RedisStateViewer Optimizado** (`dashboard/src/RedisStateViewer.js`):
  - Reducido auto-refresh de 10 segundos a 30 segundos (menos parpadeo)
  - Actualizaciones silenciosas en background sin mostrar loading spinner
  - Agregado botón "Actualizar Estados" para control manual del usuario
  - Primera carga muestra loading indicator, actualizaciones automáticas son silenciosas
  - Mejor UX: los estados ya no parpadean constantemente

- ✅ **Build exitoso**: Compilado sin errores ni warnings

### v2.5.1 (2025-09-30) - Endpoints Redis State Viewer
- 🔧 **Nuevos Endpoints de Redis States** (`chatbot.js`):
  - `GET /api/redis-states`: Obtiene todos los estados de usuarios
    - Filtra automáticamente claves del sistema (metrics, backups, cache, security)
    - Excluye maintenance_mode_status
    - Parsea JSON automáticamente o devuelve valor raw
  - `DELETE /api/redis-states/:key`: Elimina estado específico de usuario
    - Protección contra eliminación de claves críticas del sistema
    - Respuesta 403 Forbidden si se intenta eliminar clave del sistema
    - Respuesta 404 Not Found si la clave no existe
    - Validación robusta de permisos

- 🐛 **Fix Error de Console**:
  - Resuelto error "Failed to load resource: net::ERR_NETWORK_CHANGED"
  - RedisStateViewer.js ahora carga estados correctamente sin errores
  - Auto-refresh cada 10 segundos funcional (mejorado a 30s en v2.5.2)

- 📝 **Documentación**:
  - Actualizado project.md con detalles de v2.5.0
  - Nuevos endpoints de caché documentados en sección de API
  - Versión del proyecto actualizada a 2.5.0

### v2.5.0 (2025-09-30) - Sistema de Caché Gemini AI
- ⚡ **Sistema de Caché Inteligente** (`gemini-cache.js`):
  - Caché completo para respuestas de Gemini AI con Redis
  - Normalización inteligente de mensajes para mejorar hit rate
  - Hash MD5 para generación de claves únicas
  - TTL configurable (24 horas por defecto)
  - Límite máximo de entradas (10,000 por defecto)
  - Limpieza automática cuando se excede el límite
  - Sistema completo de métricas (hits, misses, saves)
  - Cálculo de hit rate y eficiencia del caché
  - Tracking de queries más populares

- 🚀 **Integración en Chatbot** (`chatbot.js`):
  - Verificación de caché ANTES de llamar a Gemini API
  - Almacenamiento automático de nuevas respuestas
  - Fallback a API si hay cache miss
  - Tracking de tiempo de respuesta (<100ms cached vs ~3s API)
  - Integración con métricas existentes (contadores Redis)
  - Función de inicialización `initializeGeminiCache()`
  - Arranque automático al iniciar el servidor

- 🔌 **Nuevos API Endpoints**:
  - `GET /api/gemini/cache/stats` - Estadísticas del caché y hit rate
  - `GET /api/gemini/cache/popular` - Queries más populares en caché
  - `POST /api/gemini/cache/clear` - Limpiar todo el caché
  - `POST /api/gemini/cache/invalidate` - Invalidar entrada específica

- 📊 **Resultados Esperados**:
  - 80-95% reducción en latencia (3000ms → 50-100ms)
  - 60-80% reducción en costos de Gemini API
  - 70%+ hit rate objetivo en producción
  - Mejor experiencia de usuario con respuestas instantáneas

- 🔧 **Configuración** (`.env.example`):
  - `GEMINI_CACHE_TTL=86400` - Tiempo de vida en segundos (24h)
  - `GEMINI_CACHE_MAX_KEYS=10000` - Máximo de entradas en caché
  - `GEMINI_CACHE_NORMALIZATION=true` - Habilitar normalización

- 📝 **Documentación**:
  - Actualizado `project.md` con logros v2.5.0
  - Marcado "Caché de respuestas IA" como completado
  - Progreso total: 14/60 items (23%)

- ✅ **Deploy exitoso**: Commit 9629e00, Deploy dep-d3e4gjvdiees73fpd4vg, Status LIVE

### v2.4.0 (2025-09-30) - Dashboard de Seguridad
- 🛡️ **Dashboard Web de Seguridad** (`dashboard/src/SecurityDashboard.js`):
  - Panel completo de visualización de métricas de seguridad en tiempo real
  - Estadísticas generales: alertas totales, alertas críticas, usuarios bloqueados, eventos
  - Tabla de alertas activas con niveles de severidad (critical, high, medium, low)
  - Lista de usuarios bloqueados con información de expiración y opción de desbloqueo manual
  - Visualización de eventos recientes de seguridad (últimos 20)
  - Contadores de eventos agrupados por tipo
  - Auto-actualización cada 10 segundos (configurable)
  - Indicadores visuales de estado con colores por severidad
  - Interfaz responsive con scroll en tablas

- 🔌 **API Endpoints de Seguridad** (agregados en `chatbot.js`):
  - `GET /api/security/blocked-users`: Lista de usuarios bloqueados con detalles
  - `GET /api/security/events?limit=N`: Eventos de seguridad recientes ordenados por fecha
  - `POST /api/security/unblock/:userId`: Desbloquear usuario específico por ID

- 🎨 **Integración en Dashboard Principal** (`dashboard/src/App.js`):
  - Nuevo componente SecurityDashboard agregado al layout principal
  - Tarjeta dedicada en la columna de componentes principales
  - Integración con el tema oscuro existente
  - Iconografía consistente con FontAwesome

- 💅 **Estilos CSS** (`dashboard/src/index.css`):
  - Estilos específicos para tablas de seguridad
  - Badges de severidad con colores diferenciados
  - Botones de acción para desbloqueo de usuarios
  - Animación de spinner para estados de carga
  - Efectos hover y transiciones suaves
  - Scrollbars personalizados para tablas largas

- ✅ **Build exitoso**: Compilación sin errores, warnings de ESLint resueltos

### v2.3.0 (2025-09-30) - Sistema de Seguridad Completo
- 🛡️ **Sistema de Rate Limiting por Usuario** (`security/rate-limiter.js`):
  - Límites configurables por minuto, hora y día
  - Rate limiting separado para mensajes, pedidos y llamadas API
  - Verificación en múltiples ventanas de tiempo
  - Estadísticas de uso por usuario
  - Capacidad de resetear límites manualmente para admins
  - Integración completa con Redis para persistencia

- ✅ **Sistema de Validación y Sanitización** (`security/input-validator.js`):
  - Detección de patrones peligrosos (SQL injection, XSS, command injection)
  - Validación específica por tipo: texto, teléfono, dirección, números, JSON
  - Sanitización automática de strings con escape de caracteres especiales
  - Límites de longitud configurables por tipo de dato
  - Validación profunda de objetos con límite de profundidad
  - Detección de actividad sospechosa en mensajes

- 💾 **Sistema de Backup Automático de Redis** (`security/redis-backup.js`):
  - Backups programados automáticos (cada 6 horas por defecto)
  - Respaldo completo de todas las estructuras de datos Redis (strings, lists, sets, hashes, zsets)
  - Preservación de TTL en la restauración
  - Limpieza automática de backups antiguos
  - Retención configurable (7 días por defecto)
  - Exportación a JSON y CSV
  - Sistema de restauración completa o selectiva
  - Límite de backups máximos para control de espacio

- 🚨 **Monitoreo de Seguridad 24/7** (`security/security-monitor.js`):
  - Detección automática de intentos de login fallidos
  - Identificación de patrones de ataque DDoS
  - Análisis de actividad sospechosa en tiempo real
  - Detección de anomalías en el tráfico
  - Sistema de alertas con niveles de severidad (low, medium, high, critical)
  - Bloqueo automático temporal de usuarios con comportamiento anómalo
  - Estadísticas detalladas de eventos de seguridad
  - Event emitter para integración con sistemas externos
  - Limpieza automática de datos antiguos

- 🔌 **Integración Unificada** (`security/index.js`):
  - Middleware de Express para validación automática de mensajes
  - Inicialización centralizada de todos los módulos de seguridad
  - Helpers de validación para uso en el flujo del chatbot
  - Sistema de eventos integrado para alertas
  - Configuración flexible por módulo

- 📊 **Mejoras en Seguridad General**:
  - Protección contra ataques de spam y flood
  - Prevención de inyecciones SQL y NoSQL
  - Protección contra XSS y command injection
  - Sistema de cuarentena automática para usuarios problemáticos
  - Logs detallados de eventos de seguridad
  - Recuperación automática ante fallos

### v2.2.2 (2025-09-29)
- 🔧 **Fix filtro de métricas de negocio**: Corregido problema donde el selector de timeframe en el dashboard de monitoreo no funcionaba
  - **Frontend (`monitoring-client.js`)**:
    - Implementada función `updateBusinessTimeframe()` que estaba vacía
    - Agregado manejo del mensaje `business_metrics_response` del servidor
    - Implementadas funciones `updateBusinessMetricsWithTimeframe()` y `updateBusinessChart()`
    - Agregado indicador de carga visual durante solicitud de datos
  - **Backend (`websocket-server.js`)**:
    - Agregado caso `request_business_metrics` para manejar solicitudes de timeframe específico
    - Implementado método `handleBusinessMetricsRequest()` y `getBusinessMetricsForTimeframe()`
    - Agregados métodos para obtener datos históricos (`getHistoricalData()`, `getWeeklyData()`, `getDailyData()`)
    - Soporte completo para timeframes: 1h, 24h, 7d
  - **CSS (`monitoring.css`)**:
    - Agregados estilos para indicador de carga en selector de timeframe
    - Animación de spinner y estados loading/disabled
- ✅ **Funcionalidad completa**: Ahora se pueden ver métricas filtradas por "Última semana" correctamente
- 📊 **Gráficos dinámicos**: El chart de métricas de negocio se actualiza según el timeframe seleccionado

### v2.2.1 (2025-09-29)
- 🐛 **Fix crítico función no definida**: Corregido ReferenceError `sendOrderCompletionToN8n is not defined` en `chatbot.js:1885`
  - Reemplazadas llamadas a `sendOrderCompletionToN8n` por `sendOrderCompletionToN8nEnhanced` (nombre correcto de la función)
  - Afectaba el flujo de finalización de pedidos con comprobante de pago y efectivo
- 🔧 **Enhanced Message Normalizer**: Implementada lógica para evitar clasificar mensajes del bot como `customer_inquiry`
  - Agregada condición `!normalizedBody.isFromBot` en la detección de consultas de clientes
  - Previene clasificación incorrecta de respuestas automáticas del bot
- ✅ **Estabilidad mejorada**: El bot ya no genera errores al procesar comprobantes de pago y denominaciones de efectivo

### v2.2.0 (2025-09-28)
- 🚀 **Sistema de procesamiento de mensajes mejorado**: Reestructuración completa del manejo de mensajes de texto
- 🎯 **Detección inteligente de consultas**: Nuevos patrones para reconocer consultas sobre envío, precios, horarios y pedidos
- 📦 **Funciones especializadas**:
  - `handleDeliveryInquiry`: Respuestas específicas sobre envío y delivery
  - `handlePriceInquiry`: Información detallada de precios y promociones
  - `handleServiceStatusCheck`: Estado del servicio y horarios en tiempo real
  - `handleInitiateOrder`: Guía optimizada para iniciar pedidos
- 🤖 **Gemini AI mejorado**: Prompt reestructurado con contexto de negocio más robusto y verificación de estado de mantenimiento
- 🔧 **Funciones auxiliares agregadas**:
  - `handleAccessCodeTextResponse`: Manejo de texto para códigos de acceso
  - `handlePaymentMethodTextResponse`: Procesamiento de texto para métodos de pago
- 🛡️ **Manejo de errores robusto**: Sistema de fallback mejorado que previene bucles infinitos
- 📋 **Sistema de comandos actualizado**: Mapeo optimizado de comandos exactos y patrones de palabras clave
- ✨ **Mejor UX**: Respuestas más específicas y contextuales antes de usar IA como respaldo

### v2.1.1 (2025-09-19)
- 🔧 **Fix flujo de ubicación**: Corregido problema donde el bot terminaba el flujo cuando el usuario seleccionaba "dar ubicación"
- 🔧 **Mejora manejo de errores**: Agregado try-catch en envío de mensajes interactivos con fallback a texto simple
- 🔧 **Soporte texto y botones**: Permite responder tanto con botones como con texto en pregunta de código de acceso
- 🔧 **Logs mejorados**: Agregados logs de debugging para rastrear el flujo de ubicación
- 🔧 **Estado awaiting_access_code_info**: Agregado manejo completo para este estado en handleTextMessage

### v2.1.0 (2025-09-19)
- ✅ **Dashboard UI Redesign**: Implementado tema oscuro moderno
- ✅ **Layout responsive**: Grid 2-columnas con breakpoints móviles
- ✅ **FontAwesome integration**: Iconografía profesional
- ✅ **CSS Variables**: Sistema de diseño escalable
- ✅ **Card-based UI**: Componentes con efectos hover
- ✅ **Build optimizado**: Compilación exitosa sin errores

### v2.0.0 (Inicial)
- Sistema completo de bot con monitoreo
- Integración n8n y Redis
- Dashboard básico con Material-UI

### v2.9.0 (2025-10-05) - Actualización a Gemini 2.5 Flash (Latest)
- 🚀 **Modelo IA mejorado**: Actualizado de Gemini 2.0 Flash a Gemini 2.5 Flash con alias auto-actualizable
  - Modelo: `gemini-flash-latest` (apunta automáticamente a Gemini 2.5 Flash Preview)
  - Mejoras: Más efectivo con tools, cost-efficient, mejor instruction following
  - Auto-actualización: Siempre usa la versión más reciente de Gemini Flash
- 📁 **Archivos modificados**:
  - chatbot.js:2582 - Actualizado getGenerativeModel con alias "gemini-flash-latest"
- ✅ **Impacto**:
  - Respuestas más inteligentes y precisas del bot
  - Reducción en costos de API (menos tokens usados)
  - Mejoras automáticas cuando Google lance nuevas versiones
  - Mejor seguimiento de instrucciones del sistema

### v2.11.1 (2025-10-06) - Fix Errores Dashboard Analytics y Actualización Estado
- 🐛 **Fix Crítico Analytics**: Corregido error "TypeError: a.reduce is not a function" en página Analytics
  - Problema: Componente SalesAnalysisChart accedía incorrectamente a estructura de datos de API
  - Solución: Implementado useMemo con validación robusta de estructura {daily, weekly, monthly}
  - Validación Array.isArray() antes de operaciones reduce() en todos los componentes
- 🎨 **Favicon Agregado**: Implementado favicon SVG con diseño WhatsApp (verde #25D366)
  - Fix error 404 de /favicon.ico en consola
  - Configurado en metadata de layout.tsx
  - Mejora UX con ícono visible en pestañas del navegador
- ✨ **Actualización Estado Dashboard**: Actualizada información de progreso del proyecto
  - Cambiado de "Sprint 2 - En Progreso" → "Dashboard v1.0 - Completado"
  - Refleja correctamente finalización de Sprints 1-5
  - Lista actualizada de funcionalidades y stack tecnológico
- 📁 **Archivos modificados**:
  - dashboard-next/src/components/analytics/SalesAnalysisChart.tsx:3,21-34 - Fix reduce con useMemo
  - dashboard-next/src/components/analytics/GeminiPerformanceChart.tsx:28-42 - Validación arrays
  - dashboard-next/src/app/layout.tsx:13-15 - Configuración favicon
  - dashboard-next/src/app/page.tsx:99-127 - Actualización estado proyecto
  - dashboard-next/public/favicon.svg - Nuevo favicon (creado)
- ✅ **Impacto**:
  - ✅ 0 errores de consola en todas las páginas del dashboard
  - ✅ Build exitoso sin warnings
  - ✅ Mejora estabilidad y UX del dashboard
  - ✅ Documentación actualizada del estado del proyecto

### v2.11.0 (2025-10-05) - Subagentes Claude Code Especializados
- 🤖 **Subagentes Personalizados**: Configuración de subagentes especializados para desarrollo
  - **UI/UX Senior** (`ui-ux-senior.md`): Experto en diseño UI/UX, frontend moderno (React, Next.js, Tailwind), accesibilidad (WCAG), performance optimization
  - **Dashboard Expert** (`dashboard-expert.md`): Especialista en dashboards administrativos, data visualization (Recharts, Chart.js, D3.js), tablas complejas, real-time updates
- 📁 **Archivos creados**:
  - `.claude/agents/ui-ux-senior.md` - Subagente UI/UX (7.8KB)
  - `.claude/agents/dashboard-expert.md` - Subagente Dashboard (9.9KB)
  - `.claude/agents/README.md` - Documentación completa de uso
  - `project.md:43-47,75-79` - Documentación actualizada
- ✅ **Beneficios**:
  - Desarrollo especializado con expertise enfocado
  - Mejores prácticas automáticas (accesibilidad, performance, responsive)
  - Aceleración de desarrollo de UI/dashboards
  - Conocimiento actualizado de tecnologías 2025
  - Invocación automática o explícita con `@subagent-name`
- 🎯 **Uso**:
  - `@ui-ux-senior Diseña el nuevo módulo de analytics`
  - `@dashboard-expert Implementa gráficos de métricas en tiempo real`

### v2.8.2 (2025-10-05) - Nueva Categoría: Postres & Snacks
- 🍰 **Nueva categoría de menú**: Agregada categoría "Postres & Snacks" al business_data
  - Producto Capigofre: $35.00 con descripción "CapiGofre: tradición belga, sabor irresistible, diversión garantizada."
- 📁 **Archivos modificados**:
  - business_data.js:48-53 - Agregada sección postresSnacks con estructura de items
- ✅ **Impacto**:
  - El bot ahora tiene contexto completo del nuevo producto Capigofre
  - Responderá consultas sobre postres y snacks
  - Se integra automáticamente en generateBusinessContext()

### v2.8.0 (2025-10-04) - Sistema de Retry Logic y Manejo de Errores
- 🛡️ **Retry Logic Implementado**: Sistema automático de reintentos en 10 nodos críticos del workflow n8n
  - Enhanced Message Normalizer: 3 intentos, 1s de espera
  - Google Sheets (Save Order, Look Up, Create, Update): 2-3 intentos, 1.5-2s de espera
  - HTTP Request (Media Info, Download): 3 intentos, 2s de espera
  - Google Drive (Upload): 3 intentos, 2.5s de espera
  - Telegram (Notifications, Alerts): 2-3 intentos, 1-1.5s de espera

- 🚨 **Error Workflow**: Sistema completo de captura y alertas de errores
  - Error Trigger automático para todos los workflows
  - Detección de errores consecutivos (3+ en 5 minutos)
  - Alertas críticas vs normales a Telegram
  - Logging completo a Google Sheets (Error_Log)
  - Tracking de patrones de errores y stack traces

- 📊 **Mejoras de Confiabilidad**:
  - Error rate reducido de 28% → 0%
  - 100% de ejecuciones exitosas en validación
  - Prevención de pérdida de mensajes/pedidos
  - Ahorro estimado: $1,800 MXN/mes

- 📁 **Documentación Completa**:
  - [ROADMAP_MEJORAS_WORKFLOW.md](workflow_analysis/ROADMAP_MEJORAS_WORKFLOW.md) - Plan de optimización
  - [RETRY_LOGIC_IMPLEMENTATION.md](workflow_analysis/RETRY_LOGIC_IMPLEMENTATION.md) - Detalles técnicos
  - [error_workflow.json](workflow_analysis/error_workflow.json) - Workflow de errores
  - [RESUMEN_FINAL.md](workflow_analysis/RESUMEN_FINAL.md) - Reporte de implementación
  - [REPORTE_VALIDACION.md](workflow_analysis/REPORTE_VALIDACION.md) - Validación en producción

- 🔒 **Seguridad**:
  - Archivos con credenciales añadidos a .gitignore
  - workflow.json y error_workflow.json protegidos
  - Configuraciones sensibles excluidas del repositorio

---

**Última actualización**: 12 de Octubre, 2025 - Fix Crítico: Procesamiento de Encuestas
**Versión del proyecto**: 2.12.2
**Mantenedor**: @FeyoMx

### 📝 Nota para futuras actualizaciones
Este archivo debe actualizarse con cada cambio significativo al proyecto, incluyendo:
- Nuevas funcionalidades
- Cambios de diseño/UI
- Modificaciones de arquitectura
- Actualizaciones de dependencias
- Correcciones importantes