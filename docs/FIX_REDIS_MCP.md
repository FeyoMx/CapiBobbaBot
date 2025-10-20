# 🔧 Solución: Servidor MCP de Redis No Funciona

**Fecha:** 2025-10-20
**Problema:** El servidor MCP de Redis aparece activo pero no responde (timeout)

---

## 🎯 Causa Raíz Identificada

La configuración del servidor MCP de Redis en `claude_desktop_config.json` tiene **credenciales incorrectas**:

```json
// ❌ CONFIGURACIÓN INCORRECTA (Actual)
"redis": {
  "command": "npx",
  "args": ["-y", "redis-mcp@latest"],
  "env": {
    "REDIS_HOST": "red-ctbr7vbtq21c73dncre0",
    "REDIS_PORT": "6379"
  }
}
```

### Problemas:

1. **REDIS_HOST incorrecto**: Usa un ID de Render en lugar de la URL real
2. **Falta autenticación**: No incluye el password de Redis Cloud
3. **Puerto incorrecto**: Usa 6379 (default) en lugar de 15562
4. **Variables incorrectas**: redis-mcp espera REDIS_URL completa

---

## ✅ Solución Paso a Paso

### Paso 1: Cerrar Claude Code

Cierra completamente VSCode para que los cambios tomen efecto.

### Paso 2: Editar Configuración

**Ubicación:** `C:\Users\luis_\AppData\Roaming\Claude\claude_desktop_config.json`

**Reemplazar:**

```json
"redis": {
  "command": "npx",
  "args": ["-y", "redis-mcp@latest"],
  "env": {
    "REDIS_URL": "redis://:twtQc415WYubUqwSd4rDDqEqQSFZj8vj@redis-15562.c283.us-east-1-4.ec2.redns.redis-cloud.com:15562"
  }
}
```

### Paso 3: Reiniciar y Verificar

1. Guardar el archivo
2. Reiniciar VSCode
3. Probar: `mcp__redis__get({key: "test"})`

---

## 📋 Por Qué Fallaba

El servidor MCP intentaba conectarse a:
- Host: `red-ctbr7vbtq21c73dncre0` ❌ (ID interno, no una URL válida)
- Puerto: `6379` ❌ (default, no tu puerto real 15562)
- Sin password ❌ (Redis Cloud requiere autenticación)

Debería conectarse a:
- URL completa: `redis://:PASSWORD@HOST:15562` ✅
- Con autenticación incluida en la URL ✅

---

## 🧪 Comandos de Testing

Una vez corregido:

```javascript
// Escanear conversaciones
mcp__redis__scan({pattern: "*@s.whatsapp.net", count: 50})

// Ver campañas
mcp__redis__scan({pattern: "marketing:campaign:*", count: 20})

// Estado de mantenimiento
mcp__redis__get({key: "maintenance_mode_status"})
```

---

**Nota:** Este fix permite acceso completo a la base de datos Redis para análisis en tiempo real.
