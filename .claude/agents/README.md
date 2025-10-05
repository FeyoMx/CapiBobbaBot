# Subagentes Personalizados - CapiBobbaBot

Este directorio contiene subagentes especializados para el desarrollo de CapiBobbaBot.

## 🤖 Subagentes Disponibles

### 1. **UI/UX Senior** (`ui-ux-senior`)
**Expertise**: Diseño UI/UX, Frontend Moderno, Accesibilidad, Performance

**Cuándo usarlo:**
- Diseñar nuevas interfaces o mejorar las existentes
- Implementar componentes React/Next.js modernos
- Revisar código frontend por UX y performance
- Implementar accesibilidad (WCAG)
- Crear design systems y component libraries
- Optimizar Core Web Vitals

**Tecnologías:**
- React 18+, Next.js 14+, Vue 3, Svelte
- Tailwind CSS, shadcn/ui, Radix UI
- Framer Motion, GSAP
- TypeScript strict mode

**Ejemplo de uso:**
```
@ui-ux-senior Diseña un sistema de componentes con Tailwind para el dashboard
```

---

### 2. **Dashboard Expert** (`dashboard-expert`)
**Expertise**: Dashboards Administrativos, Data Visualization, Analytics UI

**Cuándo usarlo:**
- Crear dashboards de administración
- Implementar gráficos y visualizaciones de datos
- Diseñar tablas complejas con filtros avanzados
- Integrar real-time data updates
- Optimizar performance de dashboards con muchos datos

**Tecnologías:**
- Recharts, Chart.js, D3.js
- TanStack Table, TanStack Query
- WebSockets, Server-Sent Events
- Export de datos (CSV, Excel, PDF)

**Ejemplo de uso:**
```
@dashboard-expert Crea un dashboard overview con métricas de pedidos y Gemini
```

---

## 📖 Cómo Usar los Subagentes

### Método 1: Invocación Explícita
Menciona al subagente con `@` al inicio de tu prompt:

```
@ui-ux-senior Mejora la accesibilidad del formulario de pedidos
```

### Método 2: Invocación Automática
Claude puede invocar automáticamente el subagente correcto basándose en tu descripción:

```
# Claude detectará que necesitas el dashboard-expert:
"Necesito implementar gráficos de ventas por producto en el dashboard"
```

### Método 3: Uso Combinado
Puedes combinar múltiples subagentes en una conversación:

```
@ui-ux-senior Diseña la interfaz del nuevo módulo de analytics

# Luego en el siguiente mensaje:
@dashboard-expert Implementa los gráficos para el módulo que diseñamos
```

---

## 🎯 Casos de Uso por Proyecto

### Para CapiBobbaBot Dashboard

#### Escenario 1: Crear Dashboard desde Cero
```bash
# Paso 1: Diseño y arquitectura
@ui-ux-senior Diseña la arquitectura de componentes para el dashboard de CapiBobbaBot,
usando Next.js 14, Tailwind y shadcn/ui

# Paso 2: Implementar visualizaciones
@dashboard-expert Implementa los gráficos de métricas (pedidos, revenue, Gemini usage)
usando Recharts
```

#### Escenario 2: Mejorar Dashboard Existente
```bash
# Análisis y mejoras UX
@ui-ux-senior Revisa el código del dashboard actual y sugiere mejoras de UX,
accesibilidad y performance

# Optimización de datos
@dashboard-expert Optimiza la tabla de pedidos que tiene +5000 registros,
implementa virtualización y lazy loading
```

#### Escenario 3: Nuevas Features
```bash
# Dark mode
@ui-ux-senior Implementa dark mode en todo el dashboard con sistema de temas

# Real-time updates
@dashboard-expert Agrega actualización en tiempo real de métricas usando WebSocket
```

---

## 🛠️ Configuración de Subagentes

### Estructura de Archivos
```
.claude/
└── agents/
    ├── README.md              # Este archivo
    ├── ui-ux-senior.md        # Subagente UI/UX
    └── dashboard-expert.md    # Subagente Dashboard
```

### Anatomía de un Subagente
```markdown
---
name: nombre-del-agente
description: Descripción clara de cuándo usarlo
tools: Read, Write, Edit, Bash, ...
model: sonnet
---

# Contenido del System Prompt

Instrucciones detalladas, expertise, metodología, etc.
```

---

## 📚 Recursos y Referencias

### Documentación Oficial
- [Claude Code - Subagents](https://docs.claude.com/en/docs/claude-code/sub-agents.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Recharts](https://recharts.org/)

### Best Practices
- Usar subagentes para tareas específicas y complejas
- Mantener los system prompts actualizados con nuevas tecnologías
- Combinar subagentes para workflows complejos
- Revisar periódicamente el output de los subagentes

---

## 🔄 Mantenimiento

### Actualizar Subagentes
Edita los archivos `.md` directamente para:
- Agregar nuevas tecnologías
- Actualizar best practices
- Mejorar prompts basándose en uso real

### Crear Nuevos Subagentes
```bash
# Crear archivo en .claude/agents/
touch .claude/agents/mi-nuevo-agente.md

# Usar plantilla:
---
name: mi-nuevo-agente
description: Cuándo y para qué usarlo
tools: Lista de tools necesarias
model: sonnet
---

# System Prompt aquí...
```

---

## ⚡ Tips y Trucos

### Tip 1: Especificidad
Sé específico en tus prompts para obtener mejores resultados:

❌ Malo: "Mejora el dashboard"
✅ Bueno: "@ui-ux-senior Mejora la accesibilidad del dashboard: agrega ARIA labels, mejora contraste de colores para WCAG AA, y optimiza navegación por teclado"

### Tip 2: Contexto
Proporciona contexto sobre el proyecto actual:

```
@dashboard-expert Necesito crear un dashboard para CapiBobbaBot (chatbot de WhatsApp).
El backend está en chatbot.js, usa Redis, y ya tenemos /api/metrics endpoint.
Crea el frontend del dashboard con Next.js.
```

### Tip 3: Iteración
Trabaja iterativamente con los subagentes:

```
# Iteración 1: Diseño
@ui-ux-senior Diseña wireframe del dashboard

# Iteración 2: Componentes
@ui-ux-senior Implementa los componentes base

# Iteración 3: Integración
@dashboard-expert Integra los componentes con el API de métricas
```

---

**Versión**: 1.0.0
**Última actualización**: 2025-10-05
**Mantenedor**: CapiBobbaBot Team
