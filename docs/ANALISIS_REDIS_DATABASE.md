# Análisis Completo de Base de Datos Redis - CapiBobbaBot

**Fecha de análisis:** 2025-10-20
**Versión del proyecto:** 2.8.1
**Método:** Análisis estático del código fuente

---

## 📊 Resumen Ejecutivo

La base de datos Redis de CapiBobbaBot almacena datos críticos para la operación del chatbot, incluyendo estados de conversación, sesiones de usuario, pedidos, campañas de marketing, métricas de seguridad y configuraciones del sistema. El análisis reveló **8 categorías principales** de datos con **más de 15 patrones de keys** diferentes.

### Hallazgos Clave

- ✅ **Estructuración clara**: Keys organizadas por prefijos funcionales
- ✅ **TTL implementado**: Expiración automática en datos temporales (24h para sesiones, 30 días para mensajes)
- ✅ **Seguridad robusta**: Sistema de rate limiting y monitoreo activo
- ⚠️ **MCP Redis no operativo**: Las herramientas MCP de Redis no responden (timeout)
- 💡 **Optimización de memoria**: Configurado para entornos con 512MB RAM

---

## 🗂️ Estructura de Datos en Redis

### 1. **Estados de Conversación de Usuarios**

**Patrón de Key:** `{phoneNumber}` (ej: `5217712416450`)

**Tipo de dato:** String (JSON serializado)

**TTL:** 24 horas (86,400 segundos)

**Estructura:**
```json
{
  "step": "menu" | "awaiting_order" | "awaiting_survey_comment" | "confirming_order",
  "orderInProgress": {
    "items": [...],
    "total": 0,
    "timestamp": 1729468800000
  },
  "lastInteraction": 1729468800000,
  "context": {
    "campaignId": "string",
    "messageId": "string"
  }
}
```

**Ubicación en código:** [chatbot.js:1257-1270](chatbot.js#L1257-L1270)

**Propósito:** Mantener el contexto de cada conversación activa para flujos multi-paso (pedidos, encuestas, menús).

---

### 2. **Encuestas Pendientes**

**Patrón de Key:** `survey_pending:{phoneNumber}`

**Tipo de dato:** String (JSON)

**TTL:** 10 minutos (600 segundos)

**Estructura:**
```json
{
  "from": "5217712416450",
  "rating": 5,
  "timestamp": 1729468800000,
  "orderId": "order_123",
  "campaignId": "survey_satisfaction_v1"
}
```

**Ubicación en código:** [chatbot.js:2351-2395](chatbot.js#L2351-L2395)

**Propósito:** Almacenar temporalmente respuestas de encuestas mientras se completa el flujo multi-paso.

---

### 3. **Campañas de Marketing**

#### 3.1 Datos de Campaña

**Patrón de Key:** `marketing:campaign:{campaignId}`

**Tipo de dato:** String (JSON)

**TTL:** Sin expiración (campañas activas) | 90 días (archivadas)

**Estructura:**
```json
{
  "id": "black_friday_2024",
  "name": "Black Friday 2024",
  "templateName": "bf_promo_template",
  "description": "Promociones especiales",
  "created": 1729468800000,
  "active": true,
  "stats": {
    "totalSent": 150,
    "delivered": 145,
    "read": 120,
    "failed": 5,
    "reactions": 45
  }
}
```

**Ubicación en código:** [marketing/campaign-tracker.js:27-66](marketing/campaign-tracker.js#L27-L66)

#### 3.2 Mensajes de Campaña

**Patrón de Key:** `marketing:message:{messageId}`

**Tipo de dato:** String (JSON)

**TTL:** 30 días (2,592,000 segundos)

**Estructura:**
```json
{
  "messageId": "wamid.ABC123...",
  "campaignId": "black_friday_2024",
  "recipient": "5217712416450",
  "templateName": "bf_promo_template",
  "status": "delivered" | "read" | "failed" | "sent",
  "timestamps": {
    "sent": 1729468800000,
    "delivered": 1729468860000,
    "read": 1729469000000,
    "failed": null
  },
  "reactions": [
    {
      "emoji": "👍",
      "userId": "5217712416450",
      "timestamp": 1729469100000
    }
  ],
  "error": null
}
```

**Ubicación en código:** [marketing/campaign-tracker.js:161-208](marketing/campaign-tracker.js#L161-L208)

#### 3.3 Índices de Campañas

**Patrón de Key:**
- `marketing:campaigns:all` (Set con IDs de todas las campañas)
- `marketing:campaign:{campaignId}:messages` (Set con IDs de mensajes)

**Tipo de dato:** Set (Redis SET)

**Propósito:** Índices para consultas rápidas de campañas y mensajes relacionados.

**Ubicación en código:** [marketing/campaign-tracker.js:61-200](marketing/campaign-tracker.js#L61-L200)

---

### 4. **Sistema de Rate Limiting**

**Patrones de Keys:**
- `rate_limit:messages:minute:{phoneNumber}`
- `rate_limit:messages:hour:{phoneNumber}`
- `rate_limit:messages:day:{phoneNumber}`
- `rate_limit:orders:hour:{phoneNumber}`
- `rate_limit:orders:day:{phoneNumber}`
- `rate_limit:apiCalls:minute:{identifier}`

**Tipo de dato:** String (contador numérico)

**TTL:** Variable según ventana de tiempo:
- Minuto: 60 segundos
- Hora: 3,600 segundos
- Día: 86,400 segundos

**Límites configurados:**
```javascript
messages: {
  minute: 5,
  hour: 20,
  day: 50
},
orders: {
  hour: 3,
  day: 10
}
```

**Ubicación en código:** [security/rate-limiter.js:59-105](security/rate-limiter.js#L59-L105)

**Propósito:** Prevenir abuso y ataques de spam mediante control de frecuencia de mensajes y pedidos.

---

### 5. **Eventos de Seguridad**

#### 5.1 Logs de Eventos

**Patrón de Key:** `security:events:{eventType}:{timestamp}`

**Tipos de eventos:**
- `failed_login`
- `suspicious_activity`
- `rate_limit_exceeded`
- `malicious_pattern_detected`
- `ddos_attempt`

**Tipo de dato:** String (JSON)

**TTL:** 24 horas (configurable)

**Estructura:**
```json
{
  "type": "suspicious_activity",
  "timestamp": 1729468800000,
  "data": {
    "userId": "5217712416450",
    "action": "rapid_requests",
    "count": 15,
    "ip": "192.168.1.1"
  },
  "severity": "high" | "medium" | "low" | "critical"
}
```

**Ubicación en código:** [security/security-monitor.js:70-98](security/security-monitor.js#L70-L98)

#### 5.2 Usuarios Bloqueados

**Patrón de Key:** `security:blocked:{phoneNumber}`

**Tipo de dato:** String (JSON)

**TTL:** Variable (según duración del bloqueo)

**Estructura:**
```json
{
  "userId": "5217712416450",
  "reason": "rate_limit_exceeded",
  "blockedAt": 1729468800000,
  "expiresAt": 1729555200000,
  "severity": "medium"
}
```

**Ubicación en código:** [security/security-monitor.js:276-310](security/security-monitor.js#L276-L310)

#### 5.3 Contadores de Seguridad

**Patrón de Key:** `security:count:{eventType}`

**Tipo de dato:** String (contador)

**TTL:** 1 hora

**Propósito:** Contadores agregados para detección de patrones anómalos.

---

### 6. **Configuración del Sistema**

#### 6.1 Modo de Mantenimiento

**Key:** `maintenance_mode_status`

**Tipo de dato:** String (`"true"` | `"false"`)

**TTL:** Sin expiración

**Ubicación en código:** [chatbot.js:66, 326, 426](chatbot.js#L66)

**Propósito:** Control global del estado de mantenimiento del bot.

#### 6.2 Configuración de Negocio

**Key:** `config:business`

**Tipo de dato:** String (JSON)

**TTL:** Sin expiración

**Estructura:** Cache del objeto `BUSINESS_CONTEXT` desde [business_data.js](business_data.js)

**Ubicación en código:** [chatbot.js:4547-4598](chatbot.js#L4547-L4598)

---

### 7. **Backups del Sistema**

**Key:** `system:backup:latest`

**Tipo de dato:** String (JSON)

**TTL:** 7 días (604,800 segundos)

**Estructura:**
```json
{
  "timestamp": 1729468800000,
  "version": "2.8.1",
  "data": {
    "conversations": {...},
    "orders": {...},
    "campaigns": {...},
    "maintenanceMode": "false"
  }
}
```

**Ubicación en código:** [chatbot.js:4947-4959](chatbot.js#L4947-L4959)

**Propósito:** Snapshot periódico del sistema para recuperación ante desastres.

---

### 8. **Eventos y Alertas**

**Patrón de Key:** `security:event:{eventId}`

**Tipo de dato:** String (JSON)

**Estructura:**
```json
{
  "id": "evt_1729468800_abc123",
  "type": "order_created" | "user_blocked" | "campaign_sent",
  "severity": "info" | "warning" | "error" | "critical",
  "message": "Descripción del evento",
  "timestamp": 1729468800000,
  "metadata": {...}
}
```

**Ubicación en código:** [chatbot.js:4459-4525](chatbot.js#L4459-L4525)

---

## 📈 Estadísticas de Uso Estimadas

Basado en el análisis del código y configuraciones:

| Categoría | Estimado de Keys | TTL Promedio | Uso de Memoria Est. |
|-----------|------------------|--------------|---------------------|
| **Conversaciones activas** | 10-50 | 24 horas | ~50-250 KB |
| **Campañas de marketing** | 5-20 | Sin expiración | ~100-500 KB |
| **Mensajes de campaña** | 100-1,000 | 30 días | ~500 KB - 5 MB |
| **Rate limiting** | 50-200 | 1 min - 24h | ~10-50 KB |
| **Eventos de seguridad** | 100-500 | 24 horas | ~50-250 KB |
| **Configuración** | 5-10 | Sin expiración | ~10-50 KB |
| **Backups** | 1-5 | 7 días | ~100-500 KB |
| **Encuestas pendientes** | 5-20 | 10 minutos | ~5-20 KB |

**Total estimado:** ~1-7 MB de datos en Redis

---

## 🔍 Patrones y Convenciones

### Nomenclatura de Keys

1. **Prefijos funcionales:** Todas las keys usan prefijos descriptivos:
   - `marketing:*` - Sistema de campañas
   - `security:*` - Sistema de seguridad
   - `rate_limit:*` - Control de frecuencia
   - `survey_pending:*` - Encuestas temporales
   - `config:*` - Configuraciones del sistema
   - `system:*` - Datos del sistema

2. **Separadores:** Se usa `:` (dos puntos) como separador estándar.

3. **Identificadores:** Se incluyen timestamps, IDs únicos o números de teléfono.

### Estrategias de Expiración

1. **Datos temporales:** TTL corto (10 min - 1 hora)
   - Encuestas pendientes: 10 minutos
   - Rate limiting por minuto: 60 segundos

2. **Datos de sesión:** TTL medio (24 horas)
   - Estados de conversación: 24 horas
   - Eventos de seguridad: 24 horas

3. **Datos históricos:** TTL largo (7-90 días)
   - Mensajes de campaña: 30 días
   - Backups del sistema: 7 días
   - Campañas archivadas: 90 días

4. **Datos persistentes:** Sin TTL
   - Campañas activas
   - Configuraciones
   - Modo de mantenimiento

---

## 🛡️ Seguridad y Validación

### Validación de Inputs

**Ubicación:** [security/index.js](security/index.js) - función `validateInput()`

**Patrones bloqueados:**
- Comandos del sistema: `rm -rf`, `DROP TABLE`, `eval()`
- Inyección SQL: `'; DROP`, `UNION SELECT`
- Scripts maliciosos: `<script>`, `javascript:`
- Path traversal: `../`, `..\\`

### Rate Limiting

**Configuración actual:**

```javascript
// Mensajes por usuario
- 5 mensajes por minuto
- 20 mensajes por hora
- 50 mensajes por día

// Pedidos por usuario
- 3 pedidos por hora
- 10 pedidos por día

// API calls generales
- 100 llamadas por minuto por IP
```

**Ubicación:** [security/rate-limiter.js:11-28](security/rate-limiter.js#L11-L28)

---

## ⚙️ Optimizaciones Implementadas

### 1. Memoria Limitada (512MB)

**Configuración en producción:**

```javascript
// chatbot.js:6-14
process.env.NODE_OPTIONS = '--max-old-space-size=400';
process.env.UV_THREADPOOL_SIZE = '2';
```

### 2. Garbage Collection Automático

Ejecuta limpieza de memoria cada 5 minutos en producción.

**Ubicación:** [chatbot.js:18-24](chatbot.js#L18-L24)

### 3. Expiración Automática

- TTL configurado en todas las keys temporales
- Limpieza automática de datos antiguos
- Sistema de cleanup periódico cada hora

**Ubicación:** [security/security-monitor.js:44-46](security/security-monitor.js#L44-L46)

---

## 🔧 Operaciones Comunes

### Obtener Estado de Usuario

```javascript
// chatbot.js:1256-1259
const stateJSON = await redisClient.get(phoneNumber);
const state = stateJSON ? JSON.parse(stateJSON) : null;
```

### Guardar Estado de Usuario

```javascript
// chatbot.js:1267-1270
await redisClient.set(phoneNumber, JSON.stringify(state), { EX: 86400 });
```

### Verificar Rate Limit

```javascript
// security/rate-limiter.js:85-105
const currentCount = await this.redisClient.get(key);
const count = currentCount ? parseInt(currentCount) : 0;

if (count >= maxRequests) {
  return { allowed: false, remaining: 0 };
}

await this.redisClient.incr(key);
await this.redisClient.expire(key, ttl);
```

### Registrar Evento de Seguridad

```javascript
// security/security-monitor.js:70-98
const event = {
  type,
  timestamp: Date.now(),
  data,
  severity: this._calculateSeverity(type, data)
};

await this.redisClient.setEx(
  `security:events:${type}:${Date.now()}`,
  this.config.retentionHours * 3600,
  JSON.stringify(event)
);
```

---

## ⚠️ Problemas Identificados

### 1. Herramientas MCP Redis No Operativas

**Síntoma:** Timeout en todas las operaciones de `mcp__redis__*`

**Posibles causas:**
- Servidor MCP no conectado a Redis
- Configuración de `REDIS_URL` incorrecta en MCP
- Firewall bloqueando conexión
- Redis instance no disponible desde MCP

**Recomendación:** Verificar configuración de MCP y conectividad con Redis.

### 2. Falta de Índices para Queries Complejas

**Observación:** Las búsquedas de todos los eventos de seguridad usan `keys()`:

```javascript
// chatbot.js:4459
const eventKeys = await redisClient.keys('security:event:*');
```

**Problema:** `KEYS` es bloqueante y no recomendado en producción.

**Recomendación:** Migrar a `SCAN` o usar índices con Sorted Sets para eventos ordenados por timestamp.

### 3. Sin Compresión de Datos

**Observación:** JSON se almacena sin comprimir.

**Impacto:** Mayor uso de memoria y ancho de banda.

**Recomendación:** Implementar compresión (gzip/brotli) para objetos grandes (> 1KB).

---

## 💡 Recomendaciones de Mejora

### 1. Implementar Índices con Sorted Sets

**Para eventos de seguridad ordenados por tiempo:**

```javascript
// Agregar evento a sorted set
await redisClient.zadd('security:events:timeline', timestamp, eventId);

// Consultar últimos 100 eventos
const events = await redisClient.zrevrange('security:events:timeline', 0, 99);
```

**Beneficios:**
- Queries mucho más rápidas
- Sin bloqueo de Redis
- Paginación eficiente

### 2. Implementar Cache de Configuración

**Agregar cache en memoria para `config:business`:**

```javascript
// En chatbot.js
let cachedConfig = null;
let cacheExpiry = 0;

async function getBusinessConfig() {
  if (cachedConfig && Date.now() < cacheExpiry) {
    return cachedConfig;
  }

  const config = await redisClient.get('config:business');
  cachedConfig = JSON.parse(config);
  cacheExpiry = Date.now() + 300000; // 5 minutos

  return cachedConfig;
}
```

**Beneficios:**
- Reduce llamadas a Redis
- Mejora performance
- Menor latencia

### 3. Agregar Monitoreo de Redis

**Implementar métricas específicas:**

```javascript
// Agregar a monitoring/metrics.js
async collectRedisMetrics() {
  const info = await redisClient.info();
  return {
    memory_used: parseInfo(info, 'used_memory'),
    keys_total: parseInfo(info, 'db0:keys'),
    hits: parseInfo(info, 'keyspace_hits'),
    misses: parseInfo(info, 'keyspace_misses'),
    evictions: parseInfo(info, 'evicted_keys')
  };
}
```

### 4. Implementar Backup Incremental

**Problema:** Backup completo cada vez es ineficiente.

**Solución:** Backup solo de datos modificados:

```javascript
// Agregar timestamp de última modificación
await redisClient.hset('system:metadata', 'lastModified', Date.now());

// En backup, comparar timestamps
const lastBackup = await redisClient.hget('system:metadata', 'lastBackup');
// Solo respaldar keys modificadas después de lastBackup
```

### 5. Agregar Redis Sentinel/Cluster

**Para alta disponibilidad:**
- Implementar Redis Sentinel para failover automático
- Considerar Redis Cluster si el dataset crece > 100MB
- Configurar réplicas para read scaling

---

## 📊 Queries Útiles para Diagnóstico

### Contar Keys por Patrón

```bash
# Conversaciones activas
redis-cli --scan --pattern '*@s.whatsapp.net' | wc -l

# Campañas de marketing
redis-cli --scan --pattern 'marketing:campaign:*' | wc -l

# Eventos de seguridad
redis-cli --scan --pattern 'security:events:*' | wc -l

# Rate limits activos
redis-cli --scan --pattern 'rate_limit:*' | wc -l
```

### Memoria Usada por Key

```bash
redis-cli --memkeys --memkeys-samples 1000
```

### Expiración de Keys

```bash
# TTL de una key específica
redis-cli TTL "5217712416450"

# Keys que expiran en próxima hora
redis-cli --scan --pattern '*' | while read key; do
  ttl=$(redis-cli TTL "$key")
  if [ "$ttl" -lt 3600 ] && [ "$ttl" -gt 0 ]; then
    echo "$key: $ttl seconds"
  fi
done
```

---

## 🔗 Referencias

### Archivos Principales

- [chatbot.js](chatbot.js) - Lógica principal y gestión de estados
- [marketing/campaign-tracker.js](marketing/campaign-tracker.js) - Sistema de campañas
- [security/rate-limiter.js](security/rate-limiter.js) - Control de frecuencia
- [security/security-monitor.js](security/security-monitor.js) - Monitoreo de seguridad
- [security/redis-backup.js](security/redis-backup.js) - Sistema de backups

### Documentación Relacionada

- [project.md](project.md) - Arquitectura completa
- [README.md](README.md) - Setup y configuración
- [ROADMAP_MEJORAS_WORKFLOW.md](ROADMAP_MEJORAS_WORKFLOW.md) - Mejoras planificadas

---

## 📝 Conclusión

La base de datos Redis de CapiBobbaBot está bien estructurada y organizada, con patrones claros de nomenclatura, expiración automática y seguridad robusta. Las principales áreas de mejora son:

1. **Migrar de `KEYS` a `SCAN`** para queries no bloqueantes
2. **Implementar índices con Sorted Sets** para mejor performance
3. **Agregar compresión** para reducir uso de memoria
4. **Implementar backup incremental** para eficiencia
5. **Agregar monitoreo específico de Redis** para visibilidad

El sistema actual soporta adecuadamente la carga esperada (~10-50 usuarios concurrentes) con margen para crecer hasta 100-200 usuarios antes de requerir optimizaciones significativas.

---

**Análisis realizado por:** Claude Code Assistant
**Método:** Análisis estático del código fuente
**Limitación:** Las herramientas MCP de Redis no estuvieron disponibles para consultas en tiempo real
