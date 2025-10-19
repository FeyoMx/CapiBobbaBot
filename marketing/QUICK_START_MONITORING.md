# 🚀 Quick Start - Monitoreo de Campañas

Guía de 5 minutos para empezar a monitorear tus campañas de marketing.

---

## 📱 Opción 1: Monitor Visual en Terminal (RECOMENDADO)

### Windows PowerShell

```powershell
# Navegar a la carpeta del proyecto
cd c:\Users\luis_\OneDrive\Documents\DevWork\CapiBobbaBot

# Ejecutar monitor en tiempo real
.\marketing\monitor-campaign.ps1 -campaignId "promo_capicombovideo_18_10_25" -interval 30
```

**¿Qué hace esto?**
- 📊 Muestra estadísticas en tiempo real con colores
- 🔄 Se actualiza automáticamente cada 30 segundos
- 🚨 Alerta visualmente si hay problemas
- 💯 Calcula KPIs y tasas automáticamente

**Parámetros:**
- `-campaignId`: ID de la campaña a monitorear
- `-interval`: Segundos entre cada actualización (default: 30)

---

## 📮 Opción 2: Postman (Para Tests y Debugging)

### Paso 1: Importar Colección

1. Abrir Postman
2. Click en "Import"
3. Seleccionar archivo: `marketing\CapiBobbaBot_Marketing.postman_collection.json`

### Paso 2: Configurar Variables

En Postman, ir a la colección > Variables y verificar:

```
BASE_URL = https://capibobbabot.onrender.com
CAMPAIGN_ID = promo_capicombovideo_18_10_25
```

### Paso 3: Endpoints Clave

Ejecutar en este orden:

1. **📊 Monitoreo > ⭐ Estadísticas Completas** - Ver métricas principales
2. **📊 Monitoreo > Lista de Mensajes** - Ver mensajes individuales
3. **📊 Monitoreo > Dashboard General** - Vista global de todas las campañas

### Paso 4: Crear Monitor (Opcional)

Para monitoreo automático:

1. Click en colección > "..." > "Monitor collection"
2. Configurar:
   - **Name:** CapiBobbaBot Marketing Monitor
   - **Frequency:** Every 5 minutes
   - **Endpoints:** Seleccionar "Estadísticas Completas"
3. Save Monitor

---

## 💻 Opción 3: cURL Directo

### Estadísticas Completas

```bash
curl https://capibobbabot.onrender.com/api/marketing/campaign/promo_capicombovideo_18_10_25/stats | json_pp
```

### Dashboard General

```bash
curl https://capibobbabot.onrender.com/api/marketing/dashboard-stats | json_pp
```

### Lista de Mensajes

```bash
curl https://capibobbabot.onrender.com/api/marketing/campaign/promo_capicombovideo_18_10_25/messages | json_pp
```

### Análisis de Reacciones

```bash
curl https://capibobbabot.onrender.com/api/marketing/campaign/promo_capicombovideo_18_10_25/reactions | json_pp
```

---

## 📊 Qué Métricas Revisar

### Cada 5 minutos:
- ✅ **Tasa de Entrega** (debe ser >85%)
- 👁️ **Tasa de Lectura** (meta >30%)
- ❌ **Tasa de Fallas** (debe ser <10%)

### Cada 15 minutos:
- 📨 **Mensajes en tránsito** (debe reducirse a 0)
- 😀 **Reacciones** (monitorear engagement)

### Cada hora:
- 📈 **Tendencias generales**
- 🎯 **Comparar con metas**

---

## 🚨 Alertas Críticas

### Tasa de Entrega <75%
```
🔴 CRÍTICO: Revisar inmediatamente
- Verificar conexión a WhatsApp Cloud API
- Revisar logs de errores
- Validar números de teléfono
```

### Tasa de Fallas >15%
```
🔴 CRÍTICO: Posible problema sistémico
- Revisar rate limiting de WhatsApp
- Verificar validez de números
- Revisar logs en Render
```

### Tasa de Lectura <10% después de 48h
```
⚠️ ALERTA: Problema de engagement
- Revisar horario de envío
- Mejorar copy del mensaje
- Considerar follow-up
```

---

## 📱 Comandos Rápidos de Gestión

### Crear Nueva Campaña

```bash
curl -X POST https://capibobbabot.onrender.com/api/marketing/campaign/create \
  -H "Content-Type: application/json" \
  -d '{
    "id": "nueva_campana_nov_2025",
    "name": "Nueva Campaña Noviembre",
    "templateName": "template_nombre",
    "description": "Descripción"
  }'
```

### Desactivar Campaña Actual

```bash
curl -X PATCH https://capibobbabot.onrender.com/api/marketing/campaign/promo_capicombovideo_18_10_25/status \
  -H "Content-Type: application/json" \
  -d '{"active": false}'
```

### Activar Campaña

```bash
curl -X PATCH https://capibobbabot.onrender.com/api/marketing/campaign/promo_capicombovideo_18_10_25/status \
  -H "Content-Type: application/json" \
  -d '{"active": true}'
```

---

## 📁 Exportar Datos

### Exportar a JSON

```bash
# Estadísticas completas
curl https://capibobbabot.onrender.com/api/marketing/campaign/promo_capicombovideo_18_10_25/stats > stats_$(date +%Y%m%d).json

# Todos los mensajes
curl https://capibobbabot.onrender.com/api/marketing/campaign/promo_capicombovideo_18_10_25/messages > messages_$(date +%Y%m%d).json

# Reacciones
curl https://capibobbabot.onrender.com/api/marketing/campaign/promo_capicombovideo_18_10_25/reactions > reactions_$(date +%Y%m%d).json
```

### PowerShell (Windows)

```powershell
# Estadísticas con timestamp
$date = Get-Date -Format "yyyyMMdd_HHmmss"
Invoke-RestMethod "https://capibobbabot.onrender.com/api/marketing/campaign/promo_capicombovideo_18_10_25/stats" | ConvertTo-Json -Depth 10 | Out-File "stats_$date.json"
```

---

## 🔗 Enlaces Rápidos

### Documentación Completa
- [POSTMAN_COLLECTION.md](POSTMAN_COLLECTION.md) - Todos los endpoints con ejemplos
- [REPORTE_CAMPAÑA_ACTUAL.md](REPORTE_CAMPAÑA_ACTUAL.md) - Análisis detallado de la campaña actual
- [EJEMPLO_USO.md](EJEMPLO_USO.md) - Integración con n8n y casos de uso
- [README.md](README.md) - Overview del sistema

### Endpoints Directos
- **Stats:** https://capibobbabot.onrender.com/api/marketing/campaign/promo_capicombovideo_18_10_25/stats
- **Dashboard:** https://capibobbabot.onrender.com/api/marketing/dashboard-stats
- **Campaigns:** https://capibobbabot.onrender.com/api/marketing/campaigns

### Sistema
- **Health:** https://capibobbabot.onrender.com/health
- **Metrics:** https://capibobbabot.onrender.com/metrics
- **Monitoring:** https://capibobbabot.onrender.com/monitoring

---

## 💡 Tips Pro

### 1. Crear Alias de PowerShell

Agregar al perfil de PowerShell (`$PROFILE`):

```powershell
function Monitor-Campaign {
    param([string]$id = "promo_capicombovideo_18_10_25")
    cd c:\Users\luis_\OneDrive\Documents\DevWork\CapiBobbaBot
    .\marketing\monitor-campaign.ps1 -campaignId $id -interval 30
}

# Uso: Monitor-Campaign
# O:    Monitor-Campaign -id "otra_campana"
```

### 2. Crear Scheduled Task (Windows)

Para monitoreo automático en segundo plano:

```powershell
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File c:\Users\luis_\OneDrive\Documents\DevWork\CapiBobbaBot\marketing\monitor-campaign.ps1"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 15)
Register-ScheduledTask -TaskName "CapiBobbaBot Monitor" -Action $action -Trigger $trigger
```

### 3. Webhook para Alertas

Configurar webhook en Postman Monitor para recibir notificaciones:

1. Postman > Monitor > Integrations
2. Slack/Discord/Email
3. Configurar umbrales de alerta

---

## ❓ Troubleshooting Rápido

### Error: "Cannot connect to server"

```powershell
# Verificar que el servidor esté up
curl https://capibobbabot.onrender.com/health

# Si no responde:
# 1. Revisar logs en Render Dashboard
# 2. Verificar que el deploy esté completo
# 3. Esperar 1-2 minutos (cold start)
```

### Error: "Campaign not found"

```bash
# Listar todas las campañas disponibles
curl https://capibobbabot.onrender.com/api/marketing/campaigns

# Verificar el ID exacto de tu campaña
```

### Script PowerShell no ejecuta

```powershell
# Habilitar ejecución de scripts (solo primera vez)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Verificar política actual
Get-ExecutionPolicy
```

---

## 📞 Soporte

**¿Necesitas ayuda?**

1. Revisar [POSTMAN_COLLECTION.md](POSTMAN_COLLECTION.md) para troubleshooting detallado
2. Consultar [REPORTE_CAMPAÑA_ACTUAL.md](REPORTE_CAMPAÑA_ACTUAL.md) para contexto de la campaña
3. Revisar logs en Render: https://dashboard.render.com
4. Verificar documentación completa en [README.md](README.md)

---

**Última actualización:** 2025-10-18
**Versión:** 1.0.0
**Sistema:** CapiBobbaBot Marketing v2.14.0
