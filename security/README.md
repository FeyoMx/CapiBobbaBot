# Sistema de Seguridad de CapiBobbaBot

Sistema completo de seguridad con rate limiting, validación de inputs, backups automáticos y monitoreo 24/7.

## 📦 Componentes

### 1. Rate Limiter (`rate-limiter.js`)
Sistema de rate limiting por usuario para prevenir spam y abuso.

**Características:**
- Límites por minuto, hora y día
- Rate limiting separado para mensajes, pedidos y llamadas API
- Estadísticas de uso por usuario
- Capacidad de resetear límites para admins

**Uso:**
```javascript
const { RateLimiter } = require('./security');

const rateLimiter = new RateLimiter(redisClient);

// Verificar límite de mensajes
const check = await rateLimiter.checkMessageLimit(phoneNumber);
if (!check.allowed) {
    console.log(`Límite excedido. Resetea en ${check.resetIn}s`);
}

// Verificar límite de pedidos
const orderCheck = await rateLimiter.checkOrderLimit(phoneNumber);

// Obtener estadísticas
const stats = await rateLimiter.getUserStats(phoneNumber);
console.log(stats); // { messages: {...}, orders: {...} }
```

**Límites por defecto:**
- Mensajes: 10/minuto, 100/hora, 500/día
- Pedidos: 3/hora, 10/día
- API calls: 20/minuto, 200/hora

### 2. Input Validator (`input-validator.js`)
Validación y sanitización de todos los inputs del usuario.

**Características:**
- Detección de patrones peligrosos (SQL injection, XSS, command injection)
- Validación por tipo (texto, teléfono, dirección, números, JSON)
- Sanitización automática
- Límites de longitud configurables

**Uso:**
```javascript
const { InputValidator } = require('./security');

const validator = new InputValidator();

// Validar texto
const textResult = validator.validateText(userInput);
if (!textResult.valid) {
    console.log('Errores:', textResult.errors);
}
console.log('Texto sanitizado:', textResult.sanitized);

// Validar teléfono
const phoneResult = validator.validatePhoneNumber(phoneNumber);

// Validar dirección
const addressResult = validator.validateAddress(address);

// Validar mensaje completo de WhatsApp
const messageResult = validator.validateWhatsAppMessage(message);
if (messageResult.suspicious) {
    console.log('⚠️ Actividad sospechosa detectada');
}
```

### 3. Redis Backup (`redis-backup.js`)
Sistema de backup y recuperación automática de Redis.

**Características:**
- Backups programados automáticos (configurable)
- Respaldo de todas las estructuras de datos Redis
- Preservación de TTL
- Limpieza automática de backups antiguos
- Exportación a JSON/CSV

**Uso:**
```javascript
const { RedisBackup } = require('./security');

const backup = new RedisBackup(redisClient, {
    schedule: '0 */6 * * *', // Cada 6 horas
    retentionDays: 7,
    maxBackups: 30
});

// Iniciar backups automáticos
await backup.start();

// Crear backup manual
const result = await backup.createBackup();

// Listar backups
const backups = await backup.listBackups();

// Restaurar desde backup
await backup.restore('/path/to/backup.json', clearBefore = true);

// Exportar backup
const csv = await backup.exportBackup('/path/to/backup.json', 'csv');
```

### 4. Security Monitor (`security-monitor.js`)
Monitoreo de seguridad 24/7 con alertas automáticas.

**Características:**
- Detección de intentos de login fallidos
- Identificación de patrones DDoS
- Análisis de actividad sospechosa
- Alertas con niveles de severidad
- Bloqueo automático de usuarios
- Estadísticas detalladas

**Uso:**
```javascript
const { SecurityMonitor } = require('./security');

const monitor = new SecurityMonitor(redisClient, {
    maxFailedLogins: 5,
    ddosThreshold: 100,
    checkInterval: 60000
});

// Iniciar monitoreo
monitor.start();

// Registrar evento de seguridad
await monitor.logSecurityEvent('failed_login', {
    userId: phoneNumber,
    reason: 'Invalid credentials'
});

// Bloquear usuario manualmente
await monitor.blockUser(phoneNumber, 3600); // 1 hora

// Verificar si está bloqueado
const isBlocked = await monitor.isUserBlocked(phoneNumber);

// Obtener alertas activas
const alerts = await monitor.getActiveAlerts();

// Obtener estadísticas
const stats = await monitor.getSecurityStats();

// Escuchar eventos
monitor.on('alert', (alert) => {
    console.log('🚨 ALERTA:', alert);
});

monitor.on('userBlocked', ({ userId, duration }) => {
    console.log(`🚫 Usuario bloqueado: ${userId}`);
});
```

## 🚀 Integración Completa

### Inicialización
```javascript
const { initializeSecurity, securityMiddleware } = require('./security');

// Inicializar sistema completo
const security = initializeSecurity(redisClient, {
    backup: {
        enabled: true,
        schedule: '0 */6 * * *',
        retentionDays: 7
    },
    monitor: {
        maxFailedLogins: 5,
        ddosThreshold: 100
    }
});

// Agregar middleware a Express
app.use('/webhook', securityMiddleware(security));
```

### Uso en el Chatbot
```javascript
// Validar input del usuario
const { validateInput } = require('./security');

const addressValidation = validateInput(security, 'address', userAddress);
if (!addressValidation.valid) {
    await sendTextMessage(phoneNumber, 'Dirección inválida');
    return;
}

// Usar versión sanitizada
const cleanAddress = addressValidation.sanitized;
```

## ⚙️ Configuración

### Variables de Entorno
```env
# Configuración de backups
ENABLE_AUTO_BACKUP=true
BACKUP_SCHEDULE="0 */6 * * *"
BACKUP_RETENTION_DAYS=7

# Configuración de seguridad
MAX_FAILED_LOGINS=5
DDOS_THRESHOLD=100
SECURITY_CHECK_INTERVAL=60000

# Rate limiting
RATE_LIMIT_MESSAGES_PER_MINUTE=10
RATE_LIMIT_MESSAGES_PER_HOUR=100
RATE_LIMIT_ORDERS_PER_HOUR=3
```

## 📊 Monitoreo y Alertas

### Tipos de Eventos de Seguridad
- `failed_login`: Intento de login fallido
- `suspicious_activity`: Actividad sospechosa detectada
- `invalid_input`: Input inválido recibido
- `rate_limit_exceeded`: Límite de rate excedido
- `possible_ddos`: Posible ataque DDoS
- `unauthorized_access`: Intento de acceso no autorizado

### Niveles de Severidad
- `low`: Informativo, no requiere acción inmediata
- `medium`: Requiere revisión
- `high`: Requiere acción pronta
- `critical`: Requiere acción inmediata

## 🛡️ Mejores Prácticas

1. **Habilitar todos los módulos en producción**
   ```javascript
   const security = initializeSecurity(redisClient, {
       backup: { enabled: true },
       monitor: { enabled: true }
   });
   ```

2. **Monitorear logs de seguridad regularmente**
   ```javascript
   const stats = await security.securityMonitor.getSecurityStats();
   console.log('Eventos de seguridad:', stats);
   ```

3. **Revisar alertas críticas inmediatamente**
   ```javascript
   security.securityMonitor.on('alert', async (alert) => {
       if (alert.severity === 'critical') {
           // Notificar admins
           await notifyAdmin(`🚨 ALERTA CRÍTICA: ${alert.type}`);
       }
   });
   ```

4. **Realizar backups antes de operaciones críticas**
   ```javascript
   await security.redisBackup.createBackup();
   // Realizar operación crítica
   ```

5. **Probar restauración de backups periódicamente**
   ```javascript
   const latest = await security.redisBackup.getLatestBackup();
   await security.redisBackup.restore(latest.path);
   ```

## 🧪 Testing

```javascript
// Test rate limiting
const check = await security.rateLimiter.checkMessageLimit('521234567890');
console.log('Rate limit check:', check);

// Test input validation
const validation = security.inputValidator.validateText('<script>alert("xss")</script>');
console.log('Validation:', validation);

// Test backup
const result = await security.redisBackup.createBackup();
console.log('Backup result:', result);

// Test security monitoring
await security.securityMonitor.logSecurityEvent('test_event', { test: true });
const alerts = await security.securityMonitor.getActiveAlerts();
console.log('Alerts:', alerts);
```

## 📈 Métricas de Seguridad

El sistema recopila las siguientes métricas:
- Número de eventos de seguridad por tipo
- Usuarios bloqueados actualmente
- Alertas por severidad
- Rate limit excedidos por usuario
- Patrones de tráfico anómalos

## 🔧 Troubleshooting

### Rate limiting demasiado restrictivo
```javascript
// Ajustar límites en rate-limiter.js
rateLimiter.limits.messages.maxPerMinute = 20;
```

### Backups fallando
```javascript
// Verificar permisos del directorio
const backups = await security.redisBackup.listBackups();
console.log('Backups disponibles:', backups);
```

### Usuarios legítimos bloqueados
```javascript
// Desbloquear manualmente
await security.securityMonitor.unblockUser(phoneNumber);
await security.rateLimiter.resetUserLimits(phoneNumber);
```

## 📝 Logs

Todos los módulos generan logs detallados:
- ✅ Operaciones exitosas
- ⚠️ Warnings
- ❌ Errores
- 🚨 Alertas de seguridad
- 🔒 Eventos de bloqueo/desbloqueo

## 🤝 Contribuir

Para agregar nuevas funcionalidades de seguridad:
1. Crear nuevo módulo en `/security/`
2. Exportar en `index.js`
3. Agregar tests
4. Documentar en este README

---

**Versión**: 2.3.0
**Última actualización**: 30 de Septiembre, 2025