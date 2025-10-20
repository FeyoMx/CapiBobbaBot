# 🔌 Guía de Servidores MCP para CapiBobbaBot

**Fecha:** 2025-10-20
**Versión:** 1.0.0
**Proyecto:** CapiBobbaBot v2.8.1

> ⚠️ **AVISO DE SEGURIDAD:** Este documento contiene ejemplos de configuración con placeholders. Reemplaza `YOUR_*` con tus credenciales reales en `.claude.json` (que está en `.gitignore`). **NUNCA commitees tokens o API keys reales.**

---

## 📊 Estado Actual de Servidores MCP

### ✅ Configurados y Activos (4 servidores)

| Servidor | Estado | Tipo | Uso Principal |
|----------|--------|------|---------------|
| 🔄 **n8n MCP** | ✅ Activo | stdio | Workflows, validación, 525+ nodos |
| ⚡ **Render MCP** | ✅ Activo | http | Backend, logs, métricas, deployments |
| 🌐 **Chrome DevTools** | ✅ Activo | stdio | Testing UI, performance, debugging |
| 🚀 **Vercel MCP** | ⏳ Pendiente auth | http | Dashboard Next.js (OAuth requerido) |

### 🔴 Recomendados para Instalar

| Servidor | Prioridad | Beneficio para CapiBobbaBot |
|----------|-----------|------------------------------|
| 🔴 **Redis MCP** | CRÍTICO | Debug de pedidos, estados, caché |
| 🐙 **GitHub MCP** | Alta | Gestión de código, PRs, issues |
| 🗄️ **PostgreSQL MCP** | Media | Solo si migras de Redis |
| 💬 **WhatsApp MCP** | Baja | Experimental, investigar |

---

## 📋 Índice

1. [Servidores Configurados](#servidores-configurados)
2. [Servidores Recomendados](#servidores-recomendados)
3. [Instalación y Configuración](#instalación-y-configuración)
4. [Casos de Uso](#casos-de-uso)
5. [Troubleshooting](#troubleshooting)

---

## ✅ Servidores Configurados en CapiBobbaBot

### 1. **n8n MCP Server** 🔄
**Estado:** ✅ Activo y configurado

```json
{
  "type": "stdio",
  "command": "npx",
  "args": ["n8n-mcp"],
  "env": {}
}
```

**Capacidades:**
- ✅ Búsqueda de 525+ nodos n8n
- ✅ Documentación detallada con ejemplos
- ✅ Validación de workflows
- ✅ Templates de workflows
- ✅ Configuración de nodos AI
- ✅ Búsqueda de propiedades

**Herramientas disponibles (ya activas):**
- `mcp__n8n__search_nodes` - Buscar nodos por keyword
- `mcp__n8n__list_nodes` - Listar nodos disponibles
- `mcp__n8n__get_node_info` - Info detallada de un nodo
- `mcp__n8n__get_node_documentation` - Docs con ejemplos
- `mcp__n8n__validate_workflow` - Validar workflow JSON
- `mcp__n8n__search_templates` - Buscar templates
- `mcp__n8n__get_node_for_task` - Nodo preconfigurado
- `mcp__n8n__tools_documentation` - Documentación de herramientas

**Uso para CapiBobbaBot:**
```
"Busca el nodo HTTP Request en n8n"
"Dame documentación del nodo WhatsApp en n8n"
"Valida mi workflow de pedidos"
"Busca templates para Google Sheets"
```

---

### 2. **Render MCP Server** ⚡
**Estado:** ✅ Activo y configurado

```json
{
  "type": "http",
  "url": "https://mcp.render.com/mcp",
  "headers": {
    "Authorization": "Bearer YOUR_RENDER_API_KEY"
  }
}
```

**Nota:** ⚠️ El token real está configurado en `.claude.json` (NO commitear este archivo).

**Capacidades:**
- ✅ Gestión de servicios web (backend Node.js)
- ✅ Gestión de bases de datos PostgreSQL y Redis
- ✅ Consulta de logs en tiempo real
- ✅ Monitoreo de métricas (CPU, memoria, requests)
- ✅ Gestión de variables de entorno
- ✅ Historial de deployments
- ✅ Rollback de deployments

**Herramientas disponibles:**
- `create_web_service` - Crear nuevos servicios
- `create_postgres` - Crear bases de datos PostgreSQL
- `create_key_value` - Crear instancias Redis
- `list_services` - Listar todos tus servicios
- `get_service` - Obtener detalles de un servicio
- `list_deployments` - Ver historial de deployments
- `get_deployment` - Detalles de deployment específico
- `list_logs` - Consultar logs filtrados
- `get_metrics` - Obtener métricas de performance
- `update_environment_variables` - Actualizar env vars
- `query_render_postgres` - Ejecutar queries SQL (read-only)

**Uso para CapiBobbaBot:**
```
"Muestra las métricas de CPU del servicio CapiBobbaBot"
"Lista los últimos 50 logs con errores"
"¿Cuál es el estado del último deployment?"
"Muestra las variables de entorno del servicio"
```

---

### 3. **Chrome DevTools MCP Server** 🌐
**Estado:** ✅ Configurado (disponible en proyecto)

```json
{
  "type": "stdio",
  "command": "npx",
  "args": ["chrome-devtools-mcp@latest"],
  "env": {}
}
```

**Capacidades:**
- ✅ Automatización de navegador Chrome
- ✅ Testing de UI del dashboard
- ✅ Screenshots y snapshots de página
- ✅ Análisis de performance (Web Vitals)
- ✅ Debugging de frontend
- ✅ Monitoreo de network requests
- ✅ Análisis de console logs

**Herramientas disponibles:**
- `mcp__chrome-devtools__navigate_page` - Navegar a URL
- `mcp__chrome-devtools__take_screenshot` - Capturar pantalla
- `mcp__chrome-devtools__take_snapshot` - Snapshot de DOM
- `mcp__chrome-devtools__click` - Click en elementos
- `mcp__chrome-devtools__fill` - Llenar formularios
- `mcp__chrome-devtools__list_network_requests` - Ver requests
- `mcp__chrome-devtools__list_console_messages` - Ver logs
- `mcp__chrome-devtools__performance_start_trace` - Analizar performance
- `mcp__chrome-devtools__evaluate_script` - Ejecutar JavaScript

**Uso para CapiBobbaBot Dashboard:**
```
"Abre el dashboard y toma un screenshot"
"Analiza el performance del dashboard"
"Verifica que no haya errores en la consola"
"Prueba el formulario de login"
"Lista todos los requests de API"
```

---

### 4. **Vercel MCP Server** 🚀
**Estado:** ✅ Configurado (Requiere autenticación OAuth)

```json
{
  "type": "http",
  "url": "https://mcp.vercel.com"
}
```

**Capacidades:**
- ✅ Gestión de dashboard Next.js
- ✅ Consulta de logs de build/runtime
- ✅ Monitoreo de deployments
- ✅ Búsqueda en documentación de Vercel
- ✅ Verificación de variables de entorno
- ✅ Read-only (seguro)

**Herramientas disponibles:**
- `search_docs` - Buscar en docs de Vercel
- `list_projects` - Listar proyectos
- `get_project` - Detalles de proyecto
- `list_deployments` - Historial de deployments
- `get_deployment` - Estado de deployment
- `get_deployment_logs` - Logs de build/runtime

**Uso para CapiBobbaBot Dashboard:**
```
"Verifica el estado del último deploy del dashboard"
"¿Por qué falló el build anterior?"
"Muestra las variables de entorno configuradas"
"Analiza los logs del último deployment"
```

**Documentación:** [VERCEL_MCP_GUIDE.md](dashboard-next/VERCEL_MCP_GUIDE.md)

---

## 🎯 Servidores Recomendados para Instalar

### 5. **Redis MCP Server** 🔴 (ESENCIAL - MUY RECOMENDADO)

**¿Por qué instalarlo?**
- **CRÍTICO:** CapiBobbaBot usa Redis para TODO (pedidos, estados, caché)
- Debug de keys en tiempo real
- Monitoreo de memoria
- Gestión de TTL y expiración

**Instalación:**
```bash
# Instalar globalmente
npm install -g redis-mcp-server

# O agregar vía Claude
claude mcp add --transport stdio redis npx redis-mcp-server
```

**Configuración en .claude.json:**
```json
{
  "mcpServers": {
    "redis": {
      "type": "stdio",
      "command": "npx",
      "args": ["redis-mcp-server"],
      "env": {
        "REDIS_URL": "redis://YOUR_REDIS_HOST:6379"
      }
    }
  }
}
```

**Nota:** Reemplaza `YOUR_REDIS_HOST` con tu host real de Redis de Render.

**Capacidades:**
- 🔍 Búsqueda de keys por pattern
- 📖 Leer valores (GET, HGETALL, LRANGE)
- ✍️ Escribir valores (SET, HSET, LPUSH)
- 🗑️ Eliminar keys (DEL, HDEL)
- ⏱️ Gestión de TTL (EXPIRE, TTL)
- 📊 Análisis de memoria
- 🔢 Operaciones atómicas

**Uso para CapiBobbaBot:**
```
"Lista todas las keys de pedidos activos"
"Muestra el valor de order:5217711831526"
"¿Cuánto TTL tiene userStates:5217711831526?"
"Busca keys que empiecen con gemini_cache:"
"¿Cuánta memoria está usando Redis?"
```

---

### 6. **PostgreSQL MCP Server** 🗄️ (RECOMENDADO si usas PostgreSQL)

**¿Por qué instalarlo?**
- Si planeas migrar de Redis a PostgreSQL
- Análisis de performance de queries
- Monitoreo de base de datos
- Inspección de schemas

**Instalación:**
```bash
# PostgreSQL MCP Pro
npm install -g postgres-mcp

# O usando GitHub
claude mcp add --transport stdio postgres-mcp npx postgres-mcp
```

**Configuración:**
```json
{
  "mcpServers": {
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["postgres-mcp"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@host:5432/db"
      }
    }
  }
}
```

**Capacidades:**
- 📊 Performance analysis
- 🔍 Schema inspection
- 📈 Query optimization suggestions
- 🧹 Bloat detection
- 🔧 Autovacuum monitoring
- 📋 Read/write access configurable

**Uso:**
```
"Analiza la performance de la tabla orders"
"¿Qué índices debería agregar?"
"Muestra el esquema de la base de datos"
"Detecta tablas con bloat"
```

---

### 7. **GitHub MCP Server** 🐙 (RECOMENDADO)

**¿Por qué instalarlo?**
- Gestión de issues y PRs desde Claude
- Búsqueda en código del repo
- Commits y pushes automatizados
- Review de código

**Instalación:**
```bash
# Requiere autenticación con GitHub
claude mcp add github
```

**Capacidades:**
- 📝 Crear/editar issues
- 🔀 Crear/merge PRs
- 🔍 Búsqueda en código
- 📊 Ver stats del repo
- 🏷️ Gestión de labels
- 👥 Gestión de colaboradores

**Herramientas:**
- `create_issue` - Crear issue
- `create_pull_request` - Crear PR
- `search_code` - Buscar en código
- `get_file_contents` - Leer archivo
- `create_or_update_file` - Editar archivo
- `list_commits` - Ver commits

**Uso para CapiBobbaBot:**
```
"Crea un issue para el bug de Redis timeout"
"Busca en el código dónde se usa sendMessageToWhatsApp"
"Muestra los últimos 10 commits"
"Crea un PR con los cambios de seguridad"
```

---

### 8. **WhatsApp MCP Server** 💬 (EXPERIMENTAL - Investigar)

**¿Por qué instalarlo?**
- Búsqueda de mensajes históricos
- Análisis de conversaciones
- Envío de mensajes desde Claude

**Instalación:**
```bash
# WhatsApp MCP (requiere Wassenger o similar)
npm install -g whatsapp-mcp
```

**Capacidades:**
- 📱 Búsqueda de mensajes
- 📤 Envío de mensajes
- 📊 Análisis de conversaciones
- 👥 Gestión de contactos

**Nota:** Experimental, puede requerir configuración adicional.

---

## 📦 Resumen de Configuración Actual

### ✅ Ya Configurados (4 servidores activos)

1. ✅ **n8n MCP** - Workflows, nodos, validación
2. ✅ **Render MCP** - Backend, logs, métricas
3. ✅ **Chrome DevTools MCP** - Testing UI, performance
4. ✅ **Vercel MCP** - Dashboard Next.js (requiere auth)

### 🔴 Recomendados para Instalar (prioritarios)

```bash
# 1. Redis MCP (ESENCIAL para CapiBobbaBot)
npm install -g redis-mcp-server

# 2. GitHub MCP (útil para gestión de código)
claude mcp add github
```

### Configuración Actual en .claude.json

```json
{
  "mcpServers": {
    "n8n": {
      "type": "stdio",
      "command": "npx",
      "args": ["n8n-mcp"],
      "env": {}
    },
    "render": {
      "type": "http",
      "url": "https://mcp.render.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_RENDER_API_KEY"
      }
    },
    "chrome-devtools": {
      "type": "stdio",
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest"],
      "env": {}
    },
    "vercel": {
      "type": "http",
      "url": "https://mcp.vercel.com"
    }
  }
}
```

**⚠️ IMPORTANTE:** Reemplaza `YOUR_RENDER_API_KEY` con tu token real de Render API.

### Configuración Recomendada (agregar Redis y GitHub)

```json
{
  "mcpServers": {
    "n8n": {
      "type": "stdio",
      "command": "npx",
      "args": ["n8n-mcp"],
      "env": {}
    },
    "render": {
      "type": "http",
      "url": "https://mcp.render.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_RENDER_API_KEY"
      }
    },
    "chrome-devtools": {
      "type": "stdio",
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest"],
      "env": {}
    },
    "vercel": {
      "type": "http",
      "url": "https://mcp.vercel.com"
    },
    "redis": {
      "type": "stdio",
      "command": "npx",
      "args": ["redis-mcp-server"],
      "env": {
        "REDIS_URL": "redis://YOUR_REDIS_HOST:6379"
      }
    },
    "github": {
      "type": "oauth"
    }
  }
}
```

**⚠️ SEGURIDAD:**
- Reemplaza `YOUR_RENDER_API_KEY` con tu token de Render
- Reemplaza `YOUR_REDIS_HOST` con tu host de Redis
- **NUNCA** commitees `.claude.json` con tokens reales

---

## 🎯 Casos de Uso por Escenario

### Debugging de Pedidos

**Problema:** Un pedido no se completó correctamente

**Workflow con MCPs:**
```
1. Redis MCP: "Busca la key order:5217711831526"
   → Ver estado del pedido en Redis

2. Render MCP: "Busca en logs errores con '5217711831526'"
   → Revisar logs del backend

3. n8n MCP: "Valida el workflow de pedidos"
   → Verificar que workflow n8n esté correcto

4. GitHub MCP: "Busca en código la función handleOrderComplete"
   → Revisar implementación
```

---

### Deploy con Verificación Completa

**Escenario:** Nuevo feature desplegado

**Workflow con MCPs:**
```
1. GitHub MCP: "Crea PR con cambios de feature X"
   → PR automático

2. Render MCP: "Monitorea el deployment del backend"
   → Ver estado de deploy

3. Vercel MCP: "Verifica el deployment del dashboard"
   → Ver estado de dashboard

4. Render MCP: "Muestra logs de errores últimos 10 min"
   → Verificar que no hay errores

5. Render MCP: "Muestra métricas de CPU y memoria"
   → Verificar performance
```

---

### Optimización de Workflows n8n

**Escenario:** Mejorar workflow de encuestas

**Workflow con MCPs:**
```
1. n8n MCP: "Busca templates de workflows de encuestas"
   → Ver ejemplos

2. n8n MCP: "Dame documentación del nodo Google Sheets"
   → Entender configuración

3. n8n MCP: "Valida mi workflow antes de activar"
   → Verificar que no hay errores

4. Render MCP: "Activa variable N8N_WEBHOOK_URL"
   → Configurar backend
```

---

### Análisis de Performance

**Escenario:** El bot está lento

**Workflow con MCPs:**
```
1. Render MCP: "Muestra métricas de CPU últimas 24h"
   → Ver picos de uso

2. Redis MCP: "¿Cuánta memoria usa Redis?"
   → Verificar cache

3. Render MCP: "Filtra logs por 'timeout' últimas 24h"
   → Encontrar timeouts

4. Redis MCP: "Lista keys de userStates con TTL < 60s"
   → Ver expiración de estados
```

---

## 🔧 Comandos de Configuración

### Agregar Servidor MCP

```bash
# HTTP con autenticación
claude mcp add --transport http <nombre> <url> --header "Authorization: Bearer <token>"

# HTTP sin autenticación
claude mcp add --transport http <nombre> <url>

# STDIO (local)
claude mcp add --transport stdio <nombre> <comando>

# OAuth
claude mcp add <nombre>
```

### Listar Servidores Configurados

```bash
claude mcp list
```

### Remover Servidor MCP

```bash
claude mcp remove <nombre>
```

### Verificar Estado

```bash
# En conversación con Claude
"Lista todos los servidores MCP configurados"
"Verifica que el servidor Render esté funcionando"
```

---

## 🆘 Troubleshooting

### Error: "MCP server not responding"

**Solución:**
```bash
# Verificar que el servidor esté activo
curl <url-del-servidor>

# Reiniciar Claude Code
# Ctrl+C → claude code
```

---

### Error: "Authentication failed"

**Solución:**
```bash
# Verificar token/credentials
# Revisar .claude.json que tenga auth correcto

# Para OAuth, volver a autenticar
claude mcp remove <servidor>
claude mcp add <servidor>
```

---

### Error: "Tool not found"

**Solución:**
```
# En Claude Code:
"¿Qué herramientas tiene el servidor <nombre>?"
"Dame la lista completa de tools de Render MCP"
```

---

### Servidor MCP lento

**Solución:**
```bash
# Usar servidores locales cuando sea posible
# Preferir stdio sobre http para tools frecuentes

# Ejemplo: Redis local vs HTTP
"stdio" > "http"
```

---

## 📊 Estado y Prioridad de Instalación

### ✅ Ya Configurados (Activos en CapiBobbaBot)
1. ✅ **n8n MCP** - Workflows, validación, 525+ nodos
2. ✅ **Render MCP** - Backend, logs, métricas, deployments
3. ✅ **Chrome DevTools MCP** - Testing, performance, debugging UI
4. ✅ **Vercel MCP** - Dashboard Next.js (requiere auth OAuth)

### 🔴 Prioritarios (Instalar AHORA)
5. 🔴 **Redis MCP** - ESENCIAL para debugging de pedidos y estados
6. 🐙 **GitHub MCP** - Gestión de código, PRs, issues

### 🟡 Opcionales (Considerar después)
7. 🗄️ **PostgreSQL MCP** - Solo si migras de Redis a PostgreSQL
8. 💬 **WhatsApp MCP** - Experimental, investigar compatibilidad

---

## 📚 Recursos

- **MCP Official Docs:** https://modelcontextprotocol.io
- **Awesome MCP Servers:** https://github.com/punkpeye/awesome-mcp-servers
- **n8n MCP:** https://www.n8n-mcp.com
- **Render MCP Docs:** https://render.com/docs/mcp
- **Vercel MCP Docs:** https://vercel.com/docs/mcp

---

## 🎯 Próximos Pasos

### Inmediato (Esta sesión)
- [x] ✅ n8n MCP ya configurado
- [x] ✅ Render MCP ya configurado
- [x] ✅ Chrome DevTools MCP ya configurado
- [x] ✅ Vercel MCP ya agregado (pendiente auth OAuth)
- [ ] 🔴 Instalar Redis MCP (PRIORITARIO)
- [ ] 🐙 Configurar GitHub MCP
- [ ] Probar herramientas de cada servidor

### Esta semana
- [ ] Documentar workflows comunes usando n8n MCP
- [ ] Crear scripts de debugging con Redis MCP
- [ ] Integrar Chrome DevTools en testing de dashboard
- [ ] Autenticar Vercel MCP cuando esté disponible

### Este mes
- [ ] Evaluar PostgreSQL MCP (si aplica migración)
- [ ] Explorar WhatsApp MCP
- [ ] Optimizar uso de todos los MCPs

---

## 📝 Notas de Seguridad

- 🔐 **CRÍTICO:** Nunca expongas tokens/API keys en repos públicos
- 🚫 **`.claude.json` está en `.gitignore`** - No lo commitees NUNCA
- ✅ Usa variables de entorno para credenciales sensibles
- 🔒 OAuth es preferible a API keys cuando esté disponible
- 📋 Revisa periódicamente que no haya credenciales en código

## 📝 Notas Técnicas

- **Performance:** Prefiere servidores locales (stdio) cuando sea posible
- **Monitoreo:** Revisa periódicamente que servidores estén activos
- **Actualización:** Mantén los paquetes MCP actualizados (`npx @latest`)

---

**Beneficio clave:** Con estos servidores MCP configurados, podrás gestionar **todo el ciclo de vida de CapiBobbaBot** (código, deploy, monitoreo, debugging, workflows n8n, datos Redis) directamente desde Claude Code. 🚀

---

**Autor:** Claude Code
**Versión:** 1.0.0
**Última actualización:** 2025-10-20
**Proyecto:** CapiBobbaBot v2.8.1
