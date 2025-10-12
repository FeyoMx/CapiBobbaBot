# 📊 Workflow: Análisis de Sentimientos de Encuestas - CapiBobbaBot

**Versión:** 1.0.0
**Estado:** ✅ Implementado en n8n (activo)
**Última actualización:** 12 de Octubre, 2025
**Archivo JSON:** [Análisis de Sentimientos - Encuestas CapiBobba.json](Análisis%20de%20Sentimientos%20-%20Encuestas%20CapiBobba.json)
**Workflow ID:** `uSJRH8iFs9zHds01`

---

## 🎯 Resumen Ejecutivo

### Propósito
Analizar automáticamente comentarios de encuestas de satisfacción de clientes usando **Google Gemini 2.5 Flash AI** para extraer sentimientos, identificar temas clave y generar alertas proactivas.

### Beneficios Clave
- 🤖 Análisis automático con Gemini 2.5 Flash
- 📊 Insights estructurados (10 métricas por comentario)
- 🚨 Alertas Telegram para comentarios críticos
- 📈 Métricas agregadas en Google Sheets
- 💡 Decisiones basadas en datos reales

---

## 🏗️ Arquitectura del Workflow

### Flujo Completo (14 nodos)

```
⏰ Trigger cada 15 min (9am-9pm)
    ↓
📊 Read API (/api/survey/raw)
    ↓
🔍 Filter JavaScript (max 20)
    ↓
🔄 Loop (1 comentario/vez)
    ↓
🤖 Gemini 2.5 Flash ← Nodo nativo n8n
    ↓
🧠 Extract JSON
    ↓
⏱️ Wait 1s
    ↓
💾 Update Redis
    ↓
📊 Save Sheets
    ↓
    ├→ 😟 If Negativo → 📱 Format → 📢 Telegram
    └→ 📊 Calc Stats → 📈 Save Stats
```

**Nota clave:** Este workflow **NO tiene nodo "Split into Batches of 10"**. Solo tiene el loop individual.

---

## 📋 Nodos Detallados

### 1-4: Preparación y Filtrado

**1. ⏰ Trigger** (`scheduleTrigger`)
- Cron: `*/15 9-21 * * *` (cada 15 min, 9am-9:59pm)

**2. 📊 Read API** (`httpRequest`)
- Endpoint: `/api/survey/raw` ← Nota: es "raw", no "results"
- Timeout: 10s, 3 reintentos

**3. 🔍 Filter** (`code`)
- Filtra comentarios sin `sentiment` ya analizado
- Límite: 20 comentarios/ejecución

**4. 🔄 Loop** (`splitInBatches`)
- Batch size: 1 (procesa uno a la vez)

---

### 5-6: Análisis con IA

**5. 🤖 Message a model** (`@n8n/n8n-nodes-langchain.googleGemini`)
**Modelo:** `gemini-2.5-flash`
**Credential:** `Google Gemini(PaLM) Api` (ID: `xKR94u7Ntn5sqaF1`)

**Prompt:**
```
RATING: {{ $json.rating }}/5
COMENTARIO: "{{ $json.comment }}"

Analizar y generar JSON con:
- sentiment: positive|neutral|negative|very_negative
- sentiment_score: 0.0-1.0
- topics: [max 3]
- key_phrases: [max 3]
- urgency: low|medium|high|critical
- actionable: true|false
- action_type
- summary_es
- customer_intent
- nps_alignment
```

**Config:**
- Temperature: 0.3
- Max tokens: 500
- JSON output: true

**6. 🧠 Extract** (`code`)
- Parse JSON de Gemini
- Validar campos requeridos
- Manejo de errores robusto

---

### 7-9: Persistencia

**7. ⏱️ Wait 1s** - Rate limiting

**8. 💾 Update Redis** (`httpRequest POST`)
- Endpoint: `/api/survey/update-sentiment`
- Guarda análisis completo en Redis

**9. 📊 Save Sheets** (`googleSheets`)
- Sheet: `1wPTRd3fknn-jBs_OvpoU8L8y7j3wtjCQqI4bxnYMqN0`
- Nombre: `SURVEY_SENTIMENT_ANALYSIS`
- 15 columnas mapeadas

---

### 10-12: Alertas Telegram

**10. 😟 If Negativo?** (`if`)
Condiciones (OR):
- sentiment === 'negative' || 'very_negative'
- urgency === 'high' || 'critical'

**11. 📱 Format Alert** (`code`)
Mensaje HTML con:
- Emojis dinámicos por urgency/sentiment/NPS
- Datos del comentario
- Análisis IA completo
- Link a Google Sheet

**12. 📢 Send Telegram** (`telegram`)
- Credential: `Telegram account 3` (ID: `pXgiAdNH5LwxlCKI`)
- Parse mode: HTML
- 3 reintentos

---

### 13-14: Estadísticas

**13. 📊 Calculate Stats** (`code`)
Calcula por ejecución:
- Totales por sentiment
- Totales por urgency
- Porcentajes
- Timestamp

**14. 📈 Save Stats** (`googleSheets`)
- Sheet: `1XP9c-Yg4Yxj9CmkMFurTGMMz9dqsQVC8pB4l0LDHJvQ`
- Nombre: `SENTIMENT_STATS`
- 14 columnas

---

## 🔧 Configuración

### Variables de Entorno
```bash
TELEGRAM_CHAT_ID=27606954
```

### Credenciales (ya configuradas)
1. **Google Service Account** (ID: `JbqYZ9uwPD4BpgyL`) - Sheets
2. **Telegram account 3** (ID: `pXgiAdNH5LwxlCKI`) - Alertas
3. **Google Gemini(PaLM) Api** (ID: `xKR94u7Ntn5sqaF1`) - IA

---

## 📊 Google Sheets

### Análisis Detallado
**ID:** `1wPTRd3fknn-jBs_OvpoU8L8y7j3wtjCQqI4bxnYMqN0`
**Columnas:** from, timestamp, rating, comment, sentiment, sentiment_score, topics, key_phrases, urgency, actionable, action_type, summary_es, customer_intent, nps_alignment, processed_at

### Estadísticas
**ID:** `1XP9c-Yg4Yxj9CmkMFurTGMMz9dqsQVC8pB4l0LDHJvQ`
**Columnas:** total, positive, neutral, negative, very_negative, errors, actionable, high_urgency, critical_urgency, positive_pct, negative_pct, actionable_pc, fecha_ejecucion, fecha_formato

---

## 📈 Performance

- **Processing:** ~3-5s por comentario
- **Rate limit:** 1s entre comentarios
- **Max/ejecución:** 20 comentarios
- **Frecuencia:** Cada 15 min, 9am-9:59pm
- **Ejecuciones/día:** ~52

---

## 🐛 Troubleshooting

### No ejecuta automáticamente
- Verificar estado "Active" ✅ en n8n
- Verificar hora: 9am-9:59pm México

### Gemini falla
- Verificar credencial: `xKR94u7Ntn5sqaF1`
- Revisar quota API en Google AI Studio

### Sheets no guarda
- Verificar credencial: `JbqYZ9uwPD4BpgyL`
- Verificar headers exactos en fila 1

### Telegram no envía
- Verificar `TELEGRAM_CHAT_ID`
- Verificar bot en el chat

---

## 📝 Diferencias Clave con Workflow Genérico

Este es el workflow **REAL implementado**, no un template:

| Aspecto | Template/Docs | Workflow Real |
|---------|---------------|---------------|
| **Nodos** | 16 nodos | **14 nodos** |
| **Split Batches** | Tiene nodo "Split into Batches of 10" | **NO existe este nodo** |
| **Gemini** | HTTP Request manual | **Nodo nativo @n8n/n8n-nodes-langchain** |
| **Endpoint API** | `/api/survey/results` | **`/api/survey/raw`** |
| **Credenciales** | Placeholders genéricos | **IDs reales configurados** |
| **Sheets** | IDs ejemplo | **IDs reales vinculados** |
| **Status** | Documentación | **✅ Activo en producción** |

---

## 📧 Soporte

**Workflow JSON:** [Análisis de Sentimientos - Encuestas CapiBobba.json](Análisis%20de%20Sentimientos%20-%20Encuestas%20CapiBobba.json)
**n8n:** https://app.n8n.io/workflows/uSJRH8iFs9zHds01
**Docs n8n:** https://docs.n8n.io
**Gemini Docs:** https://ai.google.dev/docs

---

**Última actualización:** 2025-10-12
**Workflow ID:** `uSJRH8iFs9zHds01`
**Estado:** ✅ Activo
