# Sistema de Reacciones Inteligente 🎨

Sistema completo de reacciones contextuales para WhatsApp que proporciona feedback visual inmediato y personalizado según el contexto, estado del flujo, y comportamiento del usuario.

## 📋 Características Principales

### 🔄 Reacciones Progresivas
Las reacciones cambian dinámicamente según el progreso del flujo:
```
Usuario envía pedido → ⏳ (procesando)
Bot confirma → 🛒 (pedido confirmado)
Completa pago → ✅ (completado)
Error → ❌ (problema)
```

### 🎯 Reacciones Contextuales
Detecta automáticamente el contexto y reacciona apropiadamente:

#### Flujo de Pedidos
- ⏳ Pedido recibido (procesando)
- 🛒 Pedido confirmado
- 🚚 Dirección confirmada
- 📍 Ubicación recibida
- 🏠 Código de acceso guardado
- 💰 Método de pago seleccionado
- 📸 Comprobante de pago recibido
- 💵 Pago en efectivo confirmado
- ✅ Pedido validado
- 🎉 Pedido completado
- ❌ Error en proceso
- 🔄 Pedido actualizado

#### Tipos de Consulta
- 📋 Consultas de menú
- 💲 Consultas de precios
- ⏱️ Consultas de horarios
- 🚗 Consultas de delivery
- 🎁 Consultas de promociones
- 👋 Saludos
- 🤝 Despedidas

### 📊 Reacciones Basadas en Métricas
Personaliza la experiencia según el comportamiento del usuario:
- 🔥 Cliente frecuente (>5 pedidos)
- 🌟 Primera compra
- 🎯 Pedido grande (>$500)
- 💎 Cliente VIP (>10 pedidos o >$2000 total)

### 🛡️ Reacciones de Validación
Feedback de seguridad y validación:
- ✅ Input válido
- ⚠️ Input sospechoso
- 🚫 Bloqueado por rate limit
- 🔐 Verificado exitosamente

### 🔔 Reacciones para Administradores
Notificaciones especiales:
- 🔔 Notificación general
- 🚨 Alerta de seguridad
- 📊 Reporte generado
- 🛠️ Comando ejecutado

## 🚀 Uso

### Inicialización

```javascript
const { ReactionManager } = require('./reactions/reaction-manager');

const reactionManager = new ReactionManager(
    WHATSAPP_TOKEN,
    PHONE_NUMBER_ID,
    WHATSAPP_API_VERSION
);
```

### Métodos Principales

#### 1. Reacción Simple
```javascript
await reactionManager.sendReaction(to, messageId, '✅');
```

#### 2. Reacción por Estado del Flujo
```javascript
await reactionManager.reactToState(to, messageId, 'awaiting_address');
// Enviará automáticamente 🛒
```

#### 3. Reacción por Intención
```javascript
await reactionManager.reactToIntention(to, messageId, '¿Cuál es el menú?');
// Detectará "menú" y enviará 📋
```

#### 4. Reacción Progresiva (Actualizar)
```javascript
await reactionManager.updateReaction(to, messageId, '✅', '⏳');
// Cambia de ⏳ a ✅
```

#### 5. Reacción por Métricas de Usuario
```javascript
const userMetrics = {
    orderCount: 6,
    orderTotal: 450,
    totalSpent: 2500
};
await reactionManager.reactToMetrics(to, messageId, userMetrics);
// Enviará 🔥 (cliente frecuente)
```

#### 6. Reacciones del Flujo de Pedidos
```javascript
// Diferentes etapas
await reactionManager.reactToOrderFlow(to, messageId, 'received');        // ⏳
await reactionManager.reactToOrderFlow(to, messageId, 'address_saved');   // 🚚
await reactionManager.reactToOrderFlow(to, messageId, 'payment_received'); // 💰
await reactionManager.reactToOrderFlow(to, messageId, 'celebration');     // 🎉
```

#### 7. Reacciones para Admins
```javascript
await reactionManager.reactToAdminMessage(adminNumber, messageId, 'security');
// Enviará 🚨
```

#### 8. Reacciones de Validación
```javascript
await reactionManager.reactToValidation(to, messageId, 'valid');      // ✅
await reactionManager.reactToValidation(to, messageId, 'suspicious'); // ⚠️
await reactionManager.reactToValidation(to, messageId, 'blocked');    // 🚫
```

#### 9. Quitar Reacción
```javascript
await reactionManager.removeReaction(to, messageId);
// Envía emoji vacío para quitar la reacción
```

### Estadísticas

```javascript
const stats = reactionManager.getReactionStats();
console.log(stats);
// {
//   total: 150,
//   byEmoji: { '✅': 45, '🛒': 32, '📍': 18, ... },
//   recent: [ ... últimas 10 reacciones ... ]
// }
```

### Limpieza

```javascript
// Limpiar reacciones de más de 24 horas
const cleaned = reactionManager.cleanOldReactions();
console.log(`${cleaned} reacciones antiguas eliminadas`);
```

## 🔌 API Endpoints

### GET /api/reactions/stats
Obtiene estadísticas de uso de reacciones
```bash
curl http://localhost:3000/api/reactions/stats
```

**Respuesta:**
```json
{
  "success": true,
  "stats": {
    "total": 150,
    "byEmoji": {
      "✅": 45,
      "🛒": 32,
      "📍": 18
    },
    "recent": [...]
  },
  "timestamp": "2025-10-03T12:00:00.000Z"
}
```

### POST /api/reactions/cleanup
Limpia historial de reacciones antiguas
```bash
curl -X POST http://localhost:3000/api/reactions/cleanup
```

**Respuesta:**
```json
{
  "success": true,
  "cleaned": 25,
  "message": "25 reacciones antiguas eliminadas"
}
```

### GET /api/user/metrics/:phoneNumber
Obtiene métricas de un usuario para reacciones personalizadas
```bash
curl http://localhost:3000/api/user/metrics/5215512345678
```

**Respuesta:**
```json
{
  "success": true,
  "metrics": {
    "phoneNumber": "5215512345678",
    "orderCount": 8,
    "totalSpent": 1250,
    "lastOrderDate": "2025-10-01",
    "isVIP": false,
    "isFrequent": true
  }
}
```

## 🎨 Catálogo Completo de Emojis

### Flujo de Pedidos
| Emoji | Descripción | Código |
|-------|-------------|--------|
| ⏳ | Pedido recibido (procesando) | `ORDER_RECEIVED` |
| 🛒 | Pedido confirmado | `ORDER_CONFIRMED` |
| ✅ | Pedido completado | `ORDER_COMPLETED` |
| ❌ | Error en pedido | `ORDER_ERROR` |
| 🔄 | Pedido actualizado | `ORDER_UPDATED` |

### Flujo de Entrega
| Emoji | Descripción | Código |
|-------|-------------|--------|
| 🚚 | Dirección confirmada | `ADDRESS_CONFIRMED` |
| 📍 | Ubicación recibida | `LOCATION_RECEIVED` |
| 🏠 | Código de acceso guardado | `ACCESS_CODE_SAVED` |

### Flujo de Pago
| Emoji | Descripción | Código |
|-------|-------------|--------|
| 💰 | Método de pago recibido | `PAYMENT_RECEIVED` |
| 📸 | Comprobante de pago | `PAYMENT_PROOF` |
| 💵 | Pago en efectivo confirmado | `CASH_CONFIRMED` |
| ✔️ | Pago validado | `PAYMENT_VALIDATED` |
| ❌ | Pago rechazado | `PAYMENT_REJECTED` |

### Estados Generales
| Emoji | Descripción | Código |
|-------|-------------|--------|
| ⏳ | Procesando | `PROCESSING` |
| ✅ | Éxito | `SUCCESS` |
| ❌ | Error | `ERROR` |
| ⚠️ | Advertencia | `WARNING` |
| ℹ️ | Información | `INFO` |
| 🎉 | Celebración | `CELEBRATION` |

### Tipos de Consulta
| Emoji | Descripción | Código |
|-------|-------------|--------|
| 📋 | Consulta de menú | `MENU_INQUIRY` |
| 💲 | Consulta de precio | `PRICE_INQUIRY` |
| ⏱️ | Consulta de horario | `HOURS_INQUIRY` |
| 🚗 | Consulta de delivery | `DELIVERY_INQUIRY` |
| 🎁 | Consulta de promoción | `PROMO_INQUIRY` |
| 👋 | Saludo | `GREETING` |
| 🤝 | Despedida | `FAREWELL` |

### Métricas de Usuario
| Emoji | Descripción | Código |
|-------|-------------|--------|
| 🔥 | Cliente frecuente | `FREQUENT_CLIENT` |
| 🌟 | Primera orden | `FIRST_ORDER` |
| 🎯 | Pedido grande | `LARGE_ORDER` |
| 💎 | Cliente VIP | `VIP_CLIENT` |

### Administración
| Emoji | Descripción | Código |
|-------|-------------|--------|
| 🔔 | Notificación admin | `ADMIN_NOTIFICATION` |
| 🚨 | Alerta de seguridad | `SECURITY_ALERT` |
| 📊 | Reporte | `REPORT` |
| 🛠️ | Comando admin | `ADMIN_COMMAND` |

### Validación/Seguridad
| Emoji | Descripción | Código |
|-------|-------------|--------|
| ✅ | Input válido | `VALID_INPUT` |
| ⚠️ | Input sospechoso | `SUSPICIOUS_INPUT` |
| 🚫 | Rate limited | `RATE_LIMITED` |
| 🔐 | Verificado | `VERIFIED` |

## ⚙️ Configuración

### Variables de Entorno
No requiere variables adicionales. Usa las existentes del chatbot:
- `WHATSAPP_TOKEN`
- `PHONE_NUMBER_ID`
- `WHATSAPP_API_VERSION`

### Limpieza Automática
La limpieza de reacciones antiguas está programada cada 6 horas via cron:
```javascript
cron.schedule('0 */6 * * *', () => {
    reactionManager.cleanOldReactions();
});
```

## 🔧 Arquitectura

### Estructura del Historial
```javascript
reactionHistory: Map {
  'messageId123' => {
    to: '5215512345678',
    emoji: '✅',
    timestamp: 1696348800000
  }
}
```

### Detección de Intención
El sistema usa pattern matching para detectar intenciones:
```javascript
INTENTION_PATTERNS = {
  menu: {
    keywords: ['menú', 'menu', 'carta', 'productos', ...],
    emoji: '📋'
  },
  ...
}
```

### Mapeo de Estados
```javascript
STATE_REACTIONS = {
  'awaiting_address': '🛒',
  'awaiting_payment_method': '🏠',
  'order_complete': '🎉',
  ...
}
```

## 📊 Beneficios

### UX Mejorada
- ✨ Feedback visual inmediato
- 🎯 Confirmación de recepción sin mensajes adicionales
- 🔄 Seguimiento visual del progreso

### Analytics
- 📈 Tracking de engagement
- 🎯 Análisis de patrones de uso
- 📊 Métricas de reacciones por emoji

### Personalización
- 🎭 Experiencia diferenciada por tipo de usuario
- 🏆 Reconocimiento de clientes VIP
- 🌟 Celebración de hitos (primera compra, etc.)

### Eficiencia
- ⚡ Menos mensajes de texto, más iconos
- 🚀 No bloquea el flujo principal (fire-and-forget)
- 💾 Memoria eficiente con limpieza automática

## 🐛 Troubleshooting

### Las reacciones no se envían
1. Verificar que `reactionManager` esté inicializado
2. Confirmar que `messageId` existe y es válido
3. Revisar logs de errores en consola
4. Verificar tokens de WhatsApp

### Reacciones no cambian
1. Asegurarse de usar `updateReaction()` para cambios
2. Verificar que el `messageId` sea el mismo
3. Confirmar que el mensaje tenga menos de 30 días

### Historial crece demasiado
1. Verificar que el cron de limpieza esté activo
2. Ejecutar limpieza manual si es necesario:
   ```javascript
   reactionManager.cleanOldReactions()
   ```

## 📚 Referencias

- [WhatsApp Cloud API - Reaction Messages](https://developers.facebook.com/docs/whatsapp/cloud-api/messages/reaction-messages)
- [WhatsApp Cloud API - Message Types](https://developers.facebook.com/docs/whatsapp/cloud-api/messages/text-messages)

## 🎯 Roadmap

### Futuras Mejoras
- [ ] Reacciones animadas (cuando WhatsApp lo soporte)
- [ ] A/B testing de reacciones
- [ ] Machine learning para reacciones predictivas
- [ ] Dashboard visual de estadísticas de reacciones
- [ ] Reacciones personalizadas por negocio
- [ ] Integración con sentiment analysis

---

**Versión**: 2.7.0
**Autor**: @FeyoMx
**Licencia**: MIT
