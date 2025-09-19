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

### Features Planeadas
- [ ] Multi-idioma
- [ ] Integración con pagos online
- [ ] Sistema de cupones
- [ ] Programa de lealtad
- [ ] Chat grupal para equipos
- [ ] Analytics avanzados
- [ ] A/B testing
- [ ] Voice messages support

### Mejoras Técnicas
- [ ] Tests automatizados
- [ ] CI/CD pipeline
- [ ] Containerización (Docker)
- [ ] Kubernetes deployment
- [ ] Rate limiting avanzado
- [ ] Caché distribuido

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

### v2.1.0 (2025-01-19)
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

**Última actualización**: 19 de Enero, 2025 - Dashboard UI v2.1.0
**Versión del proyecto**: 2.1.0
**Mantenedor**: @FeyoMx

### 📝 Nota para futuras actualizaciones
Este archivo debe actualizarse con cada cambio significativo al proyecto, incluyendo:
- Nuevas funcionalidades
- Cambios de diseño/UI
- Modificaciones de arquitectura
- Actualizaciones de dependencias
- Correcciones importantes