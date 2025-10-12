# 🔧 Fix para Workflow de Análisis de Sentimiento en n8n

**Fecha:** 2025-10-11
**Workflow ID:** `uSJRH8iFs9zHds01`
**Problema:** El workflow no reconoce mensajes de encuesta

---

## 🔍 **Diagnóstico del Problema**

### **Causa Raíz:**
El workflow está usando el endpoint **`/api/survey/results`** que devuelve un objeto JSON complejo diseñado para el dashboard:

```json
{
  "success": true,
  "data": {
    "npsScore": 50,
    "recentSurveys": [...]  // ← Encuestas anidadas aquí
  }
}
```

El nodo **"Filter Unprocessed Comments"** espera recibir un **array directo** de surveys:

```json
[
  {"from": "521...", "rating": 5, "comment": "..."},
  {"from": "521...", "rating": 2, "comment": "..."}
]
```

---

## ✅ **Solución Implementada**

### **1. Nuevo Endpoint Creado: `/api/survey/raw`**

**Ubicación:** `chatbot.js:3356-3379`

**Respuesta:**
```json
[
  {
    "from": "5217712416450",
    "rating": 5,
    "timestamp": "2025-10-11T14:00:00Z",
    "comment": "Excelente servicio, muy rápido",
    "commentTimestamp": "2025-10-11T14:30:00Z"
  },
  {
    "from": "5215529480727",
    "rating": 2,
    "timestamp": "2025-10-11T15:00:00Z",
    "comment": "Tardó mucho la entrega",
    "commentTimestamp": "2025-10-11T15:30:00Z"
  }
]
```

**Características:**
- ✅ Array directo sin wrapper
- ✅ Todos los campos necesarios para análisis
- ✅ Optimizado para n8n
- ✅ Lectura directa de `survey_log.jsonl`

---

## 🚀 **Pasos para Implementar el Fix en n8n**

### **Paso 1: Acceder al Workflow**

1. Abrir: https://n8n-autobot-634h.onrender.com
2. Login con credenciales de admin
3. Buscar workflow: **"Sentiment Analyzer - CapiBobba"**
4. ID del workflow: `uSJRH8iFs9zHds01`
5. Click en **"Edit"**

---

### **Paso 2: Editar Nodo "Config"**

1. Click en el nodo **"Config"** (segundo nodo del workflow)
2. Buscar la sección `capibobbaApi` en el código JavaScript
3. **Cambiar:**

```javascript
// ❌ ANTES (incorrecto)
capibobbaApi: {
  baseUrl: 'https://capibobbabot.onrender.com',
  surveyEndpoint: '/api/survey/results'
}
```

```javascript
// ✅ DESPUÉS (correcto)
capibobbaApi: {
  baseUrl: 'https://capibobbabot.onrender.com',
  surveyEndpoint: '/api/survey/raw'
}
```

4. Click en **"Execute Node"** para probar
5. Verificar que el output contenga el endpoint correcto
6. Click en **"Save"**

---

### **Paso 3: Probar Nodo "Read Survey Results"**

1. Click en el nodo **"Read Survey Results"** (tercer nodo)
2. Click en **"Execute Node"**
3. Verificar que la respuesta sea un **array directo** de surveys:

```json
[
  {
    "from": "521...",
    "rating": 5,
    "comment": "...",
    "timestamp": "..."
  }
]
```

4. Si ves `{"success": true, "data": {...}}`, el cambio no se aplicó correctamente

---

### **Paso 4: Probar Nodo "Filter Unprocessed Comments"**

1. Click en el nodo **"Filter Unprocessed Comments"** (quinto nodo)
2. Click en **"Execute Node"**
3. Revisar los **logs** en la consola del nodo:

**Esperado (correcto):**
```
🔍 Iniciando filtrado de comentarios no procesados
📊 Total de surveys recibidos: 10
✅ Comentarios a procesar: 3
🎯 Procesando 3 comentarios en esta ejecución
```

**Antes del fix (incorrecto):**
```
🔍 Iniciando filtrado de comentarios no procesados
📊 Total de surveys recibidos: 1
✅ Comentarios a procesar: 0
```

---

### **Paso 5: Testing End-to-End**

1. Click en el botón **"Execute Workflow"** (botón play arriba)
2. Esperar a que se ejecuten todos los nodos
3. Verificar que:
   - ✅ "Read Survey Results" devuelve array de surveys
   - ✅ "Filter Unprocessed Comments" encuentra comentarios
   - ✅ "Call Gemini AI" procesa los comentarios
   - ✅ "Save to Sentiment Analysis" guarda en Google Sheets

---

### **Paso 6: Activar Workflow**

1. Click en el toggle **"Active"** (esquina superior derecha)
2. El workflow se ejecutará automáticamente cada **15 minutos**
3. Horario: **9:00 AM - 10:00 PM** (Zona horaria: México)

---

## 🔍 **Validación del Fix**

### **Verificar que el Fix Funciona:**

1. **Esperar próxima ejecución automática** (cada 15 minutos)
2. **Revisar logs de ejecución:**
   - n8n Dashboard → Executions → "Sentiment Analyzer - CapiBobba"
   - Verificar que el nodo "Filter Unprocessed Comments" muestre:
     ```
     📊 Total de surveys recibidos: [número > 0]
     ✅ Comentarios a procesar: [número]
     ```

3. **Verificar Google Sheets:**
   - Abrir: [Google Sheet de Sentiment Analysis](https://docs.google.com/spreadsheets/d/1qOh0cKQgcVDmwYe8OeiUXUDU6vTJjknVaH8UKI6Ao_A)
   - Verificar que se agreguen nuevas filas con:
     - `Timestamp`
     - `Phone`
     - `Rating`
     - `Comment`
     - `Sentiment` (positive/neutral/negative/very_negative)
     - `Sentiment_Score`
     - `Summary`

4. **Verificar alertas de Telegram:**
   - Si hay comentarios negativos (rating 1-2), verificar que llegue alerta a Telegram
   - Formato esperado:
     ```
     😟🚨 Comentario NEGATIVE

     👤 Cliente: 521...
     ⭐☆☆☆☆ Rating: 2/5
     ⏰ Fecha: 11/10/2025 15:00

     💬 Comentario:
     "Tardó mucho la entrega"

     📊 Análisis IA:
     • Sentimiento: negative (40%)
     • Temas: delivery_time, customer_service
     • Urgencia: high
     • Acción requerida: Sí ✅
     ```

---

## 📊 **Comparación: Antes vs Después**

| Aspecto | Antes del Fix | Después del Fix |
|---------|--------------|-----------------|
| **Endpoint usado** | `/api/survey/results` | `/api/survey/raw` |
| **Estructura de respuesta** | Objeto wrapeado | Array directo |
| **Surveys recibidos por n8n** | 0-1 (solo wrapper) | 10+ (todos los surveys) |
| **Comentarios procesados** | 0 | 3-10 por ejecución |
| **Análisis de Gemini** | No se ejecuta | Se ejecuta correctamente |
| **Guardado en Sheets** | No se guarda | Se guarda correctamente |
| **Alertas de Telegram** | No se envían | Se envían para negativos |

---

## 🧪 **Testing Manual con Datos Reales**

### **Simular una Encuesta Completa:**

1. **Enviar un pedido desde WhatsApp** al bot de CapiBobba
2. **Completar el pedido** (dirección, pago, etc.)
3. **Esperar que n8n envíe la encuesta** (automáticamente después del pedido)
4. **Responder la encuesta:**
   - Enviar un número del 1-5: `4`
   - Enviar un comentario: `Muy rico pero tardó un poco`
5. **Verificar que se registre en `survey_log.jsonl`:**
   ```bash
   tail -1 survey_log.jsonl
   ```
6. **Esperar próxima ejecución del workflow** (máximo 15 minutos)
7. **Verificar que aparezca en Google Sheets** con análisis de Gemini

---

## 🚨 **Troubleshooting**

### **Problema: Workflow sigue sin detectar encuestas**

**Solución 1:** Verificar que el cambio se guardó
```bash
# En n8n, nodo Config, verificar:
surveyEndpoint: '/api/survey/raw'  // ← Debe decir 'raw', no 'results'
```

**Solución 2:** Verificar que el endpoint responde
```bash
curl https://capibobbabot.onrender.com/api/survey/raw
# Debe devolver un array JSON
```

**Solución 3:** Verificar que hay encuestas disponibles
```bash
# El archivo survey_log.jsonl debe tener contenido
wc -l survey_log.jsonl  # Debe ser > 0
```

---

### **Problema: Error en nodo HTTP Request**

**Error posible:**
```
Error: Request failed with status code 500
```

**Solución:**
1. Verificar logs de CapiBobbaBot en Render:
   ```
   https://dashboard.render.com/web/srv-XXX/logs
   ```
2. Buscar errores relacionados con `/api/survey/raw`
3. Verificar que el deploy del fix se completó correctamente

---

### **Problema: Gemini no analiza correctamente**

**Síntomas:**
- Se detectan comentarios pero no se guardan en Sheets
- Errores en nodo "Call Gemini AI"

**Solución:**
1. Verificar que `GEMINI_API_KEY` esté configurada en n8n
2. Verificar límites de rate de Gemini API
3. Revisar logs del nodo "Parse Gemini Response" para errores

---

## 📁 **Archivos Relacionados**

- **Backend endpoint:** `chatbot.js:3356-3379` (`/api/survey/raw`)
- **Workflow JSON:** `workflow_analysis/sentiment_workflow_complete.json`
- **Documentación workflow:** `workflow_analysis/SENTIMENT_WORKFLOW.md`
- **Log de encuestas:** `survey_log.jsonl` (en servidor)

---

## ✅ **Checklist de Implementación**

- [ ] Acceder a n8n workflow `uSJRH8iFs9zHds01`
- [ ] Editar nodo "Config"
- [ ] Cambiar endpoint de `/api/survey/results` a `/api/survey/raw`
- [ ] Guardar cambios
- [ ] Probar nodo "Read Survey Results"
- [ ] Probar nodo "Filter Unprocessed Comments"
- [ ] Ejecutar workflow completo manualmente
- [ ] Activar workflow
- [ ] Esperar primera ejecución automática (15 min)
- [ ] Verificar logs de ejecución
- [ ] Verificar Google Sheets se actualiza
- [ ] Verificar alertas de Telegram funcionan
- [ ] Marcar como completado en documentación

---

## 📞 **Soporte**

Si el problema persiste después de implementar este fix:

1. **Revisar logs detallados en n8n:**
   - Executions → Click en ejecución fallida → Ver detalles de cada nodo

2. **Verificar endpoint en producción:**
   ```bash
   curl https://capibobbabot.onrender.com/api/survey/raw
   ```

3. **Contactar al equipo de desarrollo** con:
   - ID de ejecución fallida en n8n
   - Logs del servidor CapiBobbaBot
   - Timestamp del error

---

**Última actualización:** 2025-10-11
**Versión del fix:** 1.0.0
**Estado:** ✅ Listo para implementar
