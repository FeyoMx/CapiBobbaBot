# 🔧 Guía del Servidor MCP de Vercel - CapiBobbaBot Dashboard

**Fecha:** 2025-10-20
**Versión:** 1.0.0
**Estado:** Configurado ✅ (Requiere autenticación OAuth)

---

## 📌 ¿Qué es el Servidor MCP de Vercel?

El **Vercel MCP Server** es una interfaz OAuth que conecta tu cuenta de Vercel con Claude Code, permitiéndote:

- 🔍 Gestionar deployments desde Claude
- 📊 Acceder a logs y métricas
- 📚 Buscar en documentación de Vercel
- 🚀 Monitorear el estado de tu dashboard Next.js

---

## ✅ Estado de Configuración

### Servidor MCP Agregado

```bash
# Servidor configurado en: C:\Users\luis_\.claude.json
Nombre: vercel
URL: https://mcp.vercel.com
Transporte: HTTP
Estado: ⚠️ Requiere autenticación OAuth
```

### Proyecto en Vercel

**Dashboard Next.js:**
- 📦 Proyecto: CapiBobbaBot Dashboard
- 🌐 URL: https://capibobbabot-dashboard.vercel.app (configurar)
- 📁 Root Directory: `dashboard-next`
- 🔗 Repositorio: FeyoMx/CapiBobbaBot
- ⚙️ Framework: Next.js 15.1.3
- 🌍 Region: IAD1 (Virginia, USA)

---

## 🛠️ Herramientas Disponibles (Post-Autenticación)

Una vez autenticado, tendrás acceso a estas herramientas MCP:

### 1. **search_docs** - Búsqueda de Documentación
```
Descripción: Buscar en la documentación oficial de Vercel
Uso: Resolver dudas sobre configuración, deployment, APIs
```

**Ejemplo:**
```
"¿Cómo configurar variables de entorno en Vercel?"
"¿Qué es el Edge Runtime de Vercel?"
```

---

### 2. **list_projects** - Listar Proyectos
```
Descripción: Ver todos tus proyectos desplegados en Vercel
Retorna: Nombre, ID, framework, URL, estado
```

**Ejemplo de salida:**
```json
{
  "projects": [
    {
      "id": "prj_xxx",
      "name": "capibobbabot-dashboard",
      "framework": "nextjs",
      "link": "https://capibobbabot-dashboard.vercel.app"
    }
  ]
}
```

---

### 3. **get_project** - Detalles de Proyecto
```
Descripción: Obtener información detallada de un proyecto específico
Parámetros: project_id o project_name
Retorna: Configuración, variables de entorno, dominios, regiones
```

**Información que obtienes:**
- Variables de entorno configuradas
- Dominios personalizados
- Build settings
- Git integration status
- Framework y versión

---

### 4. **list_deployments** - Listar Deployments
```
Descripción: Ver historial de deployments de un proyecto
Parámetros: project_id, limit (opcional)
Retorna: Lista de deployments con estado, fecha, commit
```

**Ejemplo de salida:**
```json
{
  "deployments": [
    {
      "uid": "dpl_xxx",
      "state": "READY",
      "created": "2025-10-20T10:30:00Z",
      "url": "capibobbabot-dashboard-git-main.vercel.app",
      "gitRef": "main",
      "commitSha": "a56f179"
    }
  ]
}
```

---

### 5. **get_deployment** - Detalles de Deployment
```
Descripción: Información completa de un deployment específico
Parámetros: deployment_id
Retorna: Estado, build time, errores, URLs
```

**Datos disponibles:**
- Estado actual (READY, ERROR, BUILDING)
- Tiempo de build
- Build output
- Errores (si existen)
- Preview URL
- Production URL

---

### 6. **get_deployment_logs** - Logs de Deployment
```
Descripción: Ver logs de build y runtime de un deployment
Parámetros: deployment_id, type (build/runtime)
Retorna: Logs en tiempo real
```

**Tipos de logs:**
- **Build logs**: Errores de compilación, warnings
- **Runtime logs**: Errores de servidor, console.logs
- **Function logs**: Logs de API routes

---

## 🎯 Casos de Uso para CapiBobbaBot Dashboard

### 1. **Monitoreo de Deployments**
```
Tú: "Lista los últimos deployments del dashboard"
Claude: [Usa list_deployments]
→ Muestra últimos 10 deployments con estado y fecha
```

### 2. **Debugging de Errores**
```
Tú: "¿Por qué falló el último deploy?"
Claude: [Usa get_deployment + get_deployment_logs]
→ Analiza build logs y muestra errores específicos
```

### 3. **Verificar Variables de Entorno**
```
Tú: "¿Qué variables de entorno están configuradas?"
Claude: [Usa get_project]
→ Lista NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WS_URL, etc.
```

### 4. **Consultar Documentación**
```
Tú: "¿Cómo optimizar el bundle size en Vercel?"
Claude: [Usa search_docs]
→ Respuesta directa desde docs oficiales
```

### 5. **Auditoría de Configuración**
```
Tú: "Revisa la configuración del proyecto dashboard"
Claude: [Usa get_project]
→ Verifica build command, framework, regiones, dominios
```

---

## 🔐 Autenticación (Próximo Paso)

### Estado Actual
⚠️ **OAuth authentication is currently not supported**

El servidor MCP está agregado pero requiere autenticación OAuth que actualmente no está disponible en esta sesión de Claude Code.

### Proceso de Autenticación (Cuando esté disponible)

1. **Ejecutar comando de login:**
   ```bash
   /login vercel
   ```

2. **Autorizar en navegador:**
   - Se abrirá ventana de Vercel
   - Autorizar acceso a Claude Code
   - Seleccionar proyectos a compartir

3. **Confirmar conexión:**
   - Token OAuth guardado localmente
   - Servidor MCP activo
   - Herramientas disponibles

---

## 📊 Beneficios para tu Workflow

### Antes (Sin MCP)
```
1. Cambio en dashboard-next/
2. Git commit + push
3. Abrir Vercel Dashboard en navegador
4. Buscar proyecto manualmente
5. Click en deployment
6. Revisar logs manualmente
7. Copiar errores a Claude
8. Analizar y corregir
```

### Después (Con MCP)
```
1. Cambio en dashboard-next/
2. Git commit + push
3. "Claude, verifica el deploy"
   → Claude usa MCP para ver estado
   → Analiza logs automáticamente
   → Reporta errores específicos
4. Corriges directamente con Claude
```

**Ahorro de tiempo:** ~70% menos pasos 🚀

---

## 🔄 Integración con Workflow Actual

### Dashboard en Vercel + Backend en Render

Tu arquitectura actual:
```
┌─────────────────────────────────────┐
│   Frontend (Next.js) - VERCEL       │
│   dashboard-next/                   │
│   https://capibobbabot-dashboard... │
│   - MCP de Vercel para gestión      │
└──────────────┬──────────────────────┘
               │ API Calls
               ▼
┌─────────────────────────────────────┐
│   Backend (Node.js) - RENDER        │
│   chatbot.js, monitoring/, etc.     │
│   https://capibobbabot.onrender.com │
│   - Render MCP disponible           │
└─────────────────────────────────────┘
```

### Comandos Útiles con MCP

**Monitoreo diario:**
```bash
# Claude Code (después de autenticar)
"Muestra el estado de todos mis deployments de hoy"
"¿Hay errores en el último deploy?"
"¿Cuánto tardó el último build?"
```

**Debugging:**
```bash
"Analiza los logs del deployment dpl_xxx"
"¿Por qué el build está fallando?"
"Compara el último deploy exitoso vs el fallido"
```

**Optimización:**
```bash
"¿Cuál es el bundle size del último deploy?"
"¿Hay warnings de Next.js que debería revisar?"
"Busca en docs de Vercel cómo optimizar Image component"
```

---

## 📈 Métricas y Monitoreo Disponibles

### Datos que puedes obtener vía MCP:

1. **Deployment Metrics:**
   - Build duration
   - Bundle size
   - Deployment frequency
   - Success/failure rate

2. **Project Health:**
   - Active deployments
   - Production vs preview
   - Git integration status
   - Environment variables count

3. **Performance:**
   - Cold boot time
   - Response time (desde Vercel Analytics)
   - Error rates
   - Traffic patterns

---

## 🆘 Troubleshooting

### Problema: "OAuth authentication is currently not supported"

**Solución temporal:**
- Continuar usando Vercel Dashboard web para monitoreo
- Esperar actualización de Claude Code con soporte OAuth
- Usar Vercel CLI como alternativa: `vercel logs`

### Problema: "No projects found"

**Verificar:**
1. Autenticación exitosa
2. Proyecto existe en Vercel
3. Permisos de acceso correctos

### Problema: "Deployment logs empty"

**Causa:** Deployment muy antiguo (logs expiran en 30 días)

---

## 🚀 Próximos Pasos

### Inmediato
- [ ] ✅ Servidor MCP agregado
- [ ] ⏳ Esperar soporte OAuth en Claude Code
- [ ] ⏳ Autenticar con Vercel
- [ ] ⏳ Probar herramientas MCP

### Cuando MCP esté activo
- [ ] Automatizar checks de deployment
- [ ] Crear workflows de debugging
- [ ] Integrar con monitoreo del backend
- [ ] Documentar casos de uso específicos

---

## 📚 Recursos

- **Vercel MCP Docs:** https://vercel.com/docs/mcp/vercel-mcp
- **Vercel CLI:** https://vercel.com/docs/cli
- **Dashboard Vercel:** https://vercel.com/dashboard
- **Vercel Status:** https://vercel-status.com

---

## 📝 Notas

- ✅ MCP de Vercel está en **Public Beta**
- ✅ Es **read-only** (no puede hacer cambios accidentales)
- ✅ Requiere **OAuth** para máxima seguridad
- ✅ Soporta **múltiples proyectos** en misma cuenta
- ✅ Compatible con **Teams de Vercel**

---

**Beneficio clave:** Una vez autenticado, tendrás **gestión completa de tu dashboard Next.js** directamente desde Claude Code, sin salir de tu editor. 🎯

---

**Autor:** Claude Code
**Versión:** 1.0.0
**Última actualización:** 2025-10-20
