# Guía de Uso - Sistema de Tracking de Campañas de Marketing

## 📋 Tabla de Contenidos

1. [Flujo Completo](#flujo-completo)
2. [Crear Campaña](#1-crear-campaña)
3. [Integrar con n8n](#2-integrar-con-n8n)
4. [Consultar Estadísticas](#3-consultar-estadísticas)
5. [Ejemplos de Respuestas](#ejemplos-de-respuestas)

---

## Flujo Completo

```
1. Crear campaña en backend → POST /api/marketing/campaign/create
2. Configurar workflow n8n → Agregar nodos de registro
3. Enviar plantillas → WhatsApp API + registro automático
4. Webhooks capturan estados → Automático (delivered, read, failed)
5. Webhooks capturan reacciones → Automático (emojis)
6. Consultar analytics → GET /api/marketing/campaign/:id/stats
```

---

## 1. Crear Campaña

Antes de enviar mensajes desde n8n, crear la campaña en el backend:

**Endpoint:** `POST /api/marketing/campaign/create`

**Ejemplo con cURL:**
```bash
curl -X POST https://capibobbabot.onrender.com/api/marketing/campaign/create \
  -H "Content-Type: application/json" \
  -d '{
    "id": "promo_capicombo_2025_01",
    "name": "Promoción Capicombo Enero 2025",
    "templateName": "capicombo_promo_v2",
    "description": "Campaña de promoción 2x1 para fines de semana"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "campaign": {
    "id": "promo_capicombo_2025_01",
    "name": "Promoción Capicombo Enero 2025",
    "templateName": "capicombo_promo_v2",
    "description": "Campaña de promoción 2x1 para fines de semana",
    "created": 1705000000000,
    "active": true,
    "stats": {
      "totalSent": 0,
      "delivered": 0,
      "read": 0,
      "failed": 0,
      "reactions": 0
    }
  }
}
```

---

## 2. Integrar con n8n

### Workflow ID: `qSKrf1OiNFS6ZbSu`

**Estructura Actual:**
```
[Trigger] → [Get Recipients] → [Loop] → [PlantillaWhatsApp] → [End]
```

**Estructura Nueva (con tracking):**
```
[Trigger]
  ↓
[Set Campaign Info]  ← AGREGAR AQUÍ
  ↓
[Get Recipients]
  ↓
[Loop]
  ↓
  ├─→ [PlantillaWhatsApp]
  │     ↓
  │   [Extract Message ID]  ← AGREGAR AQUÍ
  │     ↓
  │   [Register in Backend]  ← AGREGAR AQUÍ
  │     ↓
  │   [Wait 1s]  ← AGREGAR (prevenir rate limiting)
  ↓
[Summary Report]  ← OPCIONAL
  ↓
[End]
```

### Nodos a Agregar:

#### Nodo 1: Set Campaign Info
**Tipo:** Set
**Posición:** ANTES del loop
**Configuración:**
```json
{
  "values": {
    "string": [
      {
        "name": "campaignId",
        "value": "promo_capicombo_2025_01"
      },
      {
        "name": "campaignName",
        "value": "Promoción Capicombo Enero"
      },
      {
        "name": "templateName",
        "value": "capicombo_promo_v2"
      }
    ]
  }
}
```

#### Nodo 2: Extract Message ID
**Tipo:** Code
**Posición:** DESPUÉS de PlantillaWhatsApp
**Código:**
```javascript
// Input: respuesta de PlantillaWhatsApp
const response = $input.item.json;

// Verificar que la plantilla se envió correctamente
if (!response.messages || response.messages.length === 0) {
  throw new Error('No se pudo enviar el mensaje');
}

// Extraer datos
const messageId = response.messages[0].id;
const recipient = response.contacts[0].wa_id;

// Obtener datos de campaña del nodo anterior
const campaignData = $('Set Campaign Info').item.json;

return {
  messageId,
  recipient,
  campaignId: campaignData.campaignId,
  templateName: campaignData.templateName,
  sentAt: Date.now(),
  // Pasar también la respuesta completa por si se necesita
  whatsappResponse: response
};
```

#### Nodo 3: Register in Backend
**Tipo:** HTTP Request
**Posición:** DESPUÉS de Extract Message ID
**Configuración:**

- **Method:** POST
- **URL:** `https://capibobbabot.onrender.com/api/marketing/register-message`
- **Authentication:** None
- **Headers:**
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
- **Body (JSON):**
  ```json
  {
    "messageId": "={{ $json.messageId }}",
    "campaignId": "={{ $json.campaignId }}",
    "recipient": "={{ $json.recipient }}",
    "templateName": "={{ $json.templateName }}",
    "sentAt": "={{ $json.sentAt }}"
  }
  ```
- **Options:**
  - Timeout: 10000 ms
  - Redirect: Follow All Redirects
  - Continue On Fail: true (para no detener el workflow si falla el registro)

**Respuesta Esperada:**
```json
{
  "success": true,
  "message": {
    "messageId": "wamid.HBgNNTE1NTEyMzQ1Njc4OBUCABIYFjNFQjA2MTUyNEQ0MTJFOEY2NjkzOUEA",
    "campaignId": "promo_capicombo_2025_01",
    "recipient": "5215512345678",
    "templateName": "capicombo_promo_v2",
    "status": "sent",
    "timestamps": {
      "sent": 1705001234567,
      "delivered": null,
      "read": null,
      "failed": null
    },
    "reactions": []
  },
  "campaignId": "promo_capicombo_2025_01"
}
```

#### Nodo 4: Wait 1s
**Tipo:** Wait
**Posición:** DESPUÉS de Register in Backend
**Configuración:**
- Wait Time: 1 second
- Resume On: After Time Interval

---

## 3. Consultar Estadísticas

### Ver Todas las Campañas

```bash
curl https://capibobbabot.onrender.com/api/marketing/campaigns
```

**Respuesta:**
```json
{
  "success": true,
  "count": 3,
  "campaigns": [
    {
      "id": "promo_capicombo_2025_01",
      "name": "Promoción Capicombo Enero",
      "templateName": "capicombo_promo_v2",
      "created": 1705000000000,
      "active": true,
      "stats": {
        "totalSent": 150,
        "delivered": 145,
        "read": 120,
        "failed": 5,
        "reactions": 45
      }
    }
  ]
}
```

### Ver Estadísticas Detalladas de una Campaña

```bash
curl https://capibobbabot.onrender.com/api/marketing/campaign/promo_capicombo_2025_01/stats
```

**Respuesta:**
```json
{
  "success": true,
  "stats": {
    "campaign": {
      "id": "promo_capicombo_2025_01",
      "name": "Promoción Capicombo Enero",
      "templateName": "capicombo_promo_v2",
      "created": 1705000000000,
      "active": true
    },
    "stats": {
      "totalSent": 150,
      "delivered": 145,
      "read": 120,
      "failed": 5,
      "reactions": 45,
      "deliveryRate": 96.7,
      "readRate": 80.0,
      "failureRate": 3.3,
      "engagementRate": 30.0
    },
    "reactions": {
      "total": 45,
      "distribution": {
        "👍": 20,
        "❤️": 15,
        "🔥": 10
      },
      "topEmojis": [
        { "emoji": "👍", "count": 20 },
        { "emoji": "❤️", "count": 15 },
        { "emoji": "🔥", "count": 10 }
      ]
    },
    "messages": {
      "total": 150,
      "byStatus": {
        "sent": 0,
        "delivered": 25,
        "read": 120,
        "failed": 5
      }
    }
  }
}
```

### Ver Análisis de Reacciones

```bash
curl https://capibobbabot.onrender.com/api/marketing/campaign/promo_capicombo_2025_01/reactions
```

**Respuesta:**
```json
{
  "success": true,
  "stats": {
    "total": 45,
    "uniqueUsers": 38,
    "bySentiment": {
      "positive": 42,
      "negative": 1,
      "neutral": 2
    },
    "topEmojis": [
      { "emoji": "👍", "count": 20, "sentiment": "positive" },
      { "emoji": "❤️", "count": 15, "sentiment": "positive" },
      { "emoji": "🔥", "count": 10, "sentiment": "positive" }
    ],
    "sentimentRate": {
      "positive": 93.3,
      "negative": 2.2,
      "neutral": 4.4
    }
  },
  "timeline": [
    {
      "timestamp": "2025-01-12 10:00",
      "total": 5,
      "positive": 4,
      "negative": 0,
      "neutral": 1,
      "emojis": { "👍": 3, "❤️": 1, "🤔": 1 }
    }
  ],
  "patterns": {
    "alerts": [],
    "insights": [
      {
        "type": "success",
        "message": "Alta tasa de reacciones positivas (93.3%)",
        "recommendation": "La audiencia está respondiendo muy bien a este mensaje"
      },
      {
        "type": "success",
        "message": "Excelente tasa de engagement (30.0%)",
        "recommendation": "Considera replicar el estilo de esta campaña"
      }
    ],
    "metrics": {
      "engagementRate": 30.0,
      "sentimentScore": 91.1
    }
  }
}
```

### Ver Mensajes Individuales

```bash
# Todos los mensajes
curl https://capibobbabot.onrender.com/api/marketing/campaign/promo_capicombo_2025_01/messages

# Solo mensajes fallidos
curl "https://capibobbabot.onrender.com/api/marketing/campaign/promo_capicombo_2025_01/messages?status=failed"

# Solo mensajes leídos
curl "https://capibobbabot.onrender.com/api/marketing/campaign/promo_capicombo_2025_01/messages?status=read"
```

### Ver Dashboard General

```bash
curl https://capibobbabot.onrender.com/api/marketing/dashboard-stats
```

---

## Ejemplos de Respuestas

### Mensaje Individual

```json
{
  "messageId": "wamid.HBgNNTE1NTEyMzQ1Njc4OBUCABIYFjNFQjA2MTUyNEQ0MTJFOEY2NjkzOUEA",
  "campaignId": "promo_capicombo_2025_01",
  "recipient": "5215512345678",
  "templateName": "capicombo_promo_v2",
  "status": "read",
  "timestamps": {
    "sent": 1705001000000,
    "delivered": 1705001050000,
    "read": 1705002000000,
    "failed": null
  },
  "reactions": [
    {
      "emoji": "👍",
      "userId": "5215512345678",
      "timestamp": 1705003000000,
      "sentiment": "positive"
    }
  ],
  "error": null
}
```

### Dashboard Stats

```json
{
  "success": true,
  "stats": {
    "campaigns": {
      "total": 5,
      "active": 3,
      "archived": 2
    },
    "messages": {
      "totalSent": 750,
      "delivered": 720,
      "read": 650,
      "failed": 30,
      "reactions": 180
    },
    "averages": {
      "deliveryRate": 96.0,
      "readRate": 86.7,
      "engagementRate": 24.0
    },
    "recentCampaigns": [
      {
        "id": "promo_capicombo_2025_01",
        "name": "Promoción Capicombo Enero",
        "created": 1705000000000,
        "stats": { ... }
      }
    ]
  }
}
```

---

## 🔧 Troubleshooting

### Error: "Campaign not found"

**Causa:** La campaña no existe en Redis
**Solución:** Crear la campaña primero con `POST /api/marketing/campaign/create`

### Error: "Missing required fields"

**Causa:** Faltan campos en el request
**Solución:** Verificar que se envían `messageId`, `campaignId`, y `recipient`

### Los estados no se actualizan

**Causa:** Los webhooks de WhatsApp no están llegando
**Solución:**
1. Verificar configuración del webhook en Meta Dashboard
2. Verificar que el endpoint `/webhook` esté accesible
3. Revisar logs del servidor

### Las reacciones no se capturan

**Causa:** El tipo de webhook no está configurado
**Solución:**
1. En Meta Dashboard, asegurarse de que el webhook esté suscrito a `messages`
2. Verificar que las reacciones estén habilitadas en la configuración de WhatsApp Business

---

## 📊 Mejores Prácticas

1. **IDs de campaña descriptivos:** Usa formato `tipo_producto_año_mes` (ej: `promo_capicombo_2025_01`)

2. **Crear campaña antes de enviar:** Siempre crear la campaña en el backend antes de ejecutar el workflow de n8n

3. **Monitorear en tiempo real:** Revisar las estadísticas durante y después del envío

4. **Analizar patrones:** Usar el endpoint `/reactions` para detectar insights y alertas

5. **Archivar campañas antiguas:** Desactivar campañas completadas con `PATCH /api/marketing/campaign/:id/status`

6. **TTL de 30 días:** Los datos se mantienen por 30 días automáticamente, exportar antes si se necesita histórico

---

## 🚀 Próximos Pasos

Ahora que tienes el backend configurado, los siguientes pasos son:

1. **Modificar workflow n8n** → Agregar nodos de registro
2. **Crear primera campaña** → `POST /api/marketing/campaign/create`
3. **Enviar mensajes de prueba** → 5-10 mensajes para testing
4. **Verificar tracking** → Consultar stats y verificar que se actualizan
5. **Dashboard Next.js** → Crear UI visual para analytics (próximo sprint)

¿Listo para probar? 🎉
