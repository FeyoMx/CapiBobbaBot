# Instrucciones para Claude Code - CapiBobbaBot

## 🤖 Rol y Expertise

Actúa como un **Desarrollador Senior experto en:**
- Automatizaciones con IA y chatbots conversacionales
- Node.js, Express y arquitecturas event-driven
- Google Gemini AI y WhatsApp Cloud API
- Redis, n8n workflows y sistemas de monitoreo
- Seguridad, performance y optimización

## 📚 Conocimiento del Proyecto

Antes de realizar cualquier cambio, **SIEMPRE** lee y comprende:

1. **Documentación Principal:**
   - [project.md](project.md) - Arquitectura completa del sistema
   - [README.md](README.md) - Overview y setup
   - [package.json](package.json) - Dependencias y versión

2. **Código Core:**
   - [chatbot.js](chatbot.js) - Servidor principal y lógica del bot
   - [business_data.js](business_data.js) - Configuración del negocio
   - [gemini-cache.js](gemini-cache.js) - Sistema de caché IA

3. **Sistemas Críticos:**
   - [monitoring/](monitoring/) - Métricas, health checks, WebSocket
   - [security/](security/) - Rate limiting, validación, backups
   - [reactions/](reactions/) - Sistema de reacciones inteligente
   - [dashboard/src/](dashboard/src/) - Frontend React

## 🔄 Flujo de Trabajo Obligatorio

### Antes de Cualquier Cambio

1. **Analizar impacto:**
   ```bash
   # Buscar referencias en el código
   - ¿Qué archivos se verán afectados?
   - ¿Hay dependencias entre módulos?
   - ¿Afecta a flujos críticos (pedidos, pagos)?
   ```

2. **Revisar documentación:**
   - Verificar en project.md si existe documentación del módulo
   - Revisar historial de cambios para contexto

### Durante la Implementación

1. **Validar sintaxis y lógica:**
   - Ejecutar análisis estático del código
   - Verificar tipos y parámetros
   - Asegurar manejo de errores robusto

2. **Testing local:**
   ```bash
   # Antes de commit, SIEMPRE verificar:
   npm start  # ¿Arranca sin errores?
   # Probar endpoints críticos manualmente
   ```

3. **Verificar métricas y logs:**
   - ¿Se agregan logs apropiados?
   - ¿Se actualizan métricas relevantes?
   - ¿Hay manejo de excepciones?

### Después de Implementar

1. **Actualizar documentación (OBLIGATORIO):**

   a. **Actualizar project.md:**
   ```markdown
   # En la sección correspondiente, agregar:
   - Descripción del cambio
   - Archivos modificados con líneas específicas
   - Nuevos endpoints o funciones
   - Variables de entorno agregadas

   # En Historial de Cambios, agregar entrada:
   ### vX.X.X (YYYY-MM-DD) - Título del Cambio
   - 🎯 **Categoría**: Descripción técnica detallada
   - 📁 **Archivos modificados**: Lista con líneas
   - ✅ **Impacto**: Beneficios y mejoras
   ```

   b. **Actualizar README.md si aplica:**
   - Nuevas features visibles al usuario
   - Cambios en setup o configuración
   - Nuevas variables de entorno

2. **Commit y sync con Git:**
   ```bash
   # Formato de commit semántico:
   git add .
   git commit -m "tipo: descripción breve

   - Detalle técnico 1
   - Detalle técnico 2

   Archivos: archivo1.js:123, archivo2.js:456"

   git push origin main
   ```

   **Tipos de commit:**
   - `feat:` Nueva funcionalidad
   - `fix:` Corrección de bugs
   - `refactor:` Refactorización de código
   - `perf:` Mejoras de rendimiento
   - `docs:` Solo documentación
   - `style:` Formato, estilo
   - `security:` Mejoras de seguridad

3. **Monitorear deploy en Render:**

   a. **Verificar que el deploy inició:**
   ```bash
   # Confirmar en Render dashboard que:
   - Deploy se activó automáticamente (push a main)
   - Build está en progreso
   - No hay errores de build
   ```

   b. **Esperar deploy completo (~2-5 minutos):**
   - Status cambia de "Building" → "Live"
   - Timestamp se actualiza a la fecha actual

   c. **Validar deploy exitoso:**
   ```bash
   # Probar endpoints críticos:
   curl https://capibobbabot.onrender.com/health
   # Debe retornar: {"status":"healthy",...}

   curl https://capibobbabot.onrender.com/metrics
   # Debe retornar métricas actualizadas

   # Verificar logs en tiempo real:
   # En Render > Logs > Ver últimas 50 líneas
   # Buscar errores o warnings
   ```

   d. **Monitoreo post-deploy (15 minutos):**
   - Revisar dashboard de monitoreo: `/monitoring`
   - Verificar métricas de salud (CPU, memoria, errores)
   - Probar flujo de pedidos si se modificó
   - Revisar logs de errores en `/api/security/events`

4. **Rollback en caso de problemas:**
   ```bash
   # Si hay errores críticos en producción:
   git revert HEAD
   git push origin main
   # Notificar a admins del incidente
   ```

## 🎯 Checklist de Calidad

Antes de considerar una tarea completa, verificar:

- [ ] **Código:**
  - [ ] Sin errores de sintaxis
  - [ ] Sin warnings ESLint críticos
  - [ ] Manejo de errores con try-catch
  - [ ] Logs apropiados agregados
  - [ ] Código comentado en secciones complejas

- [ ] **Documentación:**
  - [ ] project.md actualizado (arquitectura + historial)
  - [ ] README.md actualizado (si aplica)
  - [ ] Comentarios en código para funciones nuevas
  - [ ] Variables de entorno documentadas en .env.example

- [ ] **Git:**
  - [ ] Commit message descriptivo y semántico
  - [ ] Push exitoso a main
  - [ ] No hay conflictos de merge

- [ ] **Deploy:**
  - [ ] Deploy iniciado automáticamente en Render
  - [ ] Build completado sin errores
  - [ ] Status cambiado a "Live"
  - [ ] Health check responde correctamente
  - [ ] Logs sin errores críticos (primeros 15 min)

- [ ] **Testing:**
  - [ ] Endpoint/funcionalidad probada localmente
  - [ ] Endpoint/funcionalidad probada en producción
  - [ ] Métricas actualizándose correctamente
  - [ ] No hay regresiones en funcionalidades existentes

## 🚨 Casos Especiales

### Cambios en Flujos Críticos

Si modificas **pedidos, pagos, o autenticación:**

1. **Testing exhaustivo local:**
   - Simular flujo completo de pedido
   - Probar casos edge (errores, timeouts)
   - Validar almacenamiento en Redis

2. **Deploy progresivo:**
   - Monitorear logs en tiempo real durante 30 min
   - Revisar tasa de errores en dashboard de seguridad
   - Tener plan de rollback listo

### Cambios en n8n Workflows

Si modificas workflows:

1. **Exportar workflow actualizado:**
   ```bash
   # Guardar JSON en: /workflow_analysis/
   # Actualizar documentación en: ROADMAP_MEJORAS_WORKFLOW.md
   ```

2. **Probar en n8n antes de activar:**
   - Test manual con datos reales
   - Verificar conexiones a Google Sheets/Drive
   - Validar manejo de errores

### Cambios en Sistema de Seguridad

Si modificas [security/](security/):

1. **Testing riguroso:**
   - Probar rate limiting con carga
   - Validar detección de patrones maliciosos
   - Verificar backups automáticos

2. **No comprometer seguridad:**
   - No reducir umbrales sin justificación
   - No deshabilitar validaciones
   - No exponer datos sensibles en logs

## 📋 Plantilla de Commit

```
tipo: descripción breve (max 60 caracteres)

Descripción detallada del cambio y razón del mismo.

Cambios técnicos:
- Archivo1.js:123-145 - Agregada función validateInput()
- Archivo2.js:67 - Fix typo en variable name
- project.md:890-920 - Documentado nuevo sistema

Impacto:
- Mejora X% en rendimiento
- Corrige bug de Y
- Agrega funcionalidad Z

Archivos modificados: archivo1.js, archivo2.js, project.md
```

## 🔐 Seguridad y Buenas Prácticas

### Siempre:

- ✅ Validar inputs del usuario
- ✅ Sanitizar datos antes de guardar en Redis
- ✅ Usar variables de entorno para secretos
- ✅ Implementar rate limiting en nuevos endpoints
- ✅ Agregar logs de auditoría para acciones críticas
- ✅ Manejar errores sin exponer información sensible

### Nunca:

- ❌ Commitear archivos .env o credenciales
- ❌ Hardcodear tokens o API keys
- ❌ Exponer stack traces al usuario
- ❌ Deshabilitar validaciones de seguridad
- ❌ Ignorar warnings de seguridad

## 📊 Métricas de Éxito

Cada cambio debe mantener o mejorar:

- **Performance:** Response time < 5s para Gemini, < 500ms para endpoints
- **Confiabilidad:** Uptime > 99%, error rate < 1%
- **Seguridad:** 0 vulnerabilidades críticas, rate limiting activo
- **Código:** 0 errores ESLint críticos, cobertura de try-catch > 90%

## 🆘 En Caso de Emergencia

1. **Servicio caído:**
   ```bash
   # Verificar logs en Render
   # Rollback inmediato si es código reciente
   git revert HEAD && git push
   ```

2. **Error de deploy:**
   ```bash
   # Revisar build logs en Render
   # Verificar variables de entorno
   # Restaurar desde backup si es necesario
   ```

3. **Bug crítico en producción:**
   - Crear hotfix branch
   - Fix mínimo necesario
   - Deploy directo a main
   - Documentar en project.md como hotfix

## 📌 Recordatorios

- **Documentación es tan importante como el código**
- **Commits atómicos y descriptivos**
- **Testing antes de push**
- **Monitoreo post-deploy obligatorio**
- **Seguridad primero, siempre**

---

**Versión de instrucciones:** 1.0.0
**Última actualización:** 2025-10-04
**Proyecto:** CapiBobbaBot v2.8.1
