# 🚀 Guía de Deployment a Vercel - CapiBobbaBot Dashboard

**Fecha:** 2025-10-20
**Versión Dashboard:** v0.6.0
**Objetivo:** Migrar dashboard-next de Render a Vercel (solución gratuita)

---

## 📋 Pre-requisitos

- ✅ Cuenta de Vercel (gratis): https://vercel.com/signup
- ✅ Repositorio GitHub con el proyecto CapiBobbaBot
- ✅ Backend API corriendo en: https://capibobbabot.onrender.com
- ✅ Node.js 18+ localmente para testing

---

## 🎯 Paso 1: Preparación del Proyecto

### 1.1 Verificar Configuración Local

```bash
# Navegar al directorio del dashboard
cd dashboard-next

# Instalar dependencias
npm install

# Verificar que build funciona localmente
npm run build

# Si el build es exitoso, continuar
```

### 1.2 Verificar Variables de Entorno

El archivo `.env.example` ya está configurado. Para producción en Vercel usaremos:

```env
# Variables que configurarás en Vercel Dashboard
NEXT_PUBLIC_API_URL=https://capibobbabot.onrender.com
NEXT_PUBLIC_WS_URL=wss://capibobbabot.onrender.com
```

---

## 🚀 Paso 2: Deploy a Vercel

### Opción A: Deploy desde la Web (Recomendado para primera vez)

#### 2.1 Conectar Repositorio

1. Ve a https://vercel.com/new
2. Click en "Import Git Repository"
3. Selecciona tu repositorio: `FeyoMx/CapiBobbaBot`
4. Autoriza a Vercel para acceder al repo

#### 2.2 Configurar Proyecto

En la pantalla de configuración:

**Framework Preset:**
- Vercel detectará automáticamente "Next.js"

**Root Directory:**
- Click en "Edit" y selecciona: `dashboard-next`
- ⚠️ **MUY IMPORTANTE**: El root directory DEBE ser `dashboard-next`

**Build Settings:**
- Build Command: `npm run build` (auto-detectado)
- Output Directory: `.next` (auto-detectado)
- Install Command: `npm install` (auto-detectado)

#### 2.3 Configurar Variables de Entorno

Click en "Environment Variables" y agrega:

| Name | Value | Environments |
|------|-------|--------------|
| `NEXT_PUBLIC_API_URL` | `https://capibobbabot.onrender.com` | Production, Preview, Development |
| `NEXT_PUBLIC_WS_URL` | `wss://capibobbabot.onrender.com` | Production, Preview, Development |

#### 2.4 Deploy!

1. Click en "Deploy"
2. Espera 2-3 minutos mientras Vercel:
   - Clona el repositorio
   - Instala dependencias
   - Ejecuta el build
   - Despliega a CDN global

3. ✅ Una vez completado, verás tu dashboard en:
   - **URL de producción**: `https://capibobbabot-dashboard.vercel.app` (o similar)
   - Vercel te dará una URL única automáticamente

---

### Opción B: Deploy desde CLI (Para usuarios avanzados)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login a Vercel
vercel login

# Desde el directorio raíz del proyecto
cd /path/to/CapiBobbaBot

# Deploy a producción
vercel --prod

# Seguir las instrucciones:
# 1. Set up and deploy? Yes
# 2. Which scope? Tu cuenta personal/team
# 3. Link to existing project? No (primera vez)
# 4. Project name? capibobbabot-dashboard
# 5. In which directory is your code located? dashboard-next
# 6. Want to modify settings? No (usa vercel.json)
```

**Configurar variables de entorno vía CLI:**

```bash
# Agregar variables de entorno
vercel env add NEXT_PUBLIC_API_URL production
# Ingresa: https://capibobbabot.onrender.com

vercel env add NEXT_PUBLIC_WS_URL production
# Ingresa: wss://capibobbabot.onrender.com

# Re-deploy para aplicar cambios
vercel --prod
```

---

## 🔧 Paso 3: Configuración Post-Deploy

### 3.1 Configurar Dominio Personalizado (Opcional)

Si tienes un dominio propio:

1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Domains
3. Add Domain: `dashboard.capibobbabot.com`
4. Sigue las instrucciones para configurar DNS

### 3.2 Configurar Git Auto-Deploy

Vercel ya está configurado para auto-deploy en cada push a `main`:

```json
// En vercel.json ya configurado:
"git": {
  "deploymentEnabled": {
    "main": true
  }
}
```

**Flujo de trabajo:**
1. Haces cambios en `dashboard-next/`
2. Commit y push a `main`
3. Vercel automáticamente detecta cambios
4. Build y deploy en ~2 minutos
5. Dashboard actualizado en producción

### 3.3 Verificar Deploy Exitoso

```bash
# Verificar que la API se conecta correctamente
curl https://tu-dashboard.vercel.app/api/metrics/dashboard

# Deberías recibir las métricas del backend
```

**En el navegador:**
1. Abre tu URL de Vercel
2. Verifica que carga el dashboard
3. Revisa la consola del navegador (F12) para errores
4. Prueba que las métricas se actualizan

---

## 📊 Paso 4: Monitoreo y Logs

### 4.1 Ver Logs de Build

- Vercel Dashboard → Tu Proyecto → Deployments
- Click en el deployment más reciente
- Ver "Build Logs" para errores

### 4.2 Ver Logs de Runtime

- Vercel Dashboard → Tu Proyecto → Logs
- Real-time logs de errores de servidor/cliente

### 4.3 Analytics (Gratis en Vercel)

- Vercel Dashboard → Tu Proyecto → Analytics
- Ver métricas de performance (Web Vitals)
- Revisar tráfico y errores

---

## 🔐 Paso 5: Seguridad y Optimizaciones

### 5.1 Configurar CORS en Backend

En tu backend (Render), asegúrate de permitir tu dominio de Vercel:

```javascript
// En chatbot.js o donde manejes CORS
const allowedOrigins = [
  'https://capibobbabot-dashboard.vercel.app',
  'https://tu-dominio-personalizado.com',
  'http://localhost:3001' // Para desarrollo
];
```

### 5.2 Optimizaciones de Vercel

Vercel ya incluye automáticamente:
- ✅ CDN global (>70 regiones)
- ✅ Compresión Brotli/Gzip
- ✅ Image optimization
- ✅ Code splitting automático
- ✅ Edge caching
- ✅ HTTPS automático

---

## 🆘 Troubleshooting

### Error: "Build Failed"

**Problema:** Error en `npm run build`

**Solución:**
```bash
# Verifica localmente primero
cd dashboard-next
npm install
npm run build

# Si falla localmente, revisa errores TypeScript/ESLint
npm run type-check
npm run lint
```

### Error: "API calls failing (CORS)"

**Problema:** CORS bloqueando requests desde Vercel a Render

**Solución:**
1. Revisa backend CORS settings
2. Asegúrate de incluir tu URL de Vercel en `allowedOrigins`
3. Redeploy backend en Render

### Error: "Environment variables not found"

**Problema:** `NEXT_PUBLIC_API_URL` undefined

**Solución:**
1. Ve a Vercel Dashboard → Settings → Environment Variables
2. Verifica que existan las variables
3. Re-deploy (Deployments → tres puntos → Redeploy)

### Error: "WebSocket connection failed"

**Problema:** No se puede conectar al WS del backend

**Solución:**
1. Verifica que `NEXT_PUBLIC_WS_URL` use `wss://` (no `ws://`)
2. Revisa que backend Render permita WebSocket connections
3. Verifica en Network tab del navegador

---

## 📈 Comparación Render vs Vercel

| Feature | Render (Free) | Vercel (Free) | Ganador |
|---------|---------------|---------------|---------|
| **Costo** | $0 | $0 | 🤝 Empate |
| **Build time** | ~3-5 min | ~1-2 min | ✅ Vercel |
| **Auto-deploy** | ✅ | ✅ | 🤝 Empate |
| **CDN global** | ❌ | ✅ | ✅ Vercel |
| **Analytics** | ❌ | ✅ Gratis | ✅ Vercel |
| **Cold starts** | 50s+ | 0s | ✅ Vercel |
| **Bandwidth** | 100GB/mes | 100GB/mes | 🤝 Empate |
| **SSL/HTTPS** | ✅ | ✅ | 🤝 Empate |
| **Dominio custom** | ✅ | ✅ | 🤝 Empate |
| **Edge Functions** | ❌ | ✅ | ✅ Vercel |
| **Image Optimization** | ❌ | ✅ | ✅ Vercel |
| **Preview Deploys** | ❌ | ✅ | ✅ Vercel |

**Conclusión:** Vercel es superior para Next.js (es su creador). ✅

---

## ✅ Checklist de Migración Completa

- [ ] Cuenta Vercel creada
- [ ] Repositorio conectado
- [ ] Root directory configurado: `dashboard-next`
- [ ] Variables de entorno agregadas:
  - [ ] `NEXT_PUBLIC_API_URL`
  - [ ] `NEXT_PUBLIC_WS_URL`
- [ ] Deploy exitoso (sin errores de build)
- [ ] Dashboard carga correctamente en navegador
- [ ] API calls funcionando (sin CORS errors)
- [ ] WebSocket conectado (si aplica)
- [ ] Métricas actualizándose en dashboard
- [ ] CORS configurado en backend para nueva URL
- [ ] Servicio de Render dashboard deshabilitado/eliminado
- [ ] Documentación actualizada (project.md, README.md)

---

## 🎯 Próximos Pasos Post-Migración

1. **Actualizar enlaces internos:**
   - Cambiar URLs de dashboard en documentación
   - Actualizar links en project.md
   - Notificar a usuarios del nuevo URL

2. **Monitorear primeras 24h:**
   - Revisar logs de Vercel
   - Verificar analytics de tráfico
   - Asegurar que no hay errores

3. **Optimizar performance:**
   - Revisar Web Vitals en Vercel Analytics
   - Implementar mejoras sugeridas por Lighthouse

4. **Deshabilitar Render:**
   - Suspender/eliminar servicio de dashboard en Render
   - Mantener solo backend en Render
   - Ahorrar recursos

---

## 📞 Recursos y Soporte

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Vercel CLI**: https://vercel.com/docs/cli
- **Soporte Vercel**: https://vercel.com/support

---

## 📝 Notas Finales

- ✅ Vercel es **gratis** para proyectos personales/open-source
- ✅ No requiere tarjeta de crédito para plan gratuito
- ✅ 100GB bandwidth/mes es MÁS que suficiente
- ✅ Deploy automático en cada push a main
- ✅ Preview deploys para PRs (super útil!)
- ✅ Edge network global = dashboard ultra rápido
- ✅ Built-in analytics sin costo extra

**¡Tu dashboard estará en producción en menos de 10 minutos!** 🚀

---

**Autor:** Claude Code
**Versión:** 1.0.0
**Última actualización:** 2025-10-20
