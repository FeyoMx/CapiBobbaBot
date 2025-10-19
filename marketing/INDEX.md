# 📚 Índice del Sistema de Marketing - CapiBobbaBot

**Sistema de Tracking de Campañas de WhatsApp Marketing v2.14.0**

---

## 🎯 Inicio Rápido

**¿Primera vez aquí?** Sigue este orden:

1. 📖 **[README.md](README.md)** - Empieza aquí para entender el sistema
2. 🚀 **[QUICK_START_MONITORING.md](QUICK_START_MONITORING.md)** - Guía de 5 minutos para monitorear
3. 📊 **[REPORTE_CAMPAÑA_ACTUAL.md](REPORTE_CAMPAÑA_ACTUAL.md)** - Ver estadísticas actuales
4. 📮 **[POSTMAN_COLLECTION.md](POSTMAN_COLLECTION.md)** - Configurar Postman
5. 🔧 **[EJEMPLO_USO.md](EJEMPLO_USO.md)** - Integrar con n8n

---

## 📁 Guía de Archivos

### 🚀 Para Empezar

| Archivo | Descripción | Para quién | Tiempo de lectura |
|---------|-------------|------------|-------------------|
| **[README.md](README.md)** | Overview del sistema completo | Todos | 5 min |
| **[QUICK_START_MONITORING.md](QUICK_START_MONITORING.md)** | Guía rápida para monitorear campañas | Administradores | 5 min |
| **[INDEX.md](INDEX.md)** | Este archivo - Índice de documentación | Todos | 2 min |

### 📊 Análisis y Reportes

| Archivo | Descripción | Para quién | Actualización |
|---------|-------------|------------|---------------|
| **[DASHBOARD_IMPLEMENTADO.md](DASHBOARD_IMPLEMENTADO.md)** | ✨ Dashboard React con visualizaciones Recharts | Todos | 2025-10-18 |
| **[REPORTE_CAMPAÑA_ACTUAL.md](REPORTE_CAMPAÑA_ACTUAL.md)** | Análisis detallado de la campaña activa | Marketing/Gerencia | Diaria |

### 🔧 Desarrollo e Integración

| Archivo | Descripción | Para quién | Complejidad |
|---------|-------------|------------|-------------|
| **[EJEMPLO_USO.md](EJEMPLO_USO.md)** | Guía completa de integración con n8n | Desarrolladores | Media |
| **[POSTMAN_COLLECTION.md](POSTMAN_COLLECTION.md)** | Documentación de endpoints | Desarrolladores/QA | Baja |
| **[campaign-tracker.js](campaign-tracker.js)** | Código del sistema de tracking | Desarrolladores | Alta |
| **[reaction-handler.js](reaction-handler.js)** | Código del procesador de reacciones | Desarrolladores | Alta |

### 🧪 Testing

| Archivo | Descripción | Plataforma | Uso |
|---------|-------------|------------|-----|
| **[test-endpoints.ps1](test-endpoints.ps1)** | Script de pruebas automatizadas | Windows | Testing |
| **[test-endpoints.sh](test-endpoints.sh)** | Script de pruebas automatizadas | Linux/Mac | Testing |
| **[monitor-campaign.ps1](monitor-campaign.ps1)** | Monitor visual en tiempo real | Windows | Monitoreo |

### 📦 Colecciones

| Archivo | Descripción | Formato | Uso |
|---------|-------------|---------|-----|
| **[CapiBobbaBot_Marketing.postman_collection.json](CapiBobbaBot_Marketing.postman_collection.json)** | Colección de Postman lista para importar | JSON | Importar en Postman |

---

## 🎯 Casos de Uso

### Quiero monitorear la campaña actual

**Ruta recomendada:**
1. Leer [QUICK_START_MONITORING.md](QUICK_START_MONITORING.md)
2. Ejecutar monitor: `.\marketing\monitor-campaign.ps1`
3. Ver reporte: [REPORTE_CAMPAÑA_ACTUAL.md](REPORTE_CAMPAÑA_ACTUAL.md)

**Tiempo total:** 10 minutos

---

### Quiero crear una nueva campaña

**Ruta recomendada:**
1. Leer sección "Endpoints de Gestión" en [POSTMAN_COLLECTION.md](POSTMAN_COLLECTION.md#🔧-endpoints-de-gestión)
2. Usar endpoint `POST /api/marketing/campaign/create`
3. Verificar en dashboard: `GET /api/marketing/campaigns`

**Ejemplo rápido:**
```bash
curl -X POST https://capibobbabot.onrender.com/api/marketing/campaign/create \
  -H "Content-Type: application/json" \
  -d '{
    "id": "nueva_campana",
    "name": "Nueva Campaña",
    "templateName": "template_nombre",
    "description": "Descripción"
  }'
```

---

### Quiero integrar con n8n

**Ruta recomendada:**
1. Leer [EJEMPLO_USO.md](EJEMPLO_USO.md) completo
2. Seguir sección "2. Integrar con n8n"
3. Implementar nodos según la guía
4. Probar con mensaje de prueba

**Tiempo estimado:** 30-45 minutos

---

### Quiero usar Postman para monitorear

**Ruta recomendada:**
1. Importar colección: [CapiBobbaBot_Marketing.postman_collection.json](CapiBobbaBot_Marketing.postman_collection.json)
2. Leer [POSTMAN_COLLECTION.md](POSTMAN_COLLECTION.md)
3. Configurar variables de entorno
4. Crear monitor automático (opcional)

**Tiempo estimado:** 15 minutos

---

### Quiero entender el código

**Ruta recomendada:**
1. Leer [README.md](README.md) para contexto
2. Revisar [campaign-tracker.js](campaign-tracker.js) (tracking principal)
3. Revisar [reaction-handler.js](reaction-handler.js) (análisis de reacciones)
4. Ver [EJEMPLO_USO.md](EJEMPLO_USO.md) para casos de uso

**Conocimientos previos:** Node.js, Express, Redis

---

### Quiero ver estadísticas rápidamente

**Opción 1: Terminal (Windows)**
```powershell
.\marketing\monitor-campaign.ps1
```

**Opción 2: Browser**
- Stats: https://capibobbabot.onrender.com/api/marketing/campaign/promo_capicombovideo_18_10_25/stats
- Dashboard: https://capibobbabot.onrender.com/api/marketing/dashboard-stats

**Opción 3: Reporte**
Leer [REPORTE_CAMPAÑA_ACTUAL.md](REPORTE_CAMPAÑA_ACTUAL.md)

---

## 📊 Estructura de la Documentación

```
marketing/
│
├─ 📖 Documentos de Referencia
│  ├─ README.md ........................... Overview del sistema
│  ├─ INDEX.md ............................ Este archivo (índice)
│  ├─ QUICK_START_MONITORING.md ........... Guía rápida de 5 min
│  └─ REPORTE_CAMPAÑA_ACTUAL.md ........... Análisis de campaña actual
│
├─ 🔧 Guías Técnicas
│  ├─ EJEMPLO_USO.md ...................... Integración con n8n
│  └─ POSTMAN_COLLECTION.md ............... Documentación de endpoints
│
├─ 💻 Código
│  ├─ campaign-tracker.js ................. Sistema de tracking
│  └─ reaction-handler.js ................. Procesador de reacciones
│
├─ 🧪 Testing
│  ├─ test-endpoints.ps1 .................. Tests para Windows
│  ├─ test-endpoints.sh ................... Tests para Linux/Mac
│  └─ monitor-campaign.ps1 ................ Monitor visual Windows
│
└─ 📦 Colecciones
   └─ CapiBobbaBot_Marketing.postman_collection.json
```

---

## 🔗 Enlaces Importantes

### Documentación
- 📖 [README.md](README.md) - Overview completo
- 🚀 [QUICK_START_MONITORING.md](QUICK_START_MONITORING.md) - Empezar en 5 min
- 📊 [REPORTE_CAMPAÑA_ACTUAL.md](REPORTE_CAMPAÑA_ACTUAL.md) - Análisis actual
- 📮 [POSTMAN_COLLECTION.md](POSTMAN_COLLECTION.md) - Endpoints
- 🔧 [EJEMPLO_USO.md](EJEMPLO_USO.md) - Integración n8n

### Endpoints en Producción
- **Stats:** https://capibobbabot.onrender.com/api/marketing/campaign/promo_capicombovideo_18_10_25/stats
- **Dashboard:** https://capibobbabot.onrender.com/api/marketing/dashboard-stats
- **Campaigns:** https://capibobbabot.onrender.com/api/marketing/campaigns
- **Health:** https://capibobbabot.onrender.com/health

### Sistema General
- **Arquitectura:** [../project.md](../project.md)
- **README Principal:** [../README.md](../README.md)
- **Monitoring Dashboard:** https://capibobbabot.onrender.com/monitoring

---

## 📈 Roadmap de Lectura

### Nivel Principiante (Usuarios/Marketing)

**Objetivo:** Entender y monitorear campañas

1. ✅ [README.md](README.md) - 5 min
2. ✅ [QUICK_START_MONITORING.md](QUICK_START_MONITORING.md) - 5 min
3. ✅ [REPORTE_CAMPAÑA_ACTUAL.md](REPORTE_CAMPAÑA_ACTUAL.md) - 10 min
4. ✅ [POSTMAN_COLLECTION.md](POSTMAN_COLLECTION.md) (solo sección de monitoreo) - 10 min

**Total:** ~30 minutos

---

### Nivel Intermedio (Developers/QA)

**Objetivo:** Integrar y testear el sistema

1. ✅ [README.md](README.md) - 5 min
2. ✅ [EJEMPLO_USO.md](EJEMPLO_USO.md) - 20 min
3. ✅ [POSTMAN_COLLECTION.md](POSTMAN_COLLECTION.md) - 15 min
4. ✅ Ejecutar `test-endpoints.ps1` - 5 min
5. ✅ Revisar [campaign-tracker.js](campaign-tracker.js) (overview) - 15 min

**Total:** ~60 minutos

---

### Nivel Avanzado (Senior Developers)

**Objetivo:** Entender arquitectura completa y contribuir

1. ✅ [README.md](README.md) - 5 min
2. ✅ [campaign-tracker.js](campaign-tracker.js) (completo) - 30 min
3. ✅ [reaction-handler.js](reaction-handler.js) (completo) - 20 min
4. ✅ [EJEMPLO_USO.md](EJEMPLO_USO.md) - 20 min
5. ✅ [../project.md](../project.md) (sección marketing) - 15 min

**Total:** ~90 minutos

---

## 🆘 Troubleshooting Rápido

### "No sé por dónde empezar"
→ Ve a [QUICK_START_MONITORING.md](QUICK_START_MONITORING.md)

### "Necesito monitorear la campaña YA"
→ Ejecuta: `.\marketing\monitor-campaign.ps1`

### "Quiero ver las estadísticas actuales"
→ Lee: [REPORTE_CAMPAÑA_ACTUAL.md](REPORTE_CAMPAÑA_ACTUAL.md)

### "Necesito integrar con n8n"
→ Lee: [EJEMPLO_USO.md](EJEMPLO_USO.md)

### "Quiero usar Postman"
→ Importa: [CapiBobbaBot_Marketing.postman_collection.json](CapiBobbaBot_Marketing.postman_collection.json)
→ Lee: [POSTMAN_COLLECTION.md](POSTMAN_COLLECTION.md)

### "No entiendo el código"
→ Revisa: [campaign-tracker.js](campaign-tracker.js) y [reaction-handler.js](reaction-handler.js)
→ Contexto: [../project.md](../project.md)

---

## 📊 Métricas del Sistema de Documentación

**Documentos:** 8 archivos principales
**Código:** 2 módulos principales (~940 líneas)
**Scripts:** 3 scripts de utilidad
**Colecciones:** 1 colección Postman (9 endpoints)

**Cobertura:**
- ✅ Quick Start Guide
- ✅ Documentación completa de endpoints
- ✅ Guía de integración n8n
- ✅ Análisis de campaña actual
- ✅ Scripts de monitoreo
- ✅ Tests automatizados
- ✅ Colección Postman
- ✅ Índice de navegación

---

## 🔄 Actualizaciones

**Última actualización de documentación:** 2025-10-18

**Próximas actualizaciones:**
- [ ] Dashboard Next.js (en roadmap)
- [ ] Sistema de exportación CSV/Excel
- [ ] Gráficos interactivos con Recharts
- [ ] Alertas automáticas vía WhatsApp
- [ ] Comparativas A/B testing

---

## 📞 Soporte

**¿Encontraste un error en la documentación?**
- Revisar [../project.md](../project.md) para contexto adicional
- Consultar logs en Render Dashboard
- Verificar que el sistema esté actualizado

**¿Necesitas una nueva feature?**
- Revisar roadmap en [../project.md](../project.md)
- Documentar el caso de uso
- Proponer implementación

---

**Sistema:** CapiBobbaBot Marketing Tracking v2.14.0
**Documentación:** v1.0.0
**Fecha:** 2025-10-18
**Autor:** CapiBobbaBot Development Team
