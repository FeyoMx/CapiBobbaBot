# 🔄 Configuración de Retry Logic para Nodos Críticos

## Objetivo
Agregar retry logic automático a los nodos críticos del workflow **CapiBobba Enhanced** para prevenir pérdida de mensajes/pedidos por errores temporales.

---

## 📋 Nodos Críticos que Requieren Retry

### 1. **Enhanced Message Normalizer** (ID: enhanced-normalizer)
**Por qué:** Es el nodo donde ocurrieron los 20+ errores del 1 Oct

**Configuración de Retry:**
```json
{
  "retryOnFail": true,
  "maxTries": 3,
  "waitBetweenTries": 1000
}
```

**Cómo aplicar en n8n:**
1. Abrir el nodo "Enhanced Message Normalizer"
2. Click en el tab "Settings" del nodo
3. Activar "Retry On Fail" ✅
4. Max Tries: `3`
5. Wait Between Tries: `1000` ms (1 segundo)

---

### 2. **Google Sheets - Save Order to Pedidos CapiBobba** (ID: be356931-e736-49af-be70-4fb72efdb8dd)
**Por qué:** Prevenir pérdida de pedidos por errores de API de Google

**Configuración de Retry:**
```json
{
  "retryOnFail": true,
  "maxTries": 3,
  "waitBetweenTries": 2000
}
```

**Cómo aplicar:**
1. Abrir nodo "📋 Save Order to Pedidos CapiBobba"
2. Settings → Retry On Fail ✅
3. Max Tries: `3`
4. Wait Between Tries: `2000` ms (2 segundos - más tiempo por API externa)

---

### 3. **Google Sheets - Look Up Customer** (ID: 892179a6-63f1-444e-bb15-7dd0574888fb)
**Por qué:** Evitar fallos en la búsqueda de clientes

**Configuración de Retry:**
```json
{
  "retryOnFail": true,
  "maxTries": 2,
  "waitBetweenTries": 1500
}
```

---

### 4. **Google Sheets - Create New Customer** (ID: 6d861c01-4b6c-4d0e-b166-2bf6a4d6803c)
**Por qué:** Asegurar que todos los clientes se registren

**Configuración de Retry:**
```json
{
  "retryOnFail": true,
  "maxTries": 3,
  "waitBetweenTries": 2000
}
```

---

### 5. **Google Sheets - Update Existing Customer** (ID: 3eff5145-7ce7-49d0-b99b-1ec5c12068b0)
**Por qué:** No perder actualizaciones de clientes

**Configuración de Retry:**
```json
{
  "retryOnFail": true,
  "maxTries": 2,
  "waitBetweenTries": 1500
}
```

---

### 6. **HTTP Request - Get WhatsApp Media Info** (ID: 56073321-53fa-48e1-9d83-e5439433d4dd)
**Por qué:** API externa de WhatsApp puede tener latencia

**Configuración de Retry:**
```json
{
  "retryOnFail": true,
  "maxTries": 3,
  "waitBetweenTries": 2000
}
```

---

### 7. **HTTP Request - Download Image** (ID: aae3eb21-124f-4979-9219-cbdf49a7a170)
**Por qué:** Descarga de medios puede fallar temporalmente

**Configuración de Retry:**
```json
{
  "retryOnFail": true,
  "maxTries": 3,
  "waitBetweenTries": 2000
}
```

---

### 8. **Google Drive - Guarda comprobante** (ID: 7fb860af-6d0e-4ae1-91cb-e94964277458)
**Por qué:** Upload a Drive puede fallar por conectividad

**Configuración de Retry:**
```json
{
  "retryOnFail": true,
  "maxTries": 3,
  "waitBetweenTries": 2500
}
```

---

### 9. **Telegram - Send Telegram Notification** (ID: send-telegram)
**Por qué:** Asegurar que notificaciones lleguen

**Configuración de Retry:**
```json
{
  "retryOnFail": true,
  "maxTries": 2,
  "waitBetweenTries": 1000
}
```

---

### 10. **Telegram - Send Order Alert** (ID: order-telegram)
**Por qué:** CRÍTICO - No perder alertas de pedidos

**Configuración de Retry:**
```json
{
  "retryOnFail": true,
  "maxTries": 3,
  "waitBetweenTries": 1500
}
```

---

## 🔧 Cómo Aplicar Configuración en Masa

### Opción 1: Manualmente en n8n (Recomendado para validar)
1. Abrir workflow en n8n
2. Para cada nodo de la lista arriba:
   - Click en el nodo
   - Tab "Settings"
   - Activar "Retry On Fail"
   - Configurar Max Tries y Wait Between Tries
3. Guardar workflow

### Opción 2: Editar workflow.json directamente
**⚠️ CUIDADO:** Hacer backup antes

Para cada nodo en la lista, agregar en el objeto del nodo:
```json
{
  "id": "enhanced-normalizer",
  "name": "Enhanced Message Normalizer",
  "type": "n8n-nodes-base.code",
  "retryOnFail": true,
  "maxTries": 3,
  "waitBetweenTries": 1000,
  // ... resto de la configuración
}
```

---

## 📊 Configuración Recomendada por Tipo de Nodo

| Tipo de Nodo | Max Tries | Wait (ms) | Razón |
|--------------|-----------|-----------|-------|
| Code Nodes | 3 | 1000 | Errores de lógica pueden ser temporales |
| Google Sheets | 2-3 | 1500-2000 | API puede tener rate limits |
| HTTP Request | 3 | 2000 | APIs externas con latencia variable |
| Google Drive | 3 | 2500 | Upload puede requerir más tiempo |
| Telegram | 2-3 | 1000-1500 | API de Telegram es generalmente rápida |

---

## ⚡ Backoff Exponencial (Avanzado)

Para implementar backoff exponencial (1s, 2s, 4s), usa un Code Node:

```javascript
// En el nodo Code que puede fallar
const maxRetries = 3;
let attempt = 0;

while (attempt < maxRetries) {
  try {
    // Tu lógica aquí
    const result = await makeRequest();
    return [{ json: result }];
  } catch (error) {
    attempt++;
    if (attempt >= maxRetries) {
      throw error; // Re-throw después de max retries
    }

    // Backoff exponencial: 1s, 2s, 4s
    const waitTime = Math.pow(2, attempt - 1) * 1000;
    console.log(`Retry ${attempt}/${maxRetries} en ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
}
```

---

## 🧪 Cómo Probar la Configuración

### Test 1: Simular Error en Code Node
1. Modificar temporalmente "Enhanced Message Normalizer"
2. Agregar al inicio: `if (Math.random() > 0.5) throw new Error('Test error');`
3. Enviar mensaje de prueba
4. Verificar que retry funciona (ver logs de n8n)
5. Remover código de prueba

### Test 2: Simular Error de API
1. Temporalmente, cambiar ID de Google Sheet a uno inválido
2. Intentar ejecutar workflow
3. Verificar que hace retry 3 veces
4. Restaurar ID correcto

### Test 3: Verificar Alertas
1. Causar 3+ errores consecutivos
2. Verificar que llega alerta crítica a Telegram
3. Verificar que se registra en Google Sheets (Error Log)

---

## 📈 Beneficios Esperados

**Antes de Retry Logic:**
- ❌ Error → Mensaje perdido
- ❌ 20+ mensajes perdidos en incidente del 1 Oct
- ❌ $2,000 MXN en pérdidas

**Después de Retry Logic:**
- ✅ Error → 3 intentos automáticos
- ✅ ~90% de errores temporales se resuelven en retry
- ✅ Solo errores persistentes llegan a Error Workflow
- ✅ Reducción de 90% en mensajes perdidos

---

## 🔐 Consideraciones de Seguridad

1. **Evitar Loops Infinitos:**
   - Max Tries limitado a 3
   - Wait Between Tries para evitar rate limiting

2. **No Retry en Ciertos Errores:**
   - Errores de autenticación (401, 403) no deben reintentar
   - Errores de validación (400) no deben reintentar
   - Solo errores temporales (500, 503, timeout, network)

3. **Monitoring:**
   - Logs de retry en console.log
   - Alertas cuando retry falla después de max tries
   - Registro en Google Sheets para análisis

---

## ✅ Checklist de Implementación

- [ ] Aplicar retry a "Enhanced Message Normalizer" (3 tries, 1s)
- [ ] Aplicar retry a todos los nodos de Google Sheets (2-3 tries, 1.5-2s)
- [ ] Aplicar retry a nodos HTTP Request (3 tries, 2s)
- [ ] Aplicar retry a nodos de Telegram (2-3 tries, 1-1.5s)
- [ ] Aplicar retry a Google Drive (3 tries, 2.5s)
- [ ] Probar con mensaje de prueba
- [ ] Simular errores y verificar retry
- [ ] Verificar alertas de Telegram
- [ ] Verificar logs en Google Sheets
- [ ] Documentar cambios realizados

---

## 📝 Notas de Implementación

**Fecha de creación:** 4 de Octubre 2025
**Tiempo estimado:** 1-2 horas
**Riesgo:** Bajo
**Impacto:** Alto - Previene pérdida de mensajes/pedidos

**Orden de implementación recomendado:**
1. **Primero:** Enhanced Message Normalizer (donde ocurrió el incidente)
2. **Segundo:** Save Order to Pedidos CapiBobba (crítico para pedidos)
3. **Tercero:** Todos los nodos de Google Sheets
4. **Cuarto:** HTTP Requests y Google Drive
5. **Quinto:** Nodos de Telegram

---

**Próximo paso:** Implementar Error Workflow para capturar errores que fallan después de todos los retries.
