# 📊 Workflow: Análisis de Sentimientos de Encuestas - CapiBobbaBot

**Versión:** 1.0.0
**Estado:** ✅ Listo para implementar
**Última actualización:** 11 de Octubre, 2025
**Archivo JSON:** [sentiment_analysis_workflow.json](sentiment_analysis_workflow.json)

---

## 🎯 Resumen Ejecutivo

### Propósito
Analizar automáticamente los **comentarios de encuestas de satisfacción** de clientes usando **Google Gemini AI** para extraer sentimientos, identificar temas clave y generar alertas proactivas para comentarios negativos.

### Problema que Resuelve
- ❌ Comentarios de encuestas capturados pero **NO analizados**
- ❌ Sin visibilidad de satisfacción del cliente en tiempo real
- ❌ Comentarios negativos no detectados proactivamente
- ❌ Falta de insights sobre qué mejorar en productos/servicio

### Beneficios Clave
- 🤖 **Análisis automático** con IA (Google Gemini) de cada comentario
- 📊 **Insights estructurados** sobre sentimientos, temas y NPS
- 🚨 **Alertas inmediatas** vía Telegram para comentarios críticos
- 📈 **Métricas agregadas** guardadas en Google Sheets para reportes
- 💡 **Decisiones basadas en datos** sobre producto y servicio

---

## 🏗️ Arquitectura del Workflow

### Flujo de Datos

```
⏰ Trigger (cada 15 min)
    ↓
📊 Leer Encuestas desde API
    ↓
🔍 Filtrar Comentarios Sin Procesar
    ↓
📦 Dividir en Lotes (10 comentarios)
    ↓
🔄 Loop por Comentario
    ↓
🤖 Análisis con Gemini AI
    ↓
🧠 Extraer Resultado JSON
    ↓
⏱️ Wait 1s (Rate Limit)
    ↓
💾 Actualizar Encuesta en Redis
    ↓
📊 Guardar en Google Sheets
    ↓
    ├─→ 😟 ¿Negativo/Urgente? → 📱 Alerta Telegram
    └─→ 📊 Calcular Estadísticas → 📈 Guardar Stats
```

---

## 📋 Nodos del Workflow (16 nodos)

### 1. ⏰ **Trigger: Every 15 Minutes (9am-10pm)**
**Tipo:** `scheduleTrigger`
**Configuración:**
- **Cron Expression:** `*/15 9-22 * * *`
- **Timezone:** `America/Mexico_City`
- **Horario:** 9am - 10pm (horario comercial)
- **Frecuencia:** Cada 15 minutos

**Propósito:** Ejecutar el workflow regularmente durante horario comercial para analizar nuevos comentarios.

---

### 2. 📊 **Read Survey Results from API**
**Tipo:** `httpRequest` (GET)
**Endpoint:** `https://capibobbabot.onrender.com/api/survey/results`

**Configuración:**
- **Timeout:** 10s
- **Retry:** 3 intentos, 2s entre intentos
- **Response:** JSON completo

**Datos Recibidos:**
```json
{
  "success": true,
  "data": {
    "recentSurveys": [
      {
        "from": "5215512345678",
        "timestamp": "2025-10-11T20:15:32.000Z",
        "rating": 4,
        "comment": "Muy rico el bubble tea pero tardó mucho",
        "sentiment": null  // <- Sin analizar aún
      }
    ],
    "total": 25
  }
}
```

---

### 3. 🔍 **Filter Unprocessed Comments**
**Tipo:** `code` (JavaScript)
**Modo:** `runOnceForAllItems`

**Lógica de Filtrado:**
```javascript
// Filtra encuestas con comentarios sin procesar
const unprocessedComments = recentSurveys.filter(survey => {
  // Debe tener comentario no vacío
  if (!survey.comment || survey.comment.trim() === '') return false;

  // NO debe tener sentimiento ya analizado
  if (survey.sentiment) return false;

  // Debe tener rating válido (1-5)
  if (!survey.rating || survey.rating < 1 || survey.rating > 5) return false;

  return true;
});

// Limitar a 20 comentarios por ejecución
return unprocessedComments.slice(0, 20);
```

**Propósito:** Evitar re-procesar comentarios ya analizados y limitar carga a Gemini API.

---

### 4. 📦 **Split into Batches of 10**
**Tipo:** `splitInBatches`
**Batch Size:** 10 comentarios

**Propósito:** Dividir comentarios en lotes de 10 para procesamiento eficiente.

---

### 5. 🔄 **Loop Over Comments**
**Tipo:** `splitInBatches`
**Batch Size:** 1 (procesamiento individual)

**Propósito:** Iterar sobre cada comentario individualmente para análisis con Gemini.

---

### 6. 🤖 **Analyze Sentiment with Gemini**
**Tipo:** `httpRequest` (POST)
**Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent`

**Configuración:**
- **Modelo:** `gemini-1.5-flash-latest`
- **API Key:** `{{ $env.GEMINI_API_KEY }}`
- **Timeout:** 30s
- **Retry:** 3 intentos, 3s entre intentos
- **Continue on Fail:** ✅ (para procesar siguientes aunque uno falle)

**Prompt del Sistema:**
```
Analiza el siguiente comentario de una encuesta de satisfacción de CapiBobba.

RATING: {rating}/5 estrellas
COMENTARIO: "{comment}"

Genera un análisis JSON detallado (SOLO el JSON, sin markdown):

{
  "sentiment": "positive|neutral|negative|very_negative",
  "sentiment_score": 0.0-1.0,
  "topics": ["product_quality", "delivery_time", "customer_service", ...],
  "key_phrases": ["frase relevante del comentario"],
  "urgency": "low|medium|high|critical",
  "actionable": true|false,
  "action_type": "response_needed|investigation|improvement|none",
  "summary_es": "Resumen en español (1-2 líneas)",
  "customer_intent": "complaint|suggestion|praise|question",
  "nps_alignment": "detractor|passive|promoter"
}

CONTEXTO:
- Rating 1-2: Detractores (típicamente negativo)
- Rating 3: Pasivos (neutral)
- Rating 4-5: Promotores (positivo)
- CapiBobba vende: bubble tea, waffles de capibara, postres

REGLAS:
- Si rating ≤2 pero comentario positivo → sentiment=negative, urgency=high
- Si rating ≥4 pero comentario negativo → urgency=high
- topics: máximo 3 temas más relevantes
- key_phrases: extraer frases textuales (max 3)
- urgency: critical si rating=1 O palabras como "pésimo", "nunca más", "horrible"
```

**Configuración Gemini:**
```json
{
  "temperature": 0.3,
  "topK": 1,
  "topP": 0.95,
  "maxOutputTokens": 500,
  "responseMimeType": "application/json"
}
```

---

### 7. 🧠 **Extract Sentiment Analysis**
**Tipo:** `code` (JavaScript)
**Modo:** `runOnceForAllItems`

**Lógica:**
```javascript
// Extraer JSON de respuesta de Gemini
const response = item.json;
const text = response.candidates[0].content.parts[0].text;
const analysis = JSON.parse(text);

// Validar y estructurar datos
const validatedAnalysis = {
  sentiment: analysis.sentiment || 'unknown',
  sentiment_score: parseFloat(analysis.sentiment_score) || 0.5,
  topics: Array.isArray(analysis.topics) ? analysis.topics.slice(0, 3) : [],
  key_phrases: Array.isArray(analysis.key_phrases) ? analysis.key_phrases.slice(0, 3) : [],
  urgency: analysis.urgency || 'low',
  actionable: Boolean(analysis.actionable),
  action_type: analysis.action_type || 'none',
  summary_es: analysis.summary_es || 'Sin resumen',
  customer_intent: analysis.customer_intent || 'unknown',
  nps_alignment: analysis.nps_alignment || 'passive'
};

// Agregar metadatos
return {
  ...originalData,
  sentiment_analysis: validatedAnalysis,
  processed_at: new Date().toISOString(),
  processing_status: 'success'
};
```

**Manejo de Errores:**
- Si Gemini falla: `processing_status: 'error'`
- Si JSON inválido: `sentiment: 'error'`
- Continúa procesando siguientes comentarios

---

### 8. ⏱️ **Wait 1s (Rate Limit)**
**Tipo:** `wait`
**Duración:** 1000ms

**Propósito:** Respetar rate limits de Gemini API (60 requests/min).

---

### 9. 💾 **Update Survey with Sentiment**
**Tipo:** `httpRequest` (POST)
**Endpoint:** `https://capibobbabot.onrender.com/api/survey/update-sentiment`

**Body:**
```json
{
  "from": "5215512345678",
  "timestamp": "2025-10-11T20:15:32.000Z",
  "rating": 4,
  "comment": "Muy rico pero tardó mucho",
  "sentiment": "positive",
  "sentiment_score": 0.75,
  "topics": ["product_quality", "delivery_time"],
  "key_phrases": ["Muy rico", "tardó mucho"],
  "urgency": "medium",
  "actionable": true,
  "action_type": "improvement",
  "summary_es": "Cliente satisfecho con producto pero preocupado por tiempo de entrega",
  "customer_intent": "suggestion",
  "nps_alignment": "promoter",
  "processed_at": "2025-10-11T20:17:05.000Z"
}
```

**Propósito:** Guardar análisis en Redis para persistencia y consultas futuras.

---

### 10. 📊 **Save to Google Sheets**
**Tipo:** `googleSheets` (append)
**Sheet:** `SURVEY_SENTIMENT_ANALYSIS`
**Credential:** `Google Sheets OAuth2`

**Columnas Guardadas:**
| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| `Timestamp` | Fecha/hora del comentario | `2025-10-11 20:15:32` |
| `Phone` | Teléfono del cliente | `5215512345678` |
| `Rating` | Rating 1-5 | `4` |
| `Comment` | Comentario original | `"Muy rico pero tardó mucho"` |
| `Sentiment` | Clasificación | `positive` |
| `Sentiment_Score` | Score 0-1 | `0.75` |
| `Topics` | Temas separados por coma | `product_quality, delivery_time` |
| `Key_Phrases` | Frases clave | `Muy rico \| tardó mucho` |
| `Urgency` | Nivel de urgencia | `medium` |
| `Actionable` | Requiere acción | `YES` |
| `Action_Type` | Tipo de acción | `improvement` |
| `Summary` | Resumen en español | `Cliente satisfecho con producto...` |
| `Customer_Intent` | Intención del cliente | `suggestion` |
| `NPS_Alignment` | Clasificación NPS | `promoter` |
| `Processed_At` | Timestamp de procesamiento | `2025-10-11 20:17:05` |
| `Processing_Status` | Estado del procesamiento | `success` |

**Propósito:** Tener registro histórico completo para análisis y reportes.

---

### 11. 😟 **Is Negative or High Urgency?**
**Tipo:** `if` (condición)
**Combinator:** OR (cualquiera de estas condiciones)

**Condiciones:**
1. `sentiment === 'negative'`
2. `sentiment === 'very_negative'`
3. `urgency === 'high'`
4. `urgency === 'critical'`

**Propósito:** Filtrar comentarios que requieren atención inmediata para alertar vía Telegram.

---

### 12. 📱 **Format Telegram Alert**
**Tipo:** `code` (JavaScript)
**Modo:** `runOnceForEachItem`

**Formato del Mensaje:**
```
🚨😟🔴 ENCUESTA - NEGATIVE

👤 Cliente: 5215512345678
⭐ Rating: 2/5
📊 NPS: detractor
⏰ Fecha: 11/10/25 20:15

💬 Comentario:
"Tardó más de 1 hora, el bubble tea llegó tibio y el waffle frío"

🤖 Análisis IA:
• Sentimiento: negative (85%)
• Intención: complaint
• Temas: delivery_time, temperature, product_quality
• Urgencia: high
• Acción: investigation

📝 Resumen:
Cliente insatisfecho por demora en entrega y temperatura inadecuada de productos

🔑 Frases clave:
  • "Tardó más de 1 hora"
  • "bubble tea llegó tibio"
  • "waffle frío"

⚠️ Este comentario requiere atención inmediata

📊 Ver análisis completo (link a Google Sheets)
```

**Elementos Dinámicos:**
- Emojis según urgencia (🚨⚠️⚡💬)
- Emojis según sentimiento (😡😟😐😊)
- Indicador NPS (🔴🟡🟢)
- Formato HTML para Telegram

---

### 13. 📢 **Send Telegram Alert**
**Tipo:** `telegram` (sendMessage)
**Credential:** `Telegram Bot API`

**Configuración:**
- **Chat ID:** `{{ $env.TELEGRAM_CHAT_ID }}` (default: `27606954`)
- **Parse Mode:** HTML
- **Disable Notification:** ❌ (sí notificar)
- **Retry:** 3 intentos, 1.5s entre intentos

**Propósito:** Alertar al equipo inmediatamente sobre comentarios críticos.

---

### 14. 📊 **Calculate Statistics**
**Tipo:** `code` (JavaScript)
**Modo:** `runOnceForAllItems`

**Métricas Calculadas:**
```javascript
{
  total: 15,              // Total comentarios analizados
  positive: 8,            // Comentarios positivos
  neutral: 3,             // Comentarios neutrales
  negative: 3,            // Comentarios negativos
  very_negative: 1,       // Comentarios muy negativos
  errors: 0,              // Errores de procesamiento
  actionable: 4,          // Requieren acción
  high_urgency: 2,        // Urgencia alta
  critical_urgency: 1,    // Urgencia crítica
  positive_pct: "53.3",   // % positivos
  negative_pct: "26.7",   // % negativos
  actionable_pct: "26.7", // % accionables
  fecha_ejecucion: "2025-10-11T20:30:00.000Z",
  fecha_formato: "11/10/25 20:30"
}
```

---

### 15. 📈 **Save Statistics**
**Tipo:** `googleSheets` (append)
**Sheet:** `SENTIMENT_STATS`
**Credential:** `Google Sheets OAuth2`

**Columnas Guardadas:**
- `Fecha` - Timestamp legible
- `Total_Analizados` - Total procesados
- `Positivos`, `Neutrales`, `Negativos`, `Muy_Negativos` - Conteos
- `Errores` - Errores de procesamiento
- `Accionables` - Comentarios que requieren acción
- `Urgencia_Alta`, `Urgencia_Critica` - Conteos de urgencia
- `Positivos_Pct`, `Negativos_Pct`, `Accionables_Pct` - Porcentajes

**Propósito:** Tracking de tendencias a lo largo del tiempo para reportes ejecutivos.

---

## 🔧 Configuración Requerida

### Variables de Entorno (n8n)

```bash
# Google Gemini AI
GEMINI_API_KEY=tu_api_key_de_gemini

# Telegram Bot
TELEGRAM_CHAT_ID=27606954  # ID del chat/canal de alertas

# Google Sheets (opcional, usa default si no se especifica)
GOOGLE_SHEET_MESSAGES=1XGPUuCRzf2bEOm4UOPmjhnqUuNCsFyaL6Ycbqof_JuI
```

### Credenciales n8n

1. **Google Sheets OAuth2**
   - Nombre: `Google Sheets OAuth2`
   - Tipo: OAuth2
   - Permisos: Leer y escribir spreadsheets

2. **Telegram Bot API**
   - Nombre: `Telegram Bot API`
   - Token: Token del bot de Telegram
   - Chat ID configurado en variables de entorno

---

## 📊 Google Sheets: Estructura Requerida

### Sheet 1: `SURVEY_SENTIMENT_ANALYSIS`
**Headers (Fila 1):**
```
Timestamp | Phone | Rating | Comment | Sentiment | Sentiment_Score | Topics | Key_Phrases | Urgency | Actionable | Action_Type | Summary | Customer_Intent | NPS_Alignment | Processed_At | Processing_Status
```

### Sheet 2: `SENTIMENT_STATS`
**Headers (Fila 1):**
```
Fecha | Total_Analizados | Positivos | Neutrales | Negativos | Muy_Negativos | Errores | Accionables | Urgencia_Alta | Urgencia_Critica | Positivos_Pct | Negativos_Pct | Accionables_Pct
```

---

## 🚀 Setup e Instalación

### 1. **Importar Workflow a n8n**

```bash
# En n8n Dashboard
1. Click "Workflows" → "New"
2. Click "..." (menú) → "Import from File"
3. Seleccionar: workflow_analysis/sentiment_analysis_workflow.json
4. Click "Import"
```

### 2. **Configurar Credenciales**

**Google Sheets OAuth2:**
```bash
1. En n8n: "Credentials" → "Add Credential"
2. Buscar "Google Sheets"
3. Seguir flujo OAuth2 con cuenta de Google
4. Otorgar permisos a Google Sheets API
5. Guardar como "Google Sheets OAuth2"
```

**Telegram Bot API:**
```bash
1. Crear bot con @BotFather en Telegram
2. Copiar token del bot
3. En n8n: "Credentials" → "Add Credential" → "Telegram"
4. Pegar token
5. Guardar como "Telegram Bot API"
```

### 3. **Configurar Variables de Entorno**

En n8n (Settings → Environment Variables):
```bash
GEMINI_API_KEY=AIzaSy...tu_api_key_real
TELEGRAM_CHAT_ID=27606954
GOOGLE_SHEET_MESSAGES=1XGPUuCRzf2bEOm4UOPmjhnqUuNCsFyaL6Ycbqof_JuI
```

### 4. **Preparar Google Sheets**

```bash
1. Abrir: https://docs.google.com/spreadsheets/d/1XGPUuCRzf2bEOm4UOPmjhnqUuNCsFyaL6Ycbqof_JuI
2. Crear sheet "SURVEY_SENTIMENT_ANALYSIS" con headers especificados
3. Crear sheet "SENTIMENT_STATS" con headers especificados
4. Compartir con cuenta OAuth2 de n8n
```

### 5. **Validar Endpoints de API**

Verificar que estos endpoints estén funcionando:

```bash
# Leer encuestas
curl https://capibobbabot.onrender.com/api/survey/results
# Debe retornar: {success: true, data: {recentSurveys: [...]}}

# Actualizar sentimiento (POST)
# Endpoint debe existir y aceptar campos de sentiment
```

### 6. **Activar Workflow**

```bash
1. En n8n, abrir el workflow importado
2. Click "Active" toggle (arriba derecha)
3. Verificar que el switch esté en verde
4. Workflow comenzará a ejecutarse cada 15 minutos
```

---

## 🧪 Testing y Validación

### Test Manual del Workflow

```bash
1. En n8n, abrir workflow
2. Click "Execute Workflow" (botón de play)
3. Verificar logs en cada nodo
4. Confirmar que:
   - ✅ API responde con encuestas
   - ✅ Comentarios se filtran correctamente
   - ✅ Gemini analiza sentimientos
   - ✅ Se guardan en Redis
   - ✅ Se guardan en Google Sheets
   - ✅ Alertas Telegram se envían (si hay negativos)
```

### Test de Ejecución Programada

```bash
# Activar workflow y esperar 15 minutos
# Verificar en n8n > Executions:
1. Estado: Success ✅
2. Nodes ejecutados: 16/16
3. Items procesados: N comentarios
4. Duration: ~30-60s (depende de cantidad)
```

### Verificación de Datos

```bash
# Redis (comentarios actualizados)
redis-cli
> KEYS survey:*
> HGET survey:5215512345678:1234567890 sentiment

# Google Sheets
- Abrir SURVEY_SENTIMENT_ANALYSIS
- Verificar nuevas filas con sentimientos
- Abrir SENTIMENT_STATS
- Verificar estadísticas agregadas
```

---

## 📈 Métricas y KPIs

### Performance
- **Processing Time:** <5s por comentario
- **Batch Processing:** ~30-60s para 10-20 comentarios
- **API Timeout:** 30s Gemini, 10s otros endpoints

### Precisión
- **Accuracy Esperado:** >90% en clasificación de sentimientos
- **False Positives:** <5% (negativos clasificados como positivos)
- **False Negatives:** <10% (positivos clasificados como negativos)

### Operacionales
- **Uptime:** >99.5% (depende de n8n + Gemini + API)
- **Error Rate:** <1% (reintentos automáticos)
- **Alert Response:** <2 minutos desde comentario hasta Telegram

---

## 🐛 Troubleshooting

### Problema: Workflow no se ejecuta automáticamente

**Síntomas:**
- No hay ejecuciones en historial
- El toggle "Active" está en verde pero no hay actividad

**Soluciones:**
```bash
1. Verificar cron expression: */15 9-22 * * *
2. Verificar timezone: America/Mexico_City
3. Verificar hora actual en México (9am-10pm)
4. Reiniciar n8n: docker restart n8n
```

---

### Problema: Gemini API falla

**Síntomas:**
- Error: "API key not valid"
- Error: "Quota exceeded"
- `processing_status: 'error'`

**Soluciones:**
```bash
1. Verificar API key en variables de entorno
   - GEMINI_API_KEY debe ser válida
   - Ir a: https://makersuite.google.com/app/apikey

2. Verificar quota de Gemini
   - Free tier: 60 requests/min, 1500/día
   - Reducir batch size si se excede

3. Verificar prompt
   - Max tokens: 500 output
   - Response mime type: application/json
```

---

### Problema: Google Sheets no guarda datos

**Síntomas:**
- Error: "Permission denied"
- Error: "Sheet not found"

**Soluciones:**
```bash
1. Verificar credencial OAuth2
   - Reconectar si expiró
   - Otorgar permisos completos

2. Verificar sheets existen
   - SURVEY_SENTIMENT_ANALYSIS
   - SENTIMENT_STATS

3. Verificar headers correctos
   - Primera fila debe tener nombres exactos
   - Mayúsculas/minúsculas importan
```

---

### Problema: Alertas Telegram no llegan

**Síntomas:**
- No se reciben mensajes en Telegram
- Error: "Chat not found"

**Soluciones:**
```bash
1. Verificar Chat ID correcto
   - TELEGRAM_CHAT_ID en variables de entorno
   - Debe ser ID numérico (ej: 27606954)

2. Verificar bot tiene permisos
   - Bot debe estar en el chat/canal
   - Bot debe poder enviar mensajes

3. Verificar condición If
   - Solo envía si sentiment es negative/very_negative
   - O si urgency es high/critical
   - Probar con comentario negativo real
```

---

### Problema: Processing Status = 'error'

**Síntomas:**
- Encuestas procesadas pero sin análisis
- `sentiment: 'error'` en resultados

**Soluciones:**
```bash
1. Revisar logs de nodo "Extract Sentiment Analysis"
   - JSON parsing error → Gemini no devolvió JSON válido
   - Missing fields → Validación falló

2. Revisar respuesta de Gemini
   - Debe ser JSON puro (sin markdown)
   - responseMimeType: 'application/json' debe estar configurado

3. Reducir complejidad del prompt
   - Si Gemini falla mucho, simplificar análisis
```

---

## 📊 Ejemplos de Resultados Reales

### Comentario Positivo

**Input:**
```json
{
  "rating": 5,
  "comment": "¡Increíble el capigofre de Nutella! Llegó calientito y en 20 minutos. Excelente servicio 👏"
}
```

**Output Gemini:**
```json
{
  "sentiment": "positive",
  "sentiment_score": 0.95,
  "topics": ["product_quality", "delivery_time", "customer_service"],
  "key_phrases": ["Increíble el capigofre", "Llegó calientito", "Excelente servicio"],
  "urgency": "low",
  "actionable": false,
  "action_type": "none",
  "summary_es": "Cliente muy satisfecho con calidad del producto, temperatura ideal y tiempo de entrega rápido",
  "customer_intent": "praise",
  "nps_alignment": "promoter"
}
```

---

### Comentario Negativo

**Input:**
```json
{
  "rating": 1,
  "comment": "Pésimo servicio. Tardó 90 minutos y el bubble tea llegó tibio. NUNCA MÁS pido aquí."
}
```

**Output Gemini:**
```json
{
  "sentiment": "very_negative",
  "sentiment_score": 0.05,
  "topics": ["delivery_time", "temperature", "customer_service"],
  "key_phrases": ["Pésimo servicio", "Tardó 90 minutos", "NUNCA MÁS"],
  "urgency": "critical",
  "actionable": true,
  "action_type": "response_needed",
  "summary_es": "Cliente extremadamente insatisfecho por demora excesiva y temperatura inadecuada. Riesgo de perder cliente permanentemente",
  "customer_intent": "complaint",
  "nps_alignment": "detractor"
}
```

**Alerta Telegram Enviada:** ✅ Sí (urgency = critical)

---

### Comentario Neutral con Sugerencia

**Input:**
```json
{
  "rating": 3,
  "comment": "El bubble tea está bien pero estaría mejor con más opciones de toppings. Ojalá agreguen lychee."
}
```

**Output Gemini:**
```json
{
  "sentiment": "neutral",
  "sentiment_score": 0.55,
  "topics": ["product_quality", "customization"],
  "key_phrases": ["está bien", "más opciones de toppings", "agreguen lychee"],
  "urgency": "low",
  "actionable": true,
  "action_type": "improvement",
  "summary_es": "Cliente satisfecho pero sugiere ampliar variedad de toppings, específicamente lychee",
  "customer_intent": "suggestion",
  "nps_alignment": "passive"
}
```

**Alerta Telegram Enviada:** ❌ No (urgency = low)

---

## 🔄 Mantenimiento y Evolución

### Actualizaciones Recomendadas

1. **Agregar más tópicos** (línea 96 del JSON):
   ```javascript
   // Agregar: "packaging", "hygiene", "value_for_money"
   ```

2. **Mejorar prompt de Gemini** (líneas 98-99):
   - Agregar ejemplos de comentarios
   - Afinar reglas de urgencia
   - Incluir contexto de menú actualizado

3. **Optimizar batch size** (línea 58):
   ```javascript
   // Si Gemini API es lenta: reducir a 5
   // Si es rápida: aumentar a 15-20
   ```

4. **Agregar nodo de respuesta automática**:
   - Para comentarios muy negativos
   - Enviar mensaje WhatsApp de disculpa + cupón

---

## 📝 Notas Importantes

### Rate Limits
- **Gemini Free Tier:** 60 req/min, 1500 req/día
- **Workflow actual:** ~4 req/min (máx 20 cada 15 min)
- **Margen:** Seguro para free tier

### Costos
- **n8n:** Gratis si self-hosted, $20/mes cloud
- **Gemini API:** Gratis hasta 1500 requests/día
- **Google Sheets:** Gratis
- **Telegram Bot:** Gratis

### Seguridad
- API keys en variables de entorno (no hardcoded)
- OAuth2 para Google Sheets (no API keys)
- Logs no exponen datos sensibles

---

## 🎯 Próximos Pasos

### Después de Implementar

1. **Monitorear primeras 24 horas:**
   - Verificar ejecuciones cada hora
   - Revisar accuracy de clasificaciones
   - Ajustar prompt si es necesario

2. **Crear dashboard de métricas:**
   - Looker Studio conectado a SENTIMENT_STATS
   - Gráficas de tendencias de sentimiento
   - Alertas de anomalías

3. **Integrar con sistema de tickets:**
   - Crear ticket automático para urgency=critical
   - Asignar a gerente de atención al cliente

4. **Entrenar modelo custom (futuro):**
   - Usar datos históricos de Google Sheets
   - Fine-tuning de Gemini o modelo propio
   - Mejorar accuracy específica de CapiBobba

---

## 📧 Soporte

**Documentación técnica:** [project.md](../project.md)
**Workflow JSON:** [sentiment_analysis_workflow.json](sentiment_analysis_workflow.json)
**n8n Docs:** https://docs.n8n.io
**Gemini API Docs:** https://ai.google.dev/docs

---

**Última actualización:** 2025-10-11
**Versión del workflow:** 1.0.0
**Estado:** ✅ Listo para producción
