# 🔄 Guía de Uso del n8n MCP - CapiBobbaBot

**Fecha:** 2025-10-20
**Estado:** ✅ Configurado y Activo
**Proyecto:** CapiBobbaBot v2.8.1

---

## ✅ Configuración Actual

```json
{
  "type": "stdio",
  "command": "npx",
  "args": ["n8n-mcp"],
  "env": {}
}
```

**Ubicación:** `.claude.json` en proyecto CapiBobbaBot

---

## 🛠️ Herramientas Disponibles

Tienes acceso a **16 herramientas** del n8n MCP. Aquí están las más útiles para CapiBobbaBot:

### 1. **Búsqueda de Nodos**

#### `mcp__n8n__search_nodes`
Busca nodos por keyword.

**Ejemplo de uso:**
```
"Busca nodos de WhatsApp en n8n"
"Encuentra nodos para HTTP Request"
"¿Qué nodos hay para Google Sheets?"
```

**Parámetros:**
- `query` (string): Palabra clave a buscar
- `limit` (number): Máximo de resultados (default: 20)
- `mode` (string): OR, AND, FUZZY

---

#### `mcp__n8n__list_nodes`
Lista todos los nodos disponibles.

**Ejemplo de uso:**
```
"Lista todos los nodos n8n disponibles"
"Muestra nodos de categoría trigger"
"Lista nodos del paquete n8n-nodes-base con límite 200"
```

**Parámetros:**
- `category` (string): trigger, transform, output, input, AI
- `package` (string): "n8n-nodes-base", "@n8n/n8n-nodes-langchain"
- `limit` (number): Default 50, usar 200 para ver todos

---

### 2. **Documentación de Nodos**

#### `mcp__n8n__get_node_documentation`
Obtiene documentación completa con ejemplos.

**Ejemplo de uso:**
```
"Dame la documentación del nodo nodes-base.httpRequest"
"¿Cómo usar el nodo nodes-base.googleSheets?"
"Documentación del nodo nodes-base.slack"
```

**Nota:** Cobertura del 87% de nodos.

---

#### `mcp__n8n__get_node_info`
Info técnica completa del nodo.

**Ejemplo de uso:**
```
"Dame info del nodo nodes-base.webhook"
"Detalles técnicos del nodo nodes-base.httpRequest"
```

---

### 3. **Validación de Workflows**

#### `mcp__n8n__validate_workflow`
Valida workflows completos antes de activarlos.

**Ejemplo de uso:**
```
"Valida mi workflow de pedidos antes de activar"
"Revisa este workflow JSON por errores"
```

**Parámetros:**
- `workflow` (object): JSON completo del workflow
- `options` (object):
  - `validateNodes`: true/false
  - `validateConnections`: true/false
  - `validateExpressions`: true/false
  - `profile`: "minimal", "runtime", "ai-friendly", "strict"

---

#### `mcp__n8n__validate_workflow_connections`
Valida solo las conexiones del workflow.

**Ejemplo de uso:**
```
"Verifica las conexiones de mi workflow"
"¿Hay ciclos en este workflow?"
```

---

### 4. **Templates y Tareas**

#### `mcp__n8n__search_templates`
Busca templates por keyword.

**Ejemplo de uso:**
```
"Busca templates de chatbot en n8n"
"Templates para Google Sheets"
"Workflows de ejemplo para encuestas"
```

---

#### `mcp__n8n__get_node_for_task`
Obtiene nodo preconfigurado para una tarea.

**Ejemplo de uso:**
```
"Dame un nodo configurado para hacer POST JSON"
"Nodo para recibir webhooks"
"Configuración para enviar mensaje a Slack"
```

**Tareas disponibles:**
- `post_json_request`
- `receive_webhook`
- `query_database`
- `send_slack_message`
- Y más...

---

### 5. **Herramientas Avanzadas**

#### `mcp__n8n__get_node_as_tool_info`
Muestra cómo usar cualquier nodo como AI tool.

**Ejemplo de uso:**
```
"¿Cómo usar Google Sheets como AI tool?"
"Convertir HTTP Request a AI tool"
```

---

#### `mcp__n8n__tools_documentation`
Documentación de las herramientas MCP.

**Ejemplo de uso:**
```
"Muestra documentación rápida de n8n MCP"
"Ayuda sobre search_nodes"
```

---

## 🎯 Casos de Uso para CapiBobbaBot

### 1. **Optimizar Workflow de Pedidos**

```
Tú: "Busca nodos para enviar mensajes de WhatsApp"
Claude: [Usa search_nodes]
→ Encuentra "nodes-base.whatsapp"

Tú: "Dame documentación completa del nodo WhatsApp"
Claude: [Usa get_node_documentation]
→ Muestra ejemplos y configuración

Tú: "Valida mi workflow de pedidos"
Claude: [Usa validate_workflow]
→ Detecta errores antes de activar
```

---

### 2. **Crear Workflow de Encuestas**

```
Tú: "Busca templates de encuestas en n8n"
Claude: [Usa search_templates]
→ Muestra workflows de ejemplo

Tú: "¿Cómo configurar Google Sheets para guardar respuestas?"
Claude: [Usa get_node_documentation para nodes-base.googleSheets]
→ Documentación con ejemplos
```

---

### 3. **Debug de Workflow Actual**

```
Tú: "Valida las conexiones de mi workflow de mensajes"
Claude: [Usa validate_workflow_connections]
→ Verifica que no haya ciclos o nodos desconectados

Tú: "Valida las expresiones de mi workflow"
Claude: [Usa validate_workflow_expressions]
→ Revisa sintaxis {{ }} y referencias $json/$node
```

---

### 4. **Explorar Nodos AI**

```
Tú: "Lista todos los nodos AI disponibles"
Claude: [Usa list_ai_tools]
→ Muestra 263 nodos AI-optimized

Tú: "¿Cómo usar el nodo OpenAI como tool?"
Claude: [Usa get_node_as_tool_info]
→ Guía para conectar a AI Agent
```

---

## 📚 Workflows Actuales de CapiBobbaBot

### Workflow 1: Procesamiento de Pedidos

**Nodos relevantes a explorar:**
```
"Dame documentación del nodo nodes-base.webhook"
"¿Cómo usar HTTP Request para enviar a Google Sheets?"
"Documentación de nodes-base.if para validaciones"
```

---

### Workflow 2: Sistema de Encuestas

**Nodos relevantes:**
```
"Busca nodos para procesar respuestas de encuestas"
"¿Cómo conectar Google Sheets con webhook?"
"Templates de workflows de encuestas"
```

---

### Workflow 3: Mensajes Automatizados

**Nodos relevantes:**
```
"Busca nodos de WhatsApp Business"
"¿Cómo configurar Schedule Trigger en n8n?"
"Documentación de nodes-base.slack para notificaciones"
```

---

## 🔍 Comandos Útiles Diarios

### Búsqueda Rápida

```bash
# Encontrar nodo específico
"Busca el nodo HTTP Request en n8n"

# Ver categorías
"Lista nodos de categoría trigger"

# Explorar paquetes
"Muestra todos los nodos AI de langchain"
```

---

### Validación Antes de Deploy

```bash
# Validación completa
"Valida mi workflow con perfil strict"

# Solo conexiones
"Verifica las conexiones del workflow"

# Solo expresiones
"Valida las expresiones {{ }} del workflow"
```

---

### Documentación Rápida

```bash
# Documentación con ejemplos
"Dame documentación de nodes-base.httpRequest"

# Info técnica
"Info completa del nodo nodes-base.webhook"

# Uso como AI tool
"¿Cómo usar Google Sheets como AI tool?"
```

---

## 💡 Tips y Trucos

### 1. **Usar nombres completos de nodos**
Siempre usa el formato: `nodes-base.nombreNodo`

**Correcto:**
```
"Documentación de nodes-base.httpRequest"
```

**Incorrecto:**
```
"Documentación de HTTP Request"  ❌
```

---

### 2. **Aprovechar templates**
Antes de crear workflow desde cero, busca templates:

```
"Busca templates de chatbot"
"Templates para automatización de WhatsApp"
```

---

### 3. **Validar antes de activar**
SIEMPRE valida workflows antes de activar:

```
"Valida mi workflow con perfil runtime antes de activar"
```

---

### 4. **Explorar nodos por categoría**
Para descubrir nodos nuevos:

```
"Lista nodos de categoría AI con límite 100"
"Muestra todos los nodos trigger disponibles"
```

---

## 🚀 Workflows de Debugging

### Debug de Workflow que No Funciona

**Paso 1:** Validar estructura
```
"Valida las conexiones de mi workflow"
```

**Paso 2:** Validar configuración de nodos
```
"Valida mi workflow con perfil strict"
```

**Paso 3:** Validar expresiones
```
"Valida las expresiones del workflow"
```

**Paso 4:** Revisar documentación de nodo problemático
```
"Dame documentación de [nodo-que-falla]"
```

---

## 📊 Estadísticas del n8n MCP

```
Total de nodos: 525
Nodos AI-optimized: 263
Nodos trigger: 104
Cobertura de documentación: 87%
Paquetes soportados: 2 (n8n-nodes-base, @n8n/n8n-nodes-langchain)
```

---

## 🆘 Solución de Problemas

### Error: "Node type not found"

**Causa:** Nombre incorrecto del nodo

**Solución:**
```
"Busca nodos de [nombre aproximado]"
→ Encuentra el nombre exacto
→ Usa formato: nodes-base.nombreExacto
```

---

### Error: "Workflow validation failed"

**Diagnóstico:**
```
"Valida mi workflow y muestra todos los errores"
→ Revisa cada error específico
→ Corrige según sugerencias
```

---

### No encuentro un nodo específico

**Estrategia:**
```
1. "Busca nodos de [keyword] con modo FUZZY"
2. "Lista nodos de categoría [categoría]"
3. "Busca templates de [tarea]"
```

---

## 📝 Próximos Pasos

### Esta Semana
- [ ] Validar workflows actuales de CapiBobbaBot
- [ ] Explorar nodos AI para mejorar automatización
- [ ] Buscar templates para optimizar workflows existentes
- [ ] Documentar configuraciones de nodos críticos

### Este Mes
- [ ] Crear biblioteca de snippets de nodos
- [ ] Optimizar workflows con nodos más eficientes
- [ ] Implementar mejores prácticas de validación
- [ ] Explorar integración de nodos AI con Gemini

---

## 📚 Recursos

- **n8n MCP Docs:** https://www.n8n-mcp.com
- **n8n Official Docs:** https://docs.n8n.io
- **n8n Community:** https://community.n8n.io
- **n8n Templates:** https://n8n.io/workflows

---

**Beneficio clave:** Con el n8n MCP puedes **validar, documentar y optimizar** tus workflows de CapiBobbaBot sin salir de Claude Code, reduciendo errores y mejorando eficiencia. 🚀

---

**Autor:** Claude Code
**Versión:** 1.0.0
**Última actualización:** 2025-10-20
**Proyecto:** CapiBobbaBot v2.8.1
