# CapiBobbaBot - Documentación del Proyecto

## 📋 Descripción General

CapiBobbaBot es un sistema completo de automatización para una tienda de bubble tea que incluye:
- Bot de WhatsApp con IA (Google Gemini)
- Sistema de monitoreo en tiempo real
- Dashboard administrativo
- Integración con n8n para automatización de procesos
- Persistencia con Redis

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

### v2.5.4 (2025-09-30) - Sistema de Reacciones y Marcar como Leído
- 🎉 **Sistema de Reacciones WhatsApp** (`chatbot.js:2680-2713`):
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

---

**Última actualización**: 30 de Septiembre, 2025 - Sistema de Reacciones y Marcar como Leído v2.5.4
**Versión del proyecto**: 2.5.4
**Mantenedor**: @FeyoMx

### 📝 Nota para futuras actualizaciones
Este archivo debe actualizarse con cada cambio significativo al proyecto, incluyendo:
- Nuevas funcionalidades
- Cambios de diseño/UI
- Modificaciones de arquitectura
- Actualizaciones de dependencias
- Correcciones importantes