# 🚀 Guía de Deployment - CapiBobbaBot Dashboard

## 📋 Pre-requisitos

- Node.js 18.17+ instalado
- Cuenta en [Vercel](https://vercel.com) o [Render](https://render.com)
- Backend de CapiBobbaBot corriendo y accesible

## 🎯 Opciones de Deployment

### Opción 1: Vercel (Recomendado para Next.js)

#### Deploy Automático desde GitHub

1. **Conectar repositorio:**
   ```bash
   # Push tu código a GitHub
   git push origin main
   ```

2. **Importar en Vercel:**
   - Ve a [vercel.com/new](https://vercel.com/new)
   - Selecciona tu repositorio
   - Framework: Next.js (auto-detectado)
   - Click en "Deploy"

3. **Configurar variables de entorno:**
   - En el dashboard de Vercel > Settings > Environment Variables
   - Agregar:
     - `NEXT_PUBLIC_API_URL`: URL de tu backend (ej: `https://capibobbabot.onrender.com`)
     - `NEXT_PUBLIC_WS_URL`: URL de WebSocket (ej: `wss://capibobbabot.onrender.com`)

4. **Redeploy:**
   - Vercel re-deployará automáticamente con las nuevas variables

#### Deploy Manual (CLI)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy a producción
vercel --prod

# Durante el setup:
# - Framework: Next.js
# - Output directory: .next
# - Agregar variables de entorno cuando se solicite
```

### Opción 2: Render

#### Deploy desde Dashboard

1. **Crear nuevo Static Site:**
   - Ve a [render.com/dashboard](https://dashboard.render.com)
   - Click en "New +" > "Static Site"
   - Conecta tu repositorio de GitHub

2. **Configuración:**
   - Name: `capibobbabot-dashboard`
   - Branch: `main`
   - Build Command: `npm run build`
   - Publish Directory: `.next`

3. **Variables de entorno:**
   - `NEXT_PUBLIC_API_URL`: URL de tu backend
   - `NEXT_PUBLIC_WS_URL`: URL de WebSocket
   - `NODE_ENV`: `production`

4. **Deploy:**
   - Click en "Create Static Site"
   - Render construirá y deployará automáticamente

#### Deploy usando render.yaml

```bash
# El archivo render.yaml está incluido en el proyecto
# Solo conecta tu repo en Render y se auto-configurará
```

### Opción 3: Docker (Self-Hosted)

```bash
# Crear Dockerfile (opcional, no incluido)
# Build
docker build -t capibobbabot-dashboard .

# Run
docker run -p 3001:3001 \
  -e NEXT_PUBLIC_API_URL=http://localhost:3000 \
  -e NEXT_PUBLIC_WS_URL=ws://localhost:3000 \
  capibobbabot-dashboard
```

## 🔧 Build Local para Testing

```bash
# Instalar dependencias
npm install

# Build de producción
npm run build

# Probar build localmente
npm start

# El dashboard estará en http://localhost:3000
```

## ✅ Checklist Post-Deployment

- [ ] Dashboard accesible en la URL de producción
- [ ] Variables de entorno configuradas correctamente
- [ ] Conexión al backend funcional (verificar `/health`)
- [ ] WebSocket conectándose correctamente
- [ ] Métricas cargando datos reales
- [ ] Tablas de pedidos mostrando datos
- [ ] Dark mode funcionando
- [ ] Navegación entre páginas funcional
- [ ] Responsive design en mobile

## 🐛 Troubleshooting

### Error: "API connection failed"

```bash
# Verificar que NEXT_PUBLIC_API_URL esté configurado
# Debe incluir protocolo (https://) y no terminar en /
# Ejemplo correcto: https://api.example.com
# Ejemplo incorrecto: api.example.com/
```

### Error: "WebSocket disconnected"

```bash
# Verificar NEXT_PUBLIC_WS_URL
# Debe usar wss:// en producción (ws:// en desarrollo)
# Verificar que el backend tenga WebSocket habilitado
```

### Error: "Module not found"

```bash
# Limpiar cache y reinstalar
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### Problemas de CORS

```bash
# En el backend, agregar el dominio del dashboard a CORS whitelist
# Ejemplo en Express:
const cors = require('cors');
app.use(cors({
  origin: ['https://tu-dashboard.vercel.app']
}));
```

## 📊 Monitoreo Post-Deploy

1. **Logs en Vercel:**
   - Dashboard > Deployments > [tu deploy] > Logs

2. **Logs en Render:**
   - Dashboard > [tu sitio] > Logs (tab superior)

3. **Analytics:**
   - Vercel Analytics (incluido gratis)
   - Google Analytics (agregar en layout.tsx)

## 🔄 Actualizaciones

```bash
# Los deploys son automáticos en push a main
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main

# Vercel/Render detectarán el push y deployarán automáticamente
```

## 🔒 Seguridad

- Las variables de entorno **nunca** se commitean al repo
- Usa `.env.local` para desarrollo local
- En producción, configura variables en el dashboard de tu plataforma
- HTTPS está habilitado por defecto en Vercel/Render
- Headers de seguridad están configurados en `next.config.js`

## 🌐 Dominios Personalizados

### Vercel
1. Settings > Domains
2. Agregar tu dominio
3. Configurar DNS según instrucciones

### Render
1. Settings > Custom Domains
2. Agregar dominio
3. Configurar CNAME en tu proveedor de DNS

## 📈 Performance

El dashboard está optimizado con:
- ✅ Server-side rendering (SSR)
- ✅ Static generation donde sea posible
- ✅ Code splitting automático
- ✅ Image optimization (Next.js Image)
- ✅ Tree shaking
- ✅ Minificación con SWC
- ✅ Lazy loading de componentes pesados

---

**¿Necesitas ayuda?** Revisa los logs en tu plataforma de hosting o consulta [project.md](../project.md) para más detalles técnicos.
