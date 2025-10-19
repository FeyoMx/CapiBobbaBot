# Sistema de Tracking de Campañas de Marketing 📊📲

Sistema completo para rastrear, analizar y medir el rendimiento de campañas de marketing de WhatsApp.

## 🚀 Quick Start

> **🎯 NUEVO:** ¿Necesitas empezar a monitorear YA? Ve directo a [QUICK_START_MONITORING.md](QUICK_START_MONITORING.md)

### 1. Verificar que el Deploy esté Completo

```bash
# Verificar health del servidor
curl https://capibobbabot.onrender.com/health

# Verificar que los endpoints de marketing estén disponibles
curl https://capibobbabot.onrender.com/api/marketing/campaigns
```

### 2. Ejecutar Tests Automáticos

**Windows (PowerShell):**
```powershell
.\marketing\test-endpoints.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x marketing/test-endpoints.sh
./marketing/test-endpoints.sh
```

### 3. Crear Primera Campaña

```bash
curl -X POST https://capibobbabot.onrender.com/api/marketing/campaign/create \
  -H "Content-Type: application/json" \
  -d '{
    "id": "mi_primera_campana",
    "name": "Mi Primera Campaña",
    "templateName": "nombre_plantilla_meta",
    "description": "Descripción de la campaña"
  }'
```

### 4. Monitorear Campaña

**Opción A: Monitor en Tiempo Real (Windows)**
```powershell
# Monitor visual en terminal que se actualiza automáticamente
.\marketing\monitor-campaign.ps1 -campaignId "promo_capicombovideo_18_10_25" -interval 30
```

**Opción B: Postman**
```bash
# Importar la colección desde:
marketing\CapiBobbaBot_Marketing.postman_collection.json

# O seguir la guía completa en:
marketing\POSTMAN_COLLECTION.md
```

**Opción C: cURL Manual**
```bash
# Ver estadísticas completas
curl https://capibobbabot.onrender.com/api/marketing/campaign/promo_capicombovideo_18_10_25/stats
```

### 5. Integrar con n8n

Ver guía detallada en [EJEMPLO_USO.md](EJEMPLO_USO.md#2-integrar-con-n8n)

## 📁 Archivos en este Directorio

### Código
- **campaign-tracker.js** - Módulo principal de tracking (560 líneas)
- **reaction-handler.js** - Procesador de reacciones (380 líneas)

### Documentación
- **README.md** - Este archivo (overview del sistema)
- **QUICK_START_MONITORING.md** - 🚀 Guía rápida de 5 minutos (NUEVO)
- **EJEMPLO_USO.md** - Guía completa de uso con ejemplos
- **POSTMAN_COLLECTION.md** - 📮 Guía de endpoints para Postman (NUEVO)
- **REPORTE_CAMPAÑA_ACTUAL.md** - 📊 Análisis de la campaña actual (NUEVO)

### Testing y Scripts
- **test-endpoints.ps1** - Script de pruebas para Windows
- **test-endpoints.sh** - Script de pruebas para Linux/Mac
- **monitor-campaign.ps1** - 📊 Monitor en tiempo real para Windows (NUEVO)

### Colecciones
- **CapiBobbaBot_Marketing.postman_collection.json** - Colección Postman lista para importar (NUEVO)

## 🔧 Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/marketing/register-message` | Registrar mensaje desde n8n |
| POST | `/api/marketing/campaign/create` | Crear nueva campaña |
| GET | `/api/marketing/campaigns` | Listar todas las campañas |
| GET | `/api/marketing/campaign/:id` | Detalle de campaña |
| GET | `/api/marketing/campaign/:id/stats` | Estadísticas completas |
| GET | `/api/marketing/campaign/:id/messages` | Mensajes de campaña |
| GET | `/api/marketing/campaign/:id/reactions` | Análisis de reacciones |
| GET | `/api/marketing/dashboard-stats` | Stats generales |
| PATCH | `/api/marketing/campaign/:id/status` | Activar/desactivar |

## 📊 Estructura de Datos

### Campaña
```javascript
{
  id: "promo_capicombo_2025_01",
  name: "Promoción Capicombo Enero",
  templateName: "capicombo_promo_v2",
  description: "...",
  created: 1705000000000,
  active: true,
  stats: {
    totalSent: 150,
    delivered: 145,
    read: 120,
    failed: 5,
    reactions: 45
  }
}
```

### Mensaje
```javascript
{
  messageId: "wamid.xxx...",
  campaignId: "promo_capicombo_2025_01",
  recipient: "5215512345678",
  status: "read",
  timestamps: {
    sent: 1705001000000,
    delivered: 1705001050000,
    read: 1705002000000
  },
  reactions: [
    { emoji: "👍", userId: "521...", timestamp: ..., sentiment: "positive" }
  ]
}
```

## ✅ Checklist Post-Deploy

- [ ] Deploy completado en Render (status: Live)
- [ ] Health check responde correctamente
- [ ] Endpoints de marketing disponibles
- [ ] Tests automáticos ejecutados y pasados
- [ ] Primera campaña creada
- [ ] Workflow de n8n modificado
- [ ] Mensajes de prueba enviados
- [ ] Estados capturados correctamente
- [ ] Reacciones funcionando

## 📖 Documentación Completa

### Para Desarrollo e Integración
Ver [EJEMPLO_USO.md](EJEMPLO_USO.md) para:
- Guía paso a paso de integración con n8n
- Ejemplos de cURL para todos los endpoints
- Estructura de nodos para workflow
- Troubleshooting y mejores prácticas
- Casos de uso reales

### Para Monitoreo con Postman
Ver [POSTMAN_COLLECTION.md](POSTMAN_COLLECTION.md) para:
- Endpoints listos para copiar/pegar en Postman
- Configuración de variables de entorno
- Tests automatizados para alertas
- KPIs y umbrales recomendados
- Flujo de monitoreo diario
- Dashboard manual en Postman

## 🆘 Soporte

Si encuentras algún problema:
1. Revisar logs en Render: Dashboard > Logs
2. Verificar que Redis esté conectado
3. Consultar [EJEMPLO_USO.md#troubleshooting](EJEMPLO_USO.md#troubleshooting)
4. Revisar [project.md](../project.md) para contexto del sistema

## 📈 Próximos Pasos

1. **Testing:** Probar con campaña real de marketing
2. **Dashboard:** Crear páginas `/marketing` en Next.js
3. **Analytics:** Gráficos interactivos con Recharts
4. **Exportación:** Reportes CSV/JSON
5. **Alertas:** Notificaciones automáticas de anomalías

---

**Versión:** 2.14.0
**Fecha:** 2025-10-18
**Commit:** cc7084a
