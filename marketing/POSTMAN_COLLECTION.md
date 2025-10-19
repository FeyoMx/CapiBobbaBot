# 📮 Colección Postman - Campañas de Marketing CapiBobbaBot

Guía completa de endpoints para monitorear campañas de marketing en lo que se implementa el dashboard Next.js.

---

## 🚀 Quick Start

### Variables de Entorno en Postman

Crear las siguientes variables en Postman para facilitar el uso:

```
BASE_URL = https://capibobbabot.onrender.com
CAMPAIGN_ID = promo_capicombovideo_18_10_25
```

---

## 📊 Endpoints de Monitoreo

### 1. Dashboard General - Resumen de Todas las Campañas

**Descripción:** Obtiene un resumen completo de todas las campañas activas y sus métricas globales.

```bash
curl --location 'https://capibobbabot.onrender.com/api/marketing/dashboard-stats' \
--header 'Accept: application/json'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "stats": {
    "campaigns": {
      "total": 1,
      "active": 1,
      "archived": 0
    },
    "messages": {
      "totalSent": 77,
      "delivered": 66,
      "read": 9,
      "failed": 7,
      "reactions": 0
    },
    "averages": {
      "deliveryRate": 85.7,
      "readRate": 11.7,
      "engagementRate": 0
    },
    "recentCampaigns": [...]
  }
}
```

**Frecuencia recomendada:** Cada 15 minutos

---

### 2. Listar Todas las Campañas

**Descripción:** Lista todas las campañas con sus estadísticas básicas.

```bash
curl --location 'https://capibobbabot.onrender.com/api/marketing/campaigns' \
--header 'Accept: application/json'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "count": 1,
  "campaigns": [
    {
      "id": "promo_capicombovideo_18_10_25",
      "name": "Promo CapiCombo con Video",
      "templateName": "capicombo_video",
      "description": "Campaña de marketing...",
      "created": 1760811345784,
      "active": true,
      "stats": {
        "totalSent": 77,
        "delivered": 66,
        "read": 9,
        "failed": 7,
        "reactions": 0
      }
    }
  ]
}
```

**Frecuencia recomendada:** Cada 30 minutos

---

### 3. Detalle de Campaña Específica

**Descripción:** Obtiene información detallada de una campaña individual.

```bash
curl --location 'https://capibobbabot.onrender.com/api/marketing/campaign/promo_capicombovideo_18_10_25' \
--header 'Accept: application/json'
```

**Con variable Postman:**
```bash
curl --location '{{BASE_URL}}/api/marketing/campaign/{{CAMPAIGN_ID}}' \
--header 'Accept: application/json'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "campaign": {
    "id": "promo_capicombovideo_18_10_25",
    "name": "Promo CapiCombo con Video",
    "templateName": "capicombo_video",
    "description": "Campaña de marketing con video...",
    "created": 1760811345784,
    "active": true,
    "stats": {
      "totalSent": 77,
      "delivered": 66,
      "read": 9,
      "failed": 7,
      "reactions": 0
    }
  }
}
```

**Frecuencia recomendada:** Cada 10 minutos

---

### 4. Estadísticas Completas de Campaña ⭐

**Descripción:** Estadísticas detalladas con tasas de conversión, distribución de estados y análisis de reacciones.

```bash
curl --location 'https://capibobbabot.onrender.com/api/marketing/campaign/promo_capicombovideo_18_10_25/stats' \
--header 'Accept: application/json'
```

**Con variable Postman:**
```bash
curl --location '{{BASE_URL}}/api/marketing/campaign/{{CAMPAIGN_ID}}/stats' \
--header 'Accept: application/json'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "stats": {
    "campaign": {
      "id": "promo_capicombovideo_18_10_25",
      "name": "Promo CapiCombo con Video",
      "templateName": "capicombo_video",
      "created": 1760811345784,
      "active": true
    },
    "stats": {
      "totalSent": 77,
      "delivered": 66,
      "read": 9,
      "failed": 7,
      "reactions": 0,
      "deliveryRate": 85.7,
      "readRate": 11.7,
      "failureRate": 9.1,
      "engagementRate": 0
    },
    "reactions": {
      "total": 0,
      "distribution": {},
      "topEmojis": []
    },
    "messages": {
      "total": 84,
      "byStatus": {
        "sent": 6,
        "delivered": 61,
        "read": 9,
        "failed": 8
      }
    }
  }
}
```

**Frecuencia recomendada:** Cada 5 minutos (endpoint principal de monitoreo)

---

### 5. Lista de Mensajes de Campaña

**Descripción:** Obtiene todos los mensajes enviados en una campaña con sus estados individuales.

```bash
curl --location 'https://capibobbabot.onrender.com/api/marketing/campaign/promo_capicombovideo_18_10_25/messages' \
--header 'Accept: application/json'
```

**Con variable Postman:**
```bash
curl --location '{{BASE_URL}}/api/marketing/campaign/{{CAMPAIGN_ID}}/messages' \
--header 'Accept: application/json'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "messages": [
    {
      "messageId": "wamid.HBgNNTIxNTUyMjQwMzQ3N...",
      "campaignId": "promo_capicombovideo_18_10_25",
      "recipient": "5215512345678",
      "status": "delivered",
      "timestamps": {
        "sent": 1760811400000,
        "delivered": 1760811450000,
        "read": null
      },
      "reactions": []
    },
    ...
  ],
  "count": 84
}
```

**Frecuencia recomendada:** Cada 15 minutos o cuando necesites ver mensajes específicos

---

### 6. Análisis de Reacciones

**Descripción:** Análisis detallado de reacciones con sentimiento, emojis más usados y patrones.

```bash
curl --location 'https://capibobbabot.onrender.com/api/marketing/campaign/promo_capicombovideo_18_10_25/reactions' \
--header 'Accept: application/json'
```

**Con variable Postman:**
```bash
curl --location '{{BASE_URL}}/api/marketing/campaign/{{CAMPAIGN_ID}}/reactions' \
--header 'Accept: application/json'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "stats": {
    "total": 0,
    "bySentiment": {
      "positive": 0,
      "negative": 0,
      "neutral": 0
    },
    "byEmoji": {},
    "topEmojis": [],
    "sentimentRate": {
      "positive": 0,
      "negative": 0,
      "neutral": 0
    }
  },
  "timeline": [],
  "patterns": {
    "alerts": [],
    "insights": []
  }
}
```

**Frecuencia recomendada:** Cada 20 minutos

---

## 🔧 Endpoints de Gestión

### 7. Crear Nueva Campaña

**Descripción:** Crea una nueva campaña de marketing.

```bash
curl --location 'https://capibobbabot.onrender.com/api/marketing/campaign/create' \
--header 'Content-Type: application/json' \
--data '{
  "id": "promo_capicombo_nov_2025",
  "name": "Promoción CapiCombo Noviembre",
  "templateName": "capicombo_promo_nov",
  "description": "Campaña especial de CapiCombo para noviembre 2025"
}'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Campaña creada exitosamente",
  "campaign": {
    "id": "promo_capicombo_nov_2025",
    "name": "Promoción CapiCombo Noviembre",
    "templateName": "capicombo_promo_nov",
    "description": "Campaña especial...",
    "created": 1760900000000,
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

### 8. Cambiar Estado de Campaña (Activar/Desactivar)

**Descripción:** Activa o desactiva una campaña existente.

**Desactivar campaña:**
```bash
curl --location --request PATCH 'https://capibobbabot.onrender.com/api/marketing/campaign/promo_capicombovideo_18_10_25/status' \
--header 'Content-Type: application/json' \
--data '{
  "active": false
}'
```

**Activar campaña:**
```bash
curl --location --request PATCH 'https://capibobbabot.onrender.com/api/marketing/campaign/promo_capicombovideo_18_10_25/status' \
--header 'Content-Type: application/json' \
--data '{
  "active": true
}'
```

**Con variable Postman:**
```bash
curl --location --request PATCH '{{BASE_URL}}/api/marketing/campaign/{{CAMPAIGN_ID}}/status' \
--header 'Content-Type: application/json' \
--data '{
  "active": false
}'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Estado de campaña actualizado",
  "campaign": {
    "id": "promo_capicombovideo_18_10_25",
    "active": false
  }
}
```

---

### 9. Registrar Mensaje (Usado por n8n)

**Descripción:** Registra un nuevo mensaje enviado desde n8n. Este endpoint es usado internamente por el workflow.

```bash
curl --location 'https://capibobbabot.onrender.com/api/marketing/register-message' \
--header 'Content-Type: application/json' \
--data '{
  "messageId": "wamid.HBgNNTIxNTUyMjQwMzQ3NRUCABIYIDY0ODhFMTdDMjc2OEJCNDY4MUFGMTI4RjY4ODJDNDE3AA==",
  "campaignId": "promo_capicombovideo_18_10_25",
  "recipient": "5215512345678",
  "templateName": "capicombo_video",
  "status": "sent"
}'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Mensaje registrado exitosamente",
  "messageId": "wamid.HBgNNTI..."
}
```

---

## 📊 Dashboard Manual en Postman

### Crear un Monitor en Postman

1. **Importar colección**: Guarda todos estos endpoints en una colección de Postman
2. **Crear Monitor**:
   - Frequency: Every 5 minutes
   - Endpoints a monitorear:
     - Dashboard Stats
     - Estadísticas Completas de Campaña
3. **Configurar Tests** en cada endpoint para alertas:

```javascript
// Test para alertas de tasa de entrega baja
pm.test("Tasa de entrega aceptable", function () {
    const jsonData = pm.response.json();
    const deliveryRate = jsonData.stats.stats.deliveryRate;
    pm.expect(deliveryRate).to.be.above(80); // Alerta si baja de 80%
});

// Test para alertas de tasa de fallas alta
pm.test("Tasa de fallas aceptable", function () {
    const jsonData = pm.response.json();
    const failureRate = jsonData.stats.stats.failureRate;
    pm.expect(failureRate).to.be.below(10); // Alerta si sube de 10%
});

// Test para monitorear crecimiento de lecturas
pm.test("Mensajes están siendo leídos", function () {
    const jsonData = pm.response.json();
    const readRate = jsonData.stats.stats.readRate;
    pm.expect(readRate).to.be.above(0); // Alerta si nadie lee
});
```

---

## 🔄 Flujo de Monitoreo Recomendado

### Cada 5 minutos:
1. **Estadísticas Completas** - `/campaign/{id}/stats` - Monitoreo principal

### Cada 15 minutos:
1. **Dashboard General** - `/dashboard-stats` - Vista global
2. **Lista de Mensajes** - `/campaign/{id}/messages` - Verificar nuevos estados

### Cada 30 minutos:
1. **Listar Campañas** - `/campaigns` - Verificar todas las campañas activas
2. **Análisis de Reacciones** - `/campaign/{id}/reactions` - Análisis de engagement

---

## 📈 Métricas Clave a Monitorear

### KPIs Críticos:

1. **Tasa de Entrega (Delivery Rate)**
   - Meta: > 85%
   - Crítico: < 75%
   - Endpoint: `/campaign/{id}/stats`
   - Campo: `stats.deliveryRate`

2. **Tasa de Lectura (Read Rate)**
   - Meta: > 30%
   - Aceptable: > 15%
   - Bajo: < 10%
   - Endpoint: `/campaign/{id}/stats`
   - Campo: `stats.readRate`

3. **Tasa de Fallas (Failure Rate)**
   - Meta: < 5%
   - Aceptable: < 10%
   - Crítico: > 15%
   - Endpoint: `/campaign/{id}/stats`
   - Campo: `stats.failureRate`

4. **Tasa de Engagement (Engagement Rate)**
   - Meta: > 5%
   - Aceptable: > 2%
   - Bajo: < 1%
   - Endpoint: `/campaign/{id}/stats`
   - Campo: `stats.engagementRate`

---

## 🚨 Alertas y Umbrales

### Configurar Alertas en Postman Monitor:

```javascript
// En Tests de cada endpoint:

// 1. Alerta de tasa de entrega baja
if (jsonData.stats.stats.deliveryRate < 75) {
    console.log("⚠️ ALERTA: Tasa de entrega crítica: " + jsonData.stats.stats.deliveryRate + "%");
}

// 2. Alerta de tasa de fallas alta
if (jsonData.stats.stats.failureRate > 15) {
    console.log("🔴 CRÍTICO: Tasa de fallas muy alta: " + jsonData.stats.stats.failureRate + "%");
}

// 3. Alerta de engagement muy bajo
if (jsonData.stats.stats.readRate < 10 && jsonData.stats.stats.totalSent > 50) {
    console.log("⚠️ ALERTA: Muy pocas lecturas: " + jsonData.stats.stats.readRate + "%");
}

// 4. Alerta de mensajes sin entregar
const pendingSent = jsonData.stats.messages.byStatus.sent;
if (pendingSent > 10) {
    console.log("⚠️ ALERTA: " + pendingSent + " mensajes aún en estado 'sent'");
}
```

---

## 📋 Checklist de Monitoreo Diario

### Mañana (9:00 AM):
- [ ] Revisar Dashboard General
- [ ] Verificar tasas de entrega de ayer
- [ ] Analizar reacciones acumuladas
- [ ] Identificar mensajes fallidos

### Mediodía (2:00 PM):
- [ ] Revisar estadísticas de campaña actual
- [ ] Verificar crecimiento de lecturas
- [ ] Monitorear nuevas reacciones

### Tarde (6:00 PM):
- [ ] Análisis completo del día
- [ ] Exportar datos si es necesario
- [ ] Planificar ajustes para mañana

---

## 🔐 Seguridad y Buenas Prácticas

1. **No exponer endpoints públicamente** - Solo usar internamente
2. **Monitorear rate limiting** - Los endpoints tienen límites de requests
3. **No hacer polling muy frecuente** - Respetar intervalos recomendados
4. **Guardar datos históricos** - Exportar JSONs periódicamente hasta tener dashboard

---

## 📦 Importar en Postman

### Método 1: Manual
1. Crear nueva colección: "CapiBobbaBot Marketing"
2. Crear carpetas:
   - "📊 Monitoreo" (endpoints de lectura)
   - "🔧 Gestión" (endpoints de escritura)
3. Agregar cada endpoint como request
4. Configurar variables de entorno

### Método 2: JSON de Colección
(Se puede generar un archivo JSON de colección Postman si lo requieres)

---

## 🆘 Troubleshooting

### Error 404 - Not Found
- Verificar que el deploy esté completo en Render
- Confirmar que la URL base sea correcta
- Verificar que el campaignId exista

### Error 500 - Internal Server Error
- Revisar logs en Render Dashboard
- Verificar que Redis esté conectado
- Verificar que el formato del JSON sea correcto

### Tiempos de respuesta lentos (> 10s)
- Normal para endpoints de stats con muchos datos
- Considerar reducir frecuencia de polling
- Verificar estado del servidor en `/health`

---

## 📌 Próximos Pasos

Una vez implementado el dashboard Next.js:

1. **Migrar a dashboard web** con gráficos interactivos
2. **Configurar WebSocket** para updates en tiempo real
3. **Implementar exportación** a CSV/Excel
4. **Agregar comparativas** entre campañas
5. **Implementar A/B testing** visual

---

**Versión:** 1.0.0
**Fecha:** 2025-10-18
**Campaña actual:** `promo_capicombovideo_18_10_25`
**Autor:** CapiBobbaBot Team

---

## 📞 Soporte

Para más información:
- Ver [EJEMPLO_USO.md](EJEMPLO_USO.md) - Guía de integración con n8n
- Ver [README.md](README.md) - Overview del sistema
- Revisar [../project.md](../project.md) - Arquitectura completa
