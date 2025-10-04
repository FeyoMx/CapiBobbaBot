# ✅ Implementación de Retry Logic - CapiBobba Workflow

**Fecha:** 4 de Octubre 2025
**Workflow:** CapiBobba Enhanced - Complete Message Processor
**Objetivo:** Prevenir pérdida de mensajes/pedidos por errores temporales

---

## 📊 Resumen de Implementación

### Nodos Configurados con Retry Logic

#### ✅ **1. Enhanced Message Normalizer** (ID: enhanced-normalizer)
- **Retry On Fail:** ✅ Activado
- **Max Tries:** 3
- **Wait Between Tries:** 1000ms (1 segundo)
- **Razón:** Nodo crítico donde ocurrieron 20+ errores el 1 Oct 2025

#### ✅ **2. Save Order to Pedidos CapiBobba** (ID: be356931-e736-49af-be70-4fb72efdb8dd)
- **Retry On Fail:** ✅ Activado
- **Max Tries:** 3
- **Wait Between Tries:** 2000ms (2 segundos)
- **Razón:** Nodo CRÍTICO - prevenir pérdida de pedidos por errores de API de Google

#### ✅ **3. Look Up Customer** (ID: 892179a6-63f1-444e-bb15-7dd0574888fb)
- **Retry On Fail:** ✅ Activado
- **Max Tries:** 2
- **Wait Between Tries:** 1500ms (1.5 segundos)
- **Razón:** Evitar fallos en búsqueda de clientes por errores temporales de Google Sheets API

#### ✅ **4. Create New Customer** (ID: 6d861c01-4b6c-4d0e-b166-2bf6a4d6803c)
- **Retry On Fail:** ✅ Activado
- **Max Tries:** 3
- **Wait Between Tries:** 2000ms (2 segundos)
- **Razón:** Asegurar que todos los clientes nuevos se registren correctamente

---

## ✅ Nodos Adicionales Configurados

### Google Sheets
- [x] **Update Existing Customer** (ID: 3eff5145-7ce7-49d0-b99b-1ec5c12068b0)
  - Configuración: 2 tries, 1500ms wait
  - **Línea workflow.json:** 546-548

### HTTP Request Nodes
- [x] **Get WhatsApp Media Info** (ID: 56073321-53fa-48e1-9d83-e5439433d4dd)
  - Configuración: 3 tries, 2000ms wait
  - **Línea workflow.json:** 588-590

- [x] **Download Image** (ID: aae3eb21-124f-4979-9219-cbdf49a7a170)
  - Configuración: 3 tries, 2000ms wait
  - **Línea workflow.json:** 621-623

### Google Drive
- [x] **Guarda comprobante** (ID: 7fb860af-6d0e-4ae1-91cb-e94964277458)
  - Configuración: 3 tries, 2500ms wait
  - **Línea workflow.json:** 1551-1553

### Telegram Nodes
- [x] **Send Telegram Notification** (ID: send-telegram)
  - Configuración: 2 tries, 1000ms wait
  - **Línea workflow.json:** 65-67

- [x] **Send Order Alert** (ID: order-telegram)
  - Configuración: 3 tries, 1500ms wait
  - **Línea workflow.json:** 147-149

---

## 📈 Beneficios Esperados

### Antes de Retry Logic
- ❌ Error → Mensaje/Pedido perdido inmediatamente
- ❌ 28% tasa de error (28/100 ejecuciones)
- ❌ Incidente del 1 Oct: 20+ mensajes consecutivos perdidos
- ❌ Pérdida estimada: $2,000 MXN en pedidos

### Después de Retry Logic (Proyección)
- ✅ Error → 2-3 intentos automáticos antes de fallar
- ✅ ~90% de errores temporales resueltos en retry
- ✅ Solo errores persistentes llegan a Error Workflow
- ✅ **Reducción estimada: 90% en mensajes/pedidos perdidos**
- ✅ Tasa de error proyectada: <5%

---

## 🔧 Configuración Aplicada por Tipo de Nodo

| Tipo de Nodo | Max Tries | Wait (ms) | Razón |
|--------------|-----------|-----------|-------|
| Code Nodes (Enhanced Normalizer) | 3 | 1000 | Errores de lógica temporal |
| Google Sheets (Save Order) | 3 | 2000 | API crítica, rate limits |
| Google Sheets (Lookup) | 2 | 1500 | Operaciones de lectura |
| Google Sheets (Create/Update) | 3 | 2000 | Operaciones de escritura |
| HTTP Request | 3 | 2000 | APIs externas con latencia |
| Google Drive | 3 | 2500 | Upload requiere más tiempo |
| Telegram (Normal) | 2 | 1000 | API rápida |
| Telegram (Order Alert) | 3 | 1500 | CRÍTICO - alertas de pedidos |

---

## 🧪 Plan de Pruebas

### Test 1: Verificar Retry en Enhanced Normalizer
```javascript
// Código de prueba temporal (REMOVER DESPUÉS)
if (Math.random() > 0.7) throw new Error('Test error - retry logic');
```

**Pasos:**
1. Agregar código de prueba al inicio del Enhanced Normalizer
2. Enviar mensaje de WhatsApp de prueba
3. Verificar en logs de n8n que:
   - Primer intento falla
   - Segundo intento (después de 1s) ejecuta correctamente
4. Remover código de prueba

### Test 2: Verificar Retry en Google Sheets
1. Cambiar temporalmente ID de Google Sheet a uno inválido
2. Intentar enviar pedido
3. Verificar que hace 3 intentos con 2s de espera
4. Restaurar ID correcto

### Test 3: Verificar Error Workflow
1. Causar 3+ errores consecutivos (después de retries)
2. Verificar que Error Workflow captura el error
3. Verificar que llega alerta crítica a Telegram
4. Verificar registro en Google Sheets Error Log

---

## 📋 Checklist de Implementación Final

### Completado ✅
- [x] Enhanced Message Normalizer (3 tries, 1s)
- [x] Save Order to Pedidos CapiBobba (3 tries, 2s)
- [x] Look Up Customer (2 tries, 1.5s)
- [x] Create New Customer (3 tries, 2s)

### Completado ✅
- [x] Update Existing Customer (2 tries, 1.5s)
- [x] Get WhatsApp Media Info HTTP (3 tries, 2s)
- [x] Download Image HTTP (3 tries, 2s)
- [x] Guarda comprobante Drive (3 tries, 2.5s)
- [x] Send Telegram Notification (2 tries, 1s)
- [x] Send Order Alert Telegram (3 tries, 1.5s)

### Validación Final 🔍
- [ ] Importar workflow.json modificado a n8n
- [ ] Activar workflow
- [ ] Ejecutar tests de prueba
- [ ] Monitorear logs por 24 horas
- [ ] Verificar reducción en tasa de errores
- [ ] Documentar resultados

---

## 🚨 Errores que NO Deben Reintentar

Configuración inteligente para evitar loops infinitos:

### Errores de Autenticación (NO retry)
- 401 Unauthorized
- 403 Forbidden
- Invalid credentials

### Errores de Validación (NO retry)
- 400 Bad Request
- Errores de formato de datos
- Campos requeridos faltantes

### Errores de Configuración (NO retry)
- Sheet/Document no encontrado
- Permisos insuficientes
- URL inválida

### Solo Reintentar 🔄
- 500 Internal Server Error
- 503 Service Unavailable
- Network timeout
- Connection refused
- Rate limit (429)

---

## 🔗 Archivos Relacionados

- **Configuración Original:** [retry_logic_config.md](retry_logic_config.md)
- **Error Workflow:** [error_workflow.json](error_workflow.json)
- **Roadmap Completo:** [ROADMAP_MEJORAS_WORKFLOW.md](ROADMAP_MEJORAS_WORKFLOW.md)

---

## 📝 Notas de Implementación

### Cambios Realizados al Workflow
1. **workflow.json línea 28-30:** Retry logic en Enhanced Message Normalizer
2. **workflow.json línea 899-901:** Retry logic en Save Order to Pedidos CapiBobba
3. **workflow.json línea 189-191:** Retry logic en Look Up Customer
4. **workflow.json línea 378-380:** Retry logic en Create New Customer

### Próximos Pasos
1. Completar configuración de nodos restantes
2. Eliminar nodo duplicado "Pedidos CapiBobba" (ID: 2f816cef-98b3-4fbe-a5a2-b90d7556906a)
3. Importar Error Workflow a n8n
4. Crear sheet "Error_Log" en Google Sheets
5. Ejecutar pruebas de validación

---

**Impacto Esperado:**
🎯 **Reducción de 90% en pérdida de mensajes/pedidos**
💰 **Prevención de ~$1,800 MXN en pérdidas mensuales**
⏱️ **Tiempo de implementación total: 2-3 horas**
