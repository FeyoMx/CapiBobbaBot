// chatbot.js
require('dotenv').config(); // Carga las variables de entorno desde el archivo .env

// === OPTIMIZACIONES DE MEMORIA PARA 512MB ===
// Configurar Node.js para usar menos memoria en entorno de 512MB
if (process.env.NODE_ENV === 'production') {
  // Reducir tamaño máximo del heap a 400MB (dejando 112MB para el sistema)
  process.env.NODE_OPTIONS = '--max-old-space-size=400';

  // Habilitar garbage collection agresivo
  process.env.NODE_OPTIONS += ' --expose-gc';

  // Configurar timeout para conexiones HTTP más corto
  process.env.UV_THREADPOOL_SIZE = '2'; // Reducir threads para ahorrar memoria
}

// Forzar garbage collection cada 5 minutos en producción
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    if (global.gc) {
      global.gc();
      console.log('🗑️ Garbage collection ejecutado - Memoria liberada');
    }
  }, 300000); // 5 minutos
}

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const redis = require('redis');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { BUSINESS_CONTEXT } = require('./business_data'); // Importa el contexto del negocio
const path = require('path');

// === SISTEMA DE MONITOREO ===
const MetricsCollector = require('./monitoring/metrics');
const HealthChecker = require('./monitoring/health-checker');
const MonitoringWebSocketServer = require('./monitoring/websocket-server');
const MemoryMonitor = require('./monitoring/memory-monitor');
const cron = require('node-cron');

// === SISTEMA DE SEGURIDAD ===
const { initializeSecurity, securityMiddleware, validateInput } = require('./security');

// === SISTEMA DE CACHÉ GEMINI ===
const GeminiCache = require('./gemini-cache');

// === SISTEMA DE REACCIONES INTELIGENTE ===
const { ReactionManager, REACTION_EMOJIS } = require('./reactions/reaction-manager');

// --- CONFIGURACIÓN ---
// Lee las variables de entorno de forma segura. ¡No dejes tokens en el código!
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ADMIN_WHATSAPP_NUMBERS = process.env.ADMIN_WHATSAPP_NUMBERS; // Plural
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const REDIS_URL = process.env.REDIS_URL;
const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v18.0';
const MAINTENANCE_MODE_KEY = 'maintenance_mode_status'; // Clave para Redis

// Validamos que las variables de entorno críticas estén definidas
if (!VERIFY_TOKEN || !WHATSAPP_TOKEN || !PHONE_NUMBER_ID || !GEMINI_API_KEY || !ADMIN_WHATSAPP_NUMBERS || !N8N_WEBHOOK_URL || !REDIS_URL) {
  console.error(
    'Error: Faltan variables de entorno críticas. ' +
    'Asegúrate de que VERIFY_TOKEN, WHATSAPP_TOKEN, PHONE_NUMBER_ID, GEMINI_API_KEY, ADMIN_WHATSAPP_NUMBERS, N8N_WEBHOOK_URL y REDIS_URL '
    +
    'estén en tu archivo .env'
  );
  process.exit(1); // Detiene la aplicación si falta configuración
}

const cors = require('cors');
const app = express();

// Habilita CORS para el dashboard en localhost y producción
const allowedOrigins = [
  'http://localhost:3001',
  'https://capibobbabot-dashboard-app.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir peticiones sin origin (como Postman) o desde orígenes permitidos
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(bodyParser.json());

// Servir la aplicación de React
app.use('/dashboard', express.static(path.join(__dirname, 'dashboard/build')));
// Servir archivos estáticos del dashboard de monitoreo
app.use('/css', express.static(path.join(__dirname, 'dashboard/css')));
app.use('/js', express.static(path.join(__dirname, 'dashboard/js')));

// === VARIABLES GLOBALES PARA MONITOREO ===
let metricsCollector = null;
let healthChecker = null;
let wsServer = null;
let memoryMonitor = null;

// === VARIABLES GLOBALES PARA SEGURIDAD ===
let security = null;

// === VARIABLES GLOBALES PARA CACHÉ ===
let geminiCache = null;

// === VARIABLES GLOBALES PARA REACCIONES ===
let reactionManager = null;


// --- CONEXIÓN A REDIS ---
// Helper para pausas
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const redisClient = redis.createClient({
  url: REDIS_URL
});

redisClient.on('error', err => console.error('Error en el cliente de Redis', err));
redisClient.on('connect', () => console.log('Conectado exitosamente a Redis.'));
redisClient.connect(); // <-- CRÍTICO: Es necesario para iniciar la conexión con Redis.

const PORT = process.env.PORT || 3000;

// === INICIO DEL BLOQUE PARA UPTIMEROBOT ===
// Endpoint raíz para que los monitores de salud (como UptimeRobot) sepan que el bot está vivo.
app.get('/', (req, res) => {
  res.status(200).send('CapiBobbaBot está en línea y funcionando. ¡Listo para recibir mensajes!');
});

// --- ENDPOINTS ---

// Endpoint para la verificación del Webhook (solo se usa una vez por Meta)
app.get('/webhook', (req, res) => {
  console.log("GET /webhook - Verificando webhook...");

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Valida que el modo y el token sean correctos
  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      // Si no coinciden, responde con '403 Forbidden'
      console.log('Verification failed. Tokens do not match.');
      res.sendStatus(403);
    }
  } else {
      res.sendStatus(400);
  }
});

// 5. MODIFICACIÓN DEL ENDPOINT DE WEBHOOK EXISTENTE
// REEMPLAZA tu función actual de manejo de webhook con esta versión mejorada:

app.post('/webhook', async (req, res) => {
    console.log('📨 Webhook recibido. Headers:', req.headers);
    console.log('📦 Cuerpo completo del webhook:', JSON.stringify(req.body, null, 2));

    const body = req.body;

    // Validar que llegó información
    if (!body || Object.keys(body).length === 0) {
        console.log('❌ Webhook vacío recibido');
        return res.status(400).send('Webhook body is empty');
    }

    try {
        // Verificar si es un mensaje de WhatsApp
        if (body.object === 'whatsapp_business_account' && body.entry && body.entry[0] && body.entry[0].changes) {
            const changes = body.entry[0].changes[0];

            if (changes.field === 'messages' && changes.value && changes.value.messages) {
                const messages = changes.value.messages;

                for (const message of messages) {
                    console.log('📱 Procesando mensaje de WhatsApp:', JSON.stringify(message, null, 2));

                    const phoneNumber = message.from;
                    const messageId = message.id;

                    // Marcar mensaje como leído inmediatamente (mejor UX)
                    if (messageId) {
                        markMessageAsRead(messageId).catch(() => {}); // Ignorar errores
                    }

                    // Enviar indicador de typing (no bloquea el flujo)
                    if (messageId) {
                        sendTypingOn(messageId).catch(() => {}); // Ignorar errores
                    }

                    // === VALIDACIONES DE SEGURIDAD ===
                    if (security) {
                        // 1. Verificar si el usuario está bloqueado
                        const isBlocked = await security.securityMonitor.isUserBlocked(phoneNumber);
                        if (isBlocked) {
                            console.log(`🚫 Usuario bloqueado: ${phoneNumber}`);
                            await security.securityMonitor.logSecurityEvent('blocked_user_attempt', {
                                phoneNumber,
                                messageType: message.type
                            });
                            continue; // Saltar este mensaje
                        }

                        // 2. Verificar rate limiting
                        const rateLimitCheck = await security.rateLimiter.checkAllLimits(phoneNumber);
                        if (!rateLimitCheck.allowed) {
                            console.log(`⏱️ Rate limit excedido para ${phoneNumber}: ${rateLimitCheck.reason}`);

                            // Registrar evento de seguridad
                            await security.securityMonitor.logSecurityEvent('rate_limit_exceeded', {
                                phoneNumber,
                                reason: rateLimitCheck.reason
                            });

                            // Notificar al usuario
                            await sendTextMessage(
                                phoneNumber,
                                `⏱️ Has enviado demasiados mensajes. ${rateLimitCheck.reason}`
                            );
                            continue;
                        }

                        // 3. Validar y sanitizar mensaje
                        const validation = security.inputValidator.validateWhatsAppMessage(message);
                        if (!validation.valid) {
                            console.log(`❌ Mensaje inválido de ${phoneNumber}:`, validation.errors);

                            // Registrar actividad sospechosa
                            await security.securityMonitor.logSecurityEvent('invalid_input', {
                                phoneNumber,
                                errors: validation.errors,
                                messageType: message.type
                            });

                            await sendTextMessage(
                                phoneNumber,
                                '❌ Tu mensaje contiene contenido inválido. Por favor intenta de nuevo.'
                            );
                            continue;
                        }

                        // 4. Detectar actividad sospechosa
                        if (validation.suspicious) {
                            console.log(`⚠️ Actividad sospechosa detectada de ${phoneNumber}`);

                            await security.securityMonitor.logSecurityEvent('suspicious_activity', {
                                phoneNumber,
                                messageType: message.type,
                                errors: validation.errors
                            });

                            // No bloquear todavía, pero monitorear
                        }

                        // Usar mensaje sanitizado
                        Object.assign(message, validation.sanitized);
                    }

                    // Enviar mensaje a n8n con el formato esperado por el workflow
                    const n8nPayload = {
                        rawMessage: message,
                        from: message.from,
                        timestamp: message.timestamp,
                        type: message.type
                    };

                    // Agregar contenido específico según el tipo de mensaje
                    if (message.type === 'text' && message.text) {
                        n8nPayload.text = message.text.body;
                    } else if (message.type === 'interactive' && message.interactive) {
                        n8nPayload.interactive = message.interactive;
                    }

                    // Registrar métrica de mensaje procesado
                    if (metricsCollector) {
                        metricsCollector.recordMessage(message.type || 'text');
                    }

                    // Notificar al WebSocket sobre el nuevo mensaje
                    if (wsServer) {
                        wsServer.notifyNewMessage({
                            from: message.from,
                            type: message.type,
                            timestamp: new Date().toISOString()
                        });
                    }

                    // Enviar a n8n primero
                    await sendToN8n(message);

                    // Verificar modo de mantenimiento
                    const maintenanceMode = await redisClient.get(MAINTENANCE_MODE_KEY);
                    if (maintenanceMode === 'true' && !checkIfAdminForWorkflow(message.from)) {
                        await sendTextMessage(
                            message.from,
                            '🔧 Estamos en mantenimiento. El servicio estará disponible pronto. Gracias por tu paciencia.'
                        );
                        continue;
                    }

                    // Procesar el mensaje normalmente
                    try {
                        await processIncomingMessage(message);

                        // Registrar actividad del bot para monitoreo interno
                        if (metricsCollector) {
                            await metricsCollector.setMetricInRedis('bot:last_activity', Date.now(), 7200); // 2 horas
                        }
                    } catch (processingError) {
                        console.error('❌ Error procesando mensaje específico:', processingError);

                        // Registrar error de seguridad si está disponible
                        if (security) {
                            await security.securityMonitor.logSecurityEvent('message_processing_error', {
                                phoneNumber,
                                error: processingError.message
                            });
                        }
                        // Continuar con el siguiente mensaje en lugar de fallar completamente
                    }
                }
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('❌ Error procesando webhook:', error);
        res.status(500).send('Error interno del servidor');
    }
});


// --- API PARA EL DASHBOARD ---

// Endpoint para obtener el estado del modo de mantenimiento
app.get('/api/maintenance', async (req, res) => {
  try {
    const isMaintenanceMode = await redisClient.get(MAINTENANCE_MODE_KEY) === 'true';
    res.json({ maintenanceMode: isMaintenanceMode });
  } catch (error) {
    console.error('Error al obtener el estado de mantenimiento:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Endpoint para actualizar el estado del modo de mantenimiento
app.post('/api/maintenance', async (req, res) => {
  const { maintenanceMode } = req.body;
  if (typeof maintenanceMode !== 'boolean') {
    return res.status(400).json({ error: 'El estado de mantenimiento debe ser un booleano' });
  }

  try {
    if (maintenanceMode) {
      await redisClient.set(MAINTENANCE_MODE_KEY, 'true');
      await notifyAdmin(`⚠️ Un administrador ha ACTIVADO el modo "Fuera de Servicio" desde el dashboard.`);
    } else {
      await redisClient.del(MAINTENANCE_MODE_KEY);
      await notifyAdmin(`🟢 Un administrador ha DESACTIVADO el modo "Fuera de Servicio" desde el dashboard.`);
    }
    res.json({ success: true, maintenanceMode });
  } catch (error) {
    console.error('Error al actualizar el estado de mantenimiento:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Endpoint para obtener los datos del negocio
app.get('/api/business-data', (req, res) => {
  fs.readFile(path.join(__dirname, 'business_data.json'), 'utf8', (err, data) => {
    if (err) {
      console.error('Error al leer business_data.json:', err);
      return res.status(500).json({ error: 'Error al leer los datos del negocio.' });
    }
    try {
      res.json(JSON.parse(data));
    } catch (parseError) {
      console.error('Error al parsear business_data.json:', parseError);
      res.status(500).json({ error: 'El formato del archivo de datos es inválido.' });
    }
  });
});

// Endpoint para actualizar los datos del negocio
app.post('/api/business-data', (req, res) => {
    const newBusinessData = req.body;
    const jsonContent = JSON.stringify(newBusinessData, null, 4); // 4 espacios para indentación

    fs.writeFile(path.join(__dirname, 'business_data.json'), jsonContent, 'utf8', async (err) => {
        if (err) {
            console.error('Error al escribir en business_data.json:', err);
            return res.status(500).json({ error: 'No se pudo guardar la configuración.' });
        }
        console.log('business_data.json actualizado correctamente.');
        await notifyAdmin('✅ La información del negocio (menú, promos, etc.) ha sido actualizada desde el dashboard.');
        res.json({ success: true });
    });
});

// Nota: Las encuestas son manejadas por n8n, no necesitamos endpoints para enviarlas

// === ENDPOINTS DE SEGURIDAD ===

// Endpoint para obtener estadísticas de seguridad
app.get('/api/security/stats', async (req, res) => {
    try {
        if (!security) {
            return res.status(503).json({ error: 'Sistema de seguridad no inicializado' });
        }

        const stats = await security.securityMonitor.getSecurityStats();
        res.json(stats);
    } catch (error) {
        console.error('Error obteniendo estadísticas de seguridad:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Endpoint para obtener alertas activas
app.get('/api/security/alerts', async (req, res) => {
    try {
        if (!security) {
            return res.status(503).json({ error: 'Sistema de seguridad no inicializado' });
        }

        const alerts = await security.securityMonitor.getActiveAlerts();
        res.json({ alerts });
    } catch (error) {
        console.error('Error obteniendo alertas de seguridad:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Endpoint para desbloquear un usuario manualmente
app.post('/api/security/unblock', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId es requerido' });
        }

        if (!security) {
            return res.status(503).json({ error: 'Sistema de seguridad no inicializado' });
        }

        await security.securityMonitor.unblockUser(userId);
        await security.rateLimiter.resetUserLimits(userId);

        res.json({ success: true, message: `Usuario ${userId} desbloqueado` });
    } catch (error) {
        console.error('Error desbloqueando usuario:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Endpoint para obtener estadísticas de uso de un usuario
app.get('/api/security/user-stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        if (!security) {
            return res.status(503).json({ error: 'Sistema de seguridad no inicializado' });
        }

        const stats = await security.rateLimiter.getUserStats(userId);
        const isBlocked = await security.securityMonitor.isUserBlocked(userId);

        res.json({
            userId,
            isBlocked,
            stats
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas de usuario:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Endpoint para crear un backup manual
app.post('/api/security/backup', async (req, res) => {
    try {
        if (!security) {
            return res.status(503).json({ error: 'Sistema de seguridad no inicializado' });
        }

        const result = await security.redisBackup.createBackup();

        if (result.success) {
            res.json({
                success: true,
                message: 'Backup creado exitosamente',
                file: result.file,
                keyCount: result.keyCount,
                duration: result.duration
            });
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        console.error('Error creando backup:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Endpoint para listar backups disponibles
app.get('/api/security/backups', async (req, res) => {
    try {
        if (!security) {
            return res.status(503).json({ error: 'Sistema de seguridad no inicializado' });
        }

        const backups = await security.redisBackup.listBackups();
        res.json({ backups });
    } catch (error) {
        console.error('Error listando backups:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Endpoint para obtener usuarios bloqueados
app.get('/api/security/blocked-users', async (req, res) => {
    try {
        if (!security) {
            return res.status(503).json({ error: 'Sistema de seguridad no inicializado' });
        }

        const pattern = 'security:blocked:*';
        const keys = await redisClient.keys(pattern);

        const blockedUsers = [];
        for (const key of keys) {
            const data = await redisClient.get(key);
            if (data) {
                const blockInfo = JSON.parse(data);
                const userId = key.replace('security:blocked:', '');
                blockedUsers.push({
                    userId,
                    ...blockInfo
                });
            }
        }

        res.json(blockedUsers);
    } catch (error) {
        console.error('Error obteniendo usuarios bloqueados:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Endpoint para obtener eventos de seguridad recientes
app.get('/api/security/events', async (req, res) => {
    try {
        if (!security) {
            return res.status(503).json({ error: 'Sistema de seguridad no inicializado' });
        }

        const limit = parseInt(req.query.limit) || 20;
        const pattern = 'security:events:*';
        const keys = await redisClient.keys(pattern);

        const events = [];
        for (const key of keys) {
            const data = await redisClient.get(key);
            if (data) {
                events.push(JSON.parse(data));
            }
        }

        // Ordenar por timestamp descendente y limitar
        events.sort((a, b) => b.timestamp - a.timestamp);
        const limitedEvents = events.slice(0, limit);

        res.json(limitedEvents);
    } catch (error) {
        console.error('Error obteniendo eventos de seguridad:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Endpoint para desbloquear usuario específico (ruta con parámetro)
app.post('/api/security/unblock/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        if (!security) {
            return res.status(503).json({ error: 'Sistema de seguridad no inicializado' });
        }

        await security.securityMonitor.unblockUser(userId);
        await security.rateLimiter.resetUserLimits(userId);

        res.json({ success: true, message: `Usuario ${userId} desbloqueado` });
    } catch (error) {
        console.error('Error desbloqueando usuario:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// === ENDPOINTS DE CACHÉ GEMINI ===

// Endpoint para obtener estadísticas de caché
app.get('/api/gemini/cache/stats', async (req, res) => {
    try {
        if (!geminiCache) {
            return res.status(503).json({ error: 'Sistema de caché no inicializado' });
        }

        const stats = await geminiCache.getStats();
        res.json(stats);
    } catch (error) {
        console.error('Error obteniendo estadísticas de caché:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Endpoint para obtener entradas populares del caché
app.get('/api/gemini/cache/popular', async (req, res) => {
    try {
        if (!geminiCache) {
            return res.status(503).json({ error: 'Sistema de caché no inicializado' });
        }

        const limit = parseInt(req.query.limit) || 10;
        const entries = await geminiCache.getPopularEntries(limit);
        res.json({ entries, count: entries.length });
    } catch (error) {
        console.error('Error obteniendo entradas populares:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Endpoint para limpiar la caché
app.post('/api/gemini/cache/clear', async (req, res) => {
    try {
        if (!geminiCache) {
            return res.status(503).json({ error: 'Sistema de caché no inicializado' });
        }

        const deleted = await geminiCache.clear();
        res.json({ success: true, deleted, message: `${deleted} entradas eliminadas` });
    } catch (error) {
        console.error('Error limpiando caché:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Endpoint para invalidar una entrada específica
app.post('/api/gemini/cache/invalidate', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'El campo "message" es requerido' });
        }

        if (!geminiCache) {
            return res.status(503).json({ error: 'Sistema de caché no inicializado' });
        }

        const invalidated = await geminiCache.invalidate(message);
        res.json({
            success: invalidated,
            message: invalidated ? 'Entrada invalidada' : 'Entrada no encontrada'
        });
    } catch (error) {
        console.error('Error invalidando entrada:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// === ENDPOINTS DEL SISTEMA DE REACCIONES ===

// Endpoint para obtener estadísticas de reacciones
app.get('/api/reactions/stats', async (req, res) => {
    try {
        if (!reactionManager) {
            return res.status(503).json({ error: 'Sistema de reacciones no inicializado' });
        }

        const stats = reactionManager.getReactionStats();
        res.json({
            success: true,
            stats: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas de reacciones:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Endpoint para limpiar historial de reacciones antiguas
app.post('/api/reactions/cleanup', async (req, res) => {
    try {
        if (!reactionManager) {
            return res.status(503).json({ error: 'Sistema de reacciones no inicializado' });
        }

        const cleaned = reactionManager.cleanOldReactions();
        res.json({
            success: true,
            cleaned: cleaned,
            message: `${cleaned} reacciones antiguas eliminadas`
        });
    } catch (error) {
        console.error('Error limpiando reacciones:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Endpoint para obtener métricas de un usuario específico (para reacciones personalizadas)
app.get('/api/user/metrics/:phoneNumber', async (req, res) => {
    try {
        const { phoneNumber } = req.params;

        // Obtener pedidos del usuario desde Redis o n8n
        // Por ahora, retornamos datos simulados para la estructura
        const userMetrics = {
            phoneNumber: phoneNumber,
            orderCount: 0, // Se debería calcular desde los logs
            totalSpent: 0, // Se debería calcular desde los pedidos completados
            lastOrderDate: null,
            isVIP: false,
            isFrequent: false
        };

        res.json({
            success: true,
            metrics: userMetrics
        });
    } catch (error) {
        console.error('Error obteniendo métricas de usuario:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Endpoint: GET /api/redis-states - Obtener todos los estados de usuarios
app.get('/api/redis-states', async (req, res) => {
    try {
        const keys = await redisClient.keys('*');
        const states = [];

        for (const key of keys) {
            // Excluir claves del sistema (métricas, backups, cache, etc.)
            if (!key.startsWith('metrics:') &&
                !key.startsWith('backup:') &&
                !key.startsWith('gemini:') &&
                !key.startsWith('security:') &&
                key !== 'maintenance_mode_status') {

                const value = await redisClient.get(key);
                try {
                    const state = JSON.parse(value);
                    states.push({ key, state });
                } catch (e) {
                    // Si no es JSON válido, mostrar el valor raw
                    states.push({ key, state: value });
                }
            }
        }

        res.json(states);
    } catch (error) {
        console.error('Error obteniendo estados de Redis:', error);
        res.status(500).json({ error: 'Error al obtener estados' });
    }
});

// Endpoint: DELETE /api/redis-states/:key - Eliminar estado específico
app.delete('/api/redis-states/:key', async (req, res) => {
    try {
        const { key } = req.params;

        // Evitar eliminar claves críticas del sistema
        if (key.startsWith('metrics:') ||
            key.startsWith('backup:') ||
            key.startsWith('gemini:') ||
            key.startsWith('security:') ||
            key === 'maintenance_mode_status') {
            return res.status(403).json({
                success: false,
                message: 'No se puede eliminar una clave del sistema'
            });
        }

        const result = await redisClient.del(key);

        if (result === 1) {
            res.json({
                success: true,
                message: `Estado ${key} eliminado correctamente`
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Estado no encontrado'
            });
        }
    } catch (error) {
        console.error('Error eliminando estado de Redis:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar estado'
        });
    }
});

// --- LÓGICA DEL BOT ---

// --- GESTIÓN DE ESTADO CON REDIS ---
// Las siguientes funciones reemplazan el `Map` en memoria para guardar y recuperar el estado de la conversación de forma persistente.

/**
 * Obtiene el estado de la conversación de un usuario desde Redis.
 * @param {string} from El número de WhatsApp del usuario.
 * @returns {Promise<object|null>} El objeto de estado o null si no existe.
 */
async function getUserState(from) {
  const stateJSON = await redisClient.get(from);
  return stateJSON ? JSON.parse(stateJSON) : null;
}

/**
 * Guarda el estado de la conversación de un usuario en Redis.
 * El estado expira en 24 horas para limpiar conversaciones inactivas.
 * @param {string} from El número de WhatsApp del usuario.
 * @param {object} state El objeto de estado a guardar.
 */
async function setUserState(from, state) {
  // Guardamos el estado como un string JSON y le ponemos una expiración de 24 horas (86400 segundos).
  await redisClient.set(from, JSON.stringify(state), { EX: 86400 });
}

/**
 * Elimina el estado de la conversación de un usuario de Redis.
 * @param {string} from El número de WhatsApp del usuario.
 */
async function deleteUserState(from) {
  await redisClient.del(from);
}

/**
 * Verifica si un número de teléfono corresponde a un administrador.
 * @param {string} from El número de WhatsApp a verificar.
 * @returns {boolean} True si el número es de un administrador, false en caso contrario.
 */
function isAdmin(from) {
    if (!ADMIN_WHATSAPP_NUMBERS) {
        return false;
    }
    const adminNumbers = ADMIN_WHATSAPP_NUMBERS.split(',').map(num => num.trim());
    return adminNumbers.includes(from);
}
/**
 * Formatea un número de WhatsApp para mostrarlo de forma más legible.
 * Ej: Convierte "5217712416450" a "7712416450".
 * @param {string} fullNumber El número completo con código de país.
 * @returns {string} El número formateado.
 */
function formatDisplayNumber(fullNumber) {
  if (typeof fullNumber !== 'string') return fullNumber;

  if (fullNumber.startsWith('521')) {
    return fullNumber.substring(3);
  }
  // Para números que no tienen el '1' extra después del código de país.
  if (fullNumber.startsWith('52')) {
    return fullNumber.substring(2);
  }
  return fullNumber; // Devuelve el número original si no coincide con los patrones de México.
}

/**
 * Envía datos del mensaje recibido a un webhook de n8n.
 * @param {object} message El objeto de mensaje de la API de WhatsApp.
 * @param {object} [extraData={}] Datos adicionales para incluir en el payload.
 */
async function sendToN8n(message, extraData = {}) {
  // 1. Construcción del payload base y fusión con datos extra.
  const payload = {
    from: message.from,
    type: message.type,
    timestamp: message.timestamp, // El mensaje ya trae un timestamp UNIX
    rawMessage: message,
    ...extraData // Fusiona cualquier dato extra como 'address'.
  };

  // 2. Añadir detalles específicos del mensaje de forma segura.
  switch (message.type) {
    case 'text':
      payload.text = message.text?.body;
      break;
    case 'interactive':
      if (message.interactive?.type === 'button_reply') {
        payload.interactive = {
          type: 'button_reply',
          id: message.interactive.button_reply?.id,
          title: message.interactive.button_reply?.title
        };
      }
      // Se puede añadir 'list_reply' aquí en el futuro.
      break;
    case 'image':
      payload.interactive = {
        id: message.image?.id,
        mime_type: message.image?.mime_type
      };
      break;
    case 'audio':
      payload.audio = {
        id: message.audio?.id,
        mime_type: message.audio?.mime_type
      };
      break;
    case 'document':
      payload.document = {
        id: message.document?.id,
        mime_type: message.document?.mime_type,
        filename: message.document?.filename
      };
      break;
    case 'location':
      payload.location = {
        latitude: message.location?.latitude,
        longitude: message.location?.longitude
      };
      break;
    // Añadir más casos según sea necesario.
  }

  // 3. Envío asíncrono con manejo de errores mejorado.
  try {
    console.log('Enviando payload a n8n:', JSON.stringify(payload, null, 2));
    const response = await axios.post(N8N_WEBHOOK_URL, payload, { timeout: 5000 }); // Timeout de 5 segundos
    console.log('Respuesta de n8n recibida:', response.data);

    // Registrar llamada exitosa en métricas
    if (metricsCollector) {
      metricsCollector.recordWebhookCall();
    }
  } catch (error) {
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.error('Error enviando a n8n (el servidor respondió con un error):', { status: error.response.status, data: error.response.data });
    } else if (error.request) {
      // La petición se hizo pero no se recibió respuesta
      console.error('Error enviando a n8n (sin respuesta): Asegúrate de que n8n esté corriendo y el webhook esté activo y sea de tipo POST.');
    } else if (error.code === 'ECONNABORTED') {
      console.error('Error enviando a n8n: La petición tardó demasiado (timeout).');
    } else {
      // Algo pasó al configurar la petición que lanzó un Error
      console.error('Error enviando a n8n (error de configuración de Axios):', error.message);
    }
  }
}

// 1. FUNCIÓN MEJORADA PARA REGISTRAR RESPUESTAS DEL BOT
/**
 * Registra la respuesta del bot en el webhook de n8n con el formato esperado por el workflow.
 * @param {string} to El número de WhatsApp del destinatario.
 * @param {object} messagePayload El payload del mensaje que se envía.
 */
function registerBotResponseToN8n(to, messagePayload) {
    const payload = {
        source: 'bot',
        recipient: to,
        timestamp: Math.floor(Date.now() / 1000),
        messagePayload: messagePayload
    };

    console.log('Registrando respuesta del bot en n8n:', JSON.stringify(payload, null, 2));

    axios.post(N8N_WEBHOOK_URL, payload)
        .then(response => {
            console.log('Respuesta del bot registrada en n8n:', response.data);
            // Registrar llamada exitosa en métricas
            if (metricsCollector) {
                metricsCollector.recordWebhookCall();
            }
        })
        .catch(error => {
            console.error('Error registrando respuesta del bot en n8n:', error.message);
        });
}

// 2. FUNCIÓN MEJORADA PARA ENVÍO DE PEDIDOS COMPLETADOS
/**
 * Envía los detalles de un pedido completado a n8n con el formato exacto esperado.
 * @param {string} from El número del cliente.
 * @param {object} orderDetails Los detalles del pedido.
 */
function sendOrderCompletionToN8nEnhanced(from, orderDetails) {
    const payload = {
        from: from,
        type: 'order_completed',
        timestamp: Math.floor(Date.now() / 1000),
        order: {
            summary: orderDetails.summary || '',
            total: orderDetails.total || 0,
            fullText: orderDetails.fullText || ''
        },
        delivery: {
            address: orderDetails.address || '',
            accessCodeRequired: orderDetails.accessCodeRequired || false
        },
        payment: {
            method: orderDetails.paymentMethod || '',
            // Añade detalles específicos del pago según el método
            ...(orderDetails.paymentMethod === 'Efectivo' && { 
                cashDenomination: orderDetails.cashDenomination 
            }),
            ...(orderDetails.paymentMethod === 'Transferencia' && { 
                proofImageId: orderDetails.proofImageId 
            })
        }
    };

    console.log('Enviando pedido completo a n8n (enhanced):', JSON.stringify(payload, null, 2));

    // Registrar métrica de pedido
    if (metricsCollector) {
        metricsCollector.recordOrder(orderDetails.total || 0);
    }

    // Notificar al WebSocket sobre el nuevo pedido
    if (wsServer) {
        wsServer.notifyNewOrder({
            from: from,
            total: orderDetails.total || 0,
            summary: orderDetails.summary || '',
            timestamp: new Date().toISOString()
        });
    }

    axios.post(N8N_WEBHOOK_URL, payload)
        .then(response => {
            console.log('Respuesta de n8n (pedido completo enhanced):', response.data);
            // Registrar llamada exitosa en métricas
            if (metricsCollector) {
                metricsCollector.recordWebhookCall();
            }
        })
        .catch(error => {
            console.error('Error enviando pedido completo a n8n (enhanced):', error.message);
        });
}

// 3. FUNCIÓN PARA ENVÍO DE ACTUALIZACIONES DE DIRECCIÓN
/**
 * Envía una actualización de dirección al workflow de n8n.
 * @param {string} from El número del cliente.
 * @param {string} address La nueva dirección.
 */
function sendAddressUpdateToN8n(from, address) {
    const payload = {
        from: from,
        type: 'address_update',
        timestamp: Math.floor(Date.now() / 1000),
        address: address
    };

    console.log('Enviando actualización de dirección a n8n:', JSON.stringify(payload, null, 2));

    axios.post(N8N_WEBHOOK_URL, payload)
        .then(response => {
            console.log('Actualización de dirección enviada a n8n:', response.data);
            // Registrar llamada exitosa en métricas
            if (metricsCollector) {
                metricsCollector.recordWebhookCall();
            }
        })
        .catch(error => {
            console.error('Error enviando actualización de dirección a n8n:', error.message);
        });
}

// 4. FUNCIÓN AUXILIAR PARA VERIFICAR ADMINISTRADORES (debe coincidir con el workflow)
/**
 * Función auxiliar que debe coincidir con checkIfAdmin del workflow
 * @param {string} phoneNumber Número de teléfono a verificar
 * @returns {boolean} True si es admin
 */
function checkIfAdminForWorkflow(phoneNumber) {
    if (!phoneNumber || !ADMIN_WHATSAPP_NUMBERS) {
        return false;
    }
    const adminNumbers = ADMIN_WHATSAPP_NUMBERS.split(',').map(num => num.trim());
    return adminNumbers.includes(phoneNumber);
}


// 6. FUNCIÓN MODIFICADA PARA PROCESAR MENSAJES ENTRANTES
/**
 * Procesa mensajes entrantes con integración completa al workflow
 */
async function processIncomingMessage(message) {
    const from = message.from;
    const messageType = message.type;
    const messageId = message.id;

    console.log(`🔄 Procesando mensaje de ${from}, tipo: ${messageType}`);

    try {
        // Obtener estado del usuario desde Redis
        let userState = await getUserState(from);

        // Si no existe estado, crear uno por defecto
        if (!userState) {
            userState = {
                currentStep: 'initial',
                orderText: '',
                orderTimestamp: Math.floor(Date.now() / 1000)
            };
        }

        // Guardar el messageId en el estado para reacciones futuras
        if (messageId) {
            userState.lastMessageId = messageId;
            await setUserState(from, userState);
        }

        switch (messageType) {
            case 'text':
                const text = message.text.body;

                // Verificar si es un pedido completado (del menú web)
                if (text.includes('Total del pedido:') || text.includes('Total a pagar:')) {
                    console.log('🛒 Pedido completado detectado');
                    // Reacción inteligente al recibir un pedido
                    if (message.id && reactionManager) {
                        reactionManager.reactToOrderFlow(from, message.id, 'received').catch(() => {});
                    }
                    await handleOrderCompletion(from, text, userState);
                } else {
                    // Detectar intención y reaccionar antes de procesar
                    if (message.id && reactionManager) {
                        reactionManager.reactToIntention(from, message.id, text).catch(() => {});
                    }
                    // Procesar como mensaje de texto normal
                    await handleTextMessage(from, text, userState);
                }
                break;

            case 'interactive':
                await handleInteractiveMessage(from, message.interactive, userState);
                break;

            case 'image':
                // Reacción inteligente al recibir una imagen (probablemente comprobante)
                if (message.id && reactionManager) {
                    reactionManager.reactToOrderFlow(from, message.id, 'payment_proof').catch(() => {});
                }
                await handleImageMessage(from, message.image, userState);
                break;

            case 'location':
                // Reacción inteligente al recibir ubicación
                if (message.id && reactionManager) {
                    reactionManager.reactToOrderFlow(from, message.id, 'location_received').catch(() => {});
                }
                await handleLocationMessage(from, message.location, userState);
                break;

            default:
                console.log(`⚠️ Tipo de mensaje no manejado: ${messageType}`);
                break;
        }
    } catch (error) {
        console.error('❌ Error procesando mensaje:', error);
        await sendTextMessage(
            from,
            'Lo siento, hubo un error procesando tu mensaje. Por favor intenta de nuevo.'
        );
    }
}

// 7. FUNCIÓN PARA MANEJAR FINALIZACIÓN DE PEDIDOS
/**
 * Maneja la finalización de pedidos desde el menú web
 */
async function handleOrderCompletion(from, orderText, userState) {
    console.log('🍹 Procesando finalización de pedido para:', from);

    // Validar que userState existe
    if (!userState) {
        console.error('❌ Error: userState es null en handleOrderCompletion');
        userState = {
            currentStep: 'initial',
            orderText: '',
            orderTimestamp: Math.floor(Date.now() / 1000)
        };
    }

    // Actualizar estado del usuario
    userState.orderText = orderText;
    userState.step = 'awaiting_address';
    userState.orderTimestamp = Math.floor(Date.now() / 1000);
    
    await setUserState(from, userState);

    // Extraer información del pedido
    const orderInfo = extractOrderInfo(orderText);

    // Guardar información del pedido en el estado (se enviará a n8n al finalizar todo el flujo)
    userState.summary = orderInfo.summary;
    userState.total = orderInfo.total;
    userState.fullText = orderText;
    await setUserState(from, userState);

    // Enviar mensaje de confirmación del pedido
    const confirmationText = `¡Perfecto! Tu pedido ha sido recibido 🎉

${orderInfo.summary}

*Total: $${orderInfo.total}*`;

    await sendTextMessage(from, confirmationText);

    // Solicitar dirección de entrega
    const addressRequestText = `Para continuar, por favor, indícanos tu dirección completa (calle, número, colonia y alguna referencia). 🏠`;
    await sendTextMessage(from, addressRequestText);
    
    // Registrar respuesta del bot en n8n
    registerBotResponseToN8n(from, { type: 'text', text: confirmationText + '\n\n' + addressRequestText });
}

// 8. FUNCIÓN AUXILIAR PARA EXTRAER INFORMACIÓN DEL PEDIDO
/**
 * Maneja los mensajes de texto procesando comandos, estados del usuario y consultas libres.
 * @param {string} from El número del remitente.
 * @param {string} text El texto del mensaje.
 * @param {object} userState El estado actual del usuario.
 */
async function handleTextMessage(from, text, userState) {
    console.log(`💬 Procesando mensaje de texto de ${from}: "${text}"`);

    // 1. Verificar si es un administrador en modo chat
    if (isAdmin(from)) {
        await handleAdminMessage({ from, type: 'text', text: { body: text } });
        return;
    }

    // Verificar si es un admin en modo chat con cliente
    const adminState = await getUserState(from);
    if (adminState && adminState.mode === 'chatting') {
        const clientNumber = adminState.targetUser;
        await sendTextMessage(clientNumber, `🧑‍💼 Agente: ${text}`);
        return;
    }

    // 2. Manejar estados específicos del usuario
    if (userState && userState.step) {
        switch (userState.step) {
            case 'awaiting_address':
                await handleAddressResponse(from, text);
                return;

            case 'awaiting_access_code_info':
                await handleAccessCodeTextResponse(from, text);
                return;

            case 'awaiting_payment_method':
                await handlePaymentMethodTextResponse(from, text);
                return;

            case 'awaiting_cash_denomination':
                await handleCashDenominationResponse(from, text);
                return;

            case 'in_conversation_with_admin':
                // El usuario está en chat con un admin, reenviar el mensaje
                const adminNumber = userState.admin;
                await sendTextMessage(adminNumber, `👤 Cliente ${formatDisplayNumber(from)}: ${text}`);
                return;

            default:
                // Estado no reconocido, continuar con el procesamiento normal
                break;
        }
    }

    // 3. Verificar si es una posible respuesta de encuesta de satisfacción (0-5)
    const surveyResponse = await detectSurveyResponse(from, text);
    if (surveyResponse !== null) {
        await handleSurveyResponse(from, surveyResponse);
        return;
    }

    // 4. Normalizar el texto para búsqueda de comandos
    const normalizedText = text.toLowerCase().trim();

    // 5. Buscar manejador de comandos específicos
    console.log(`🔍 Buscando comando para texto normalizado: "${normalizedText}"`);
    const commandHandler = findCommandHandler(normalizedText);
    if (commandHandler) {
        console.log(`✅ Comando encontrado, ejecutando handler`);
        await commandHandler(from, normalizedText);
        return;
    }

    // ✅ CORRECCIÓN PRINCIPAL: En lugar de ir directo a defaultHandler,
    // siempre usar handleFreeformQuery para consultas no reconocidas
    console.log(`⚠️ No se encontró comando específico, usando Gemini para: "${text}"`);
    await handleFreeformQuery(from, text);
}

/**
 * Maneja los mensajes interactivos (botones, listas).
 * @param {string} from El número del remitente.
 * @param {object} interactive El objeto interactive del mensaje.
 * @param {object} userState El estado actual del usuario.
 */
async function handleInteractiveMessage(from, interactive, userState) {
    console.log(`🎯 Procesando mensaje interactivo de ${from}:`, interactive);
    
    if (interactive.type === 'button_reply') {
        const buttonId = interactive.button_reply?.id;
        const buttonTitle = interactive.button_reply?.title;
        
        console.log(`Botón presionado: ${buttonId} - ${buttonTitle}`);
        
        // Verificar si hay un manejador específico para este botón
        if (buttonCommandHandlers[buttonId]) {
            await buttonCommandHandlers[buttonId](from);
            return;
        }
        
        // Manejar botones específicos del flujo de pedidos
        if (userState && userState.step) {
            switch (userState.step) {
                case 'awaiting_location_confirmation':
                    if (buttonId === 'send_location_now') {
                        await sendTextMessage(from, '📍 Perfecto! Por favor, usa el botón de clip 📎 de WhatsApp y selecciona "Ubicación" para compartir tu ubicación en tiempo real.');
                        return;
                    } else if (buttonId === 'skip_location') {
                        // Continuar al siguiente paso sin ubicación
                        await proceedToAccessCodeQuestion(from, userState);
                        return;
                    }
                    break;

                case 'awaiting_access_code_info':
                    if (buttonId === 'access_code_yes' || buttonId === 'access_code_no') {
                        await handleAccessCodeResponse(from, buttonId);
                        return;
                    }
                    break;

                case 'awaiting_payment_method':
                    if (buttonId === 'payment_cash' || buttonId === 'payment_transfer') {
                        await handlePaymentMethodResponse(from, buttonId);
                        return;
                    }
                    break;

                case 'awaiting_address':
                    if (buttonId === 'send_location') {
                        await sendTextMessage(from, '📍 Por favor, envía tu ubicación usando el botón de WhatsApp para compartir ubicación.');
                        return;
                    } else if (buttonId === 'type_address') {
                        await sendTextMessage(from, '✏️ Por favor, escribe tu dirección completa (calle, número, colonia, referencias).');
                        return;
                    }
                    break;
            }
        }
        
        // Si no se maneja específicamente, responder de forma general
        await sendTextMessage(from, 'He recibido tu selección. ¿En qué más puedo ayudarte?');
    }
}

/**
 * Maneja los mensajes de imagen.
 * @param {string} from El número del remitente.
 * @param {object} image El objeto image del mensaje.
 * @param {object} userState El estado actual del usuario.
 */
async function handleImageMessage(from, image, userState) {
    console.log(`📷 Procesando imagen de ${from}:`, image);
    
    // Verificar si el usuario está esperando un comprobante de pago
    if (userState && userState.step === 'awaiting_payment_proof') {
        await handlePaymentProofImage(from, image);
        return;
    }
    
    // Para otras imágenes, responder de forma general
    await sendTextMessage(from, 'He recibido tu imagen. Si es un comprobante de pago, por favor asegúrate de que esté en el proceso de pedido correcto.');
}

/**
 * Maneja los mensajes de ubicación.
 * @param {string} from El número del remitente.
 * @param {object} location El objeto location del mensaje.
 * @param {object} userState El estado actual del usuario.
 */
async function handleLocationMessage(from, location, userState) {
    console.log(`📍 Procesando ubicación de ${from}:`, location);

    // Verificar si el usuario está en el proceso de confirmar ubicación después de dirección
    if (userState && userState.step === 'awaiting_location_confirmation') {
        const locationData = {
            latitude: location.latitude,
            longitude: location.longitude,
            url: `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
        };

        console.log(`Ubicación confirmada para usuario ${from}:`, locationData);

        // Guardar ubicación en el estado del usuario
        const currentState = await getUserState(from) || {};
        await setUserState(from, { ...currentState, location: locationData });

        // Enviar ubicación a n8n
        sendToN8n({ from: from, type: 'location_update', timestamp: Math.floor(Date.now() / 1000) }, { location: locationData });
        console.log(`Ubicación enviada a n8n:`, locationData);

        await sendTextMessage(from, '✅ ¡Perfecto! Ubicación recibida. Ahora continuamos con tu pedido...');

        // Continuar al siguiente paso
        await proceedToAccessCodeQuestion(from, currentState);
        return;
    }

    // Verificar si el usuario está en el proceso de proporcionar su dirección
    if (userState && userState.step === 'awaiting_address') {
        const address = `Ubicación: Lat ${location.latitude}, Lng ${location.longitude}`;
        console.log(`Procesando ubicación como dirección para usuario ${from}`);
        await handleAddressResponse(from, address);
        return;
    }

    // Para ubicaciones fuera del flujo de pedidos
    await sendTextMessage(from, 'He recibido tu ubicación. Si necesitas hacer un pedido, por favor usa el menú principal.');
}

/**
 * Extrae información relevante del texto del pedido
 */
function extractOrderInfo(orderText) {
    // Buscar el total
    const totalMatch = orderText.match(/Total (?:del pedido|a pagar):\s*\$?(\d+(?:\.\d{2})?)/i);
    const total = totalMatch ? parseFloat(totalMatch[1]) : 0;

    // Extraer resumen de items (líneas entre el inicio y el total)
    const lines = orderText.split('\n').map(line => line.trim()).filter(Boolean);
    const totalLineIndex = lines.findIndex(line => 
        line.toLowerCase().includes('total del pedido:') || 
        line.toLowerCase().includes('total a pagar:')
    );

    let summary = '';
    if (totalLineIndex > 0) {
        // Buscar líneas que parecen items
        const itemLines = lines.slice(1, totalLineIndex).filter(line => 
            line.includes('x ') || line.includes('$') || /\d+. *\w+/ .test(line)
        );
        summary = itemLines.join('\n');
    }

    return {
        total: total,
        summary: summary || 'Pedido personalizado',
        fullText: orderText
    };
}

/**
 * Maneja los mensajes provenientes de un número de administrador.
 * @param {object} message El objeto de mensaje de la API de WhatsApp.
 */
async function handleAdminMessage(message) {
    const from = message.from;
    const messageBody = message.type === 'text' ? message.text.body.trim() : '';
    const lowerCaseMessage = messageBody.toLowerCase();

    // --- Comandos de Modo Fuera de Servicio ---
    if (lowerCaseMessage === 'activar fuera de servicio') {
        await redisClient.set(MAINTENANCE_MODE_KEY, 'true');
        await sendTextMessage(from, '✅ Modo "Fuera de Servicio" ACTIVADO. El bot informará a los clientes que no hay servicio.');
        await notifyAdmin(`⚠️ El administrador ${formatDisplayNumber(from)} ha ACTIVADO el modo "Fuera de Servicio".`);
        return;
    }

    if (lowerCaseMessage === 'desactivar fuera de servicio') {
        await redisClient.del(MAINTENANCE_MODE_KEY);
        await sendTextMessage(from, '✅ Modo "Fuera de Servicio" DESACTIVADO. El bot vuelve a operar normalmente.');
        await notifyAdmin(`🟢 El administrador ${formatDisplayNumber(from)} ha DESACTIVADO el modo "Fuera de Servicio".`);
        return;
    }

    const adminState = await getUserState(from);

    // --- Comandos de Chat Directo ---

    // Comando para terminar una conversación
    if (lowerCaseMessage === 'terminar chat' || lowerCaseMessage === 'salir') {
        if (adminState && adminState.mode === 'chatting') {
            const clientNumber = adminState.targetUser;
            // Limpiamos los estados de ambos
            await deleteUserState(from);
            await deleteUserState(clientNumber);

            await sendTextMessage(from, `✅ Chat con ${formatDisplayNumber(clientNumber)} finalizado. Has vuelto al modo normal.`);
            await sendTextMessage(clientNumber, `La conversación con nuestro agente ha terminado. Si necesitas algo más, escribe "hola" para ver el menú. 👋`);
        } else {
            await sendTextMessage(from, `No estás en un chat activo. Para iniciar uno, usa el comando: "hablar con <numero>"`);
        }
        return;
    }

    // Comando para iniciar una conversación
    if (lowerCaseMessage.startsWith('hablar con ')) {
        const targetUser = lowerCaseMessage.replace('hablar con ', '').trim();
        // Validación simple para asegurar que es un número
        if (/^\d+$/.test(targetUser)) {
            // Establecemos el estado para el admin y para el cliente
            await setUserState(from, { mode: 'chatting', targetUser: targetUser });
            await setUserState(targetUser, { mode: 'in_conversation_with_admin', admin: from });

            await sendTextMessage(from, `📞 Has iniciado un chat directo con ${formatDisplayNumber(targetUser)}. Todo lo que escribas ahora se le enviará directamente.

Para terminar, escribe "terminar chat".`);
            await sendTextMessage(targetUser, `🧑‍ Un agente se ha unido a la conversación para ayudarte personalmente.`);
        } else {
            await sendTextMessage(from, `El número proporcionado no es válido. Asegúrate de que sea solo el número de WhatsApp (ej. 521771...).`);
        }
        return;
    }

    // Si el admin ya está en modo chat, reenviamos su mensaje al cliente
    if (adminState && adminState.mode === 'chatting') {
        const clientNumber = adminState.targetUser;
        if (message.type === 'text') {
            await sendTextMessage(clientNumber, `🧑‍ Agente: ${message.text.body}`);
        } else {
            // En el futuro se podría implementar el reenvío de imágenes, audios, etc.
            await sendTextMessage(from, "Por ahora, solo puedo reenviar mensajes de texto en el chat directo.");
        }
        return;
    }

    // --- Otros Comandos de Admin ---

    console.log(`Mensaje recibido del administrador ${from}: "${messageBody}"`);

    switch (lowerCaseMessage) {
        case '/test_webhook':
            const testPayload = {
                from: from,
                type: 'test_message',
                timestamp: Math.floor(Date.now() / 1000),
                test: true,
                message: 'Mensaje de prueba del webhook'
            };
            
            await axios.post(N8N_WEBHOOK_URL, testPayload);
            await sendTextMessage(from, '✅ Mensaje de prueba enviado al webhook de n8n');
            break;

        case '/test_order':
            // Crear el pedido de prueba
            const testOrderText = `🍹 Tu pedido de CapiBobba

1x Frappé de Chocolate - $45.00
2x Bubble Tea de Taro - $90.00
1x Smoothie de Mango - $38.00

Total del pedido: $173.00

¡Gracias por tu preferencia!`;

            // ENVIAR EL PEDIDO COMO order_completed a n8n
            const orderCompletedPayload = {
                from: from,
                type: 'order_completed',
                timestamp: Math.floor(Date.now() / 1000),
                order: {
                    summary: "1x Frappé de Chocolate - $45.00\n2x Bubble Tea de Taro - $90.00\n1x Smoothie de Mango - $38.00",
                    total: 173.00,
                    fullText: testOrderText
                },
                delivery: {
                    address: "Calle de Prueba #123, Colonia Test, Pachuca",
                    accessCodeRequired: false
                },
                payment: {
                    method: "Efectivo",
                    cashDenomination: "200"
                }
            };

            try {
                // Registrar métrica de pedido de prueba
                if (metricsCollector) {
                    metricsCollector.recordOrder(173.00);
                }

                // Notificar al WebSocket sobre el pedido de prueba
                if (wsServer) {
                    wsServer.notifyNewOrder({
                        from: from,
                        total: 173.00,
                        summary: "1x Frappé de Chocolate - $45.00\n2x Bubble Tea de Taro - $90.00\n1x Smoothie de Mango - $38.00",
                        timestamp: new Date().toISOString()
                    });
                }

                // Enviar a n8n como pedido completado
                await axios.post(N8N_WEBHOOK_URL, orderCompletedPayload);
                console.log('✅ Pedido de prueba enviado a n8n:', orderCompletedPayload);
                
                await sendTextMessage(from, '✅ Pedido de prueba enviado al workflow de n8n. Deberías recibir notificaciones en Telegram.');
            } catch (error) {
                console.error('❌ Error enviando pedido de prueba:', error.message);
                await sendTextMessage(from, `❌ Error enviando pedido de prueba: ${error.message}`);
            }
            break;

        case '/test_order_user':
            // Simular mensaje de usuario con pedido
            const userOrderPayload = {
                from: from,
                type: 'text',
                timestamp: Math.floor(Date.now() / 1000).toString(),
                rawMessage: {
                    from: from,
                    id: `test_msg_${Date.now()}`,
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    text: {
                        body: `¡Hola! Me gustaría hacer un pedido con los siguientes productos:

1. Blueberry x 1 ($75.00 c/u) - Subtotal: $75.00

Total del pedido: $75.00

¡Espero su confirmación! Gracias. 😊`
                    },
                    type: 'text'
                },
                text: `¡Hola! Me gustaría hacer un pedido con los siguientes productos:

1. Blueberry x 1 ($75.00 c/u) - Subtotal: $75.00

Total del pedido: $75.00

¡Espero su confirmación! Gracias. 😊`
            };

            try {
                await axios.post(N8N_WEBHOOK_URL, userOrderPayload);
                console.log('✅ Mensaje de pedido de usuario simulado enviado a n8n');
                
                await sendTextMessage(from, '✅ Mensaje de pedido de usuario simulado enviado. Deberías ver el flujo completo en Telegram.');
            } catch (error) {
                console.error('❌ Error enviando mensaje simulado:', error.message);
                await sendTextMessage(from, `❌ Error: ${error.message}`);
            }
            break;

        case '/debug_payload':
            // Mostrar cómo se está enviando actualmente
            const debugPayload = {
                from: from,
                type: 'text',
                timestamp: Math.floor(Date.now() / 1000).toString(),
                rawMessage: {
                    from: from,
                    text: { body: '/test_order' },
                    type: 'text'
                },
                text: '/test_order'
            };
            
            await sendTextMessage(from, `🔍 Payload actual que se envía:\n\`\`\`json\n${JSON.stringify(debugPayload, null, 2)}\n\`\`\``);
            break;

        case '/webhook_status':
            try {
                const response = await axios.get(N8N_WEBHOOK_URL.replace('/webhook/', '/health'), { timeout: 5000 });
                await sendTextMessage(from, '✅ Webhook de n8n está funcionando correctamente');
            } catch (error) {
                await sendTextMessage(from, `❌ Error conectando con webhook: ${error.message}`);
            }
            break;

        case 'hola admin':
            await sendTextMessage(from, `🤖 Saludos, administrador. Estoy a tu disposición. Puedes usar "hablar con <numero>" para chatear con un cliente.`);
            break;
    }
}

/**
 * Detecta si un mensaje de texto contiene una respuesta de encuesta de satisfacción.
 * Esta función es universal y funciona para pedidos de cualquier canal.
 * @param {string} from El número del remitente.
 * @param {string} text El texto del mensaje.
 * @returns {number|null} El rating numérico (0-5) si es una respuesta válida, null en caso contrario.
 */
async function detectSurveyResponse(from, text) {
    // Limpiar el texto y extraer solo números
    const cleanText = text.trim();

    // Buscar un número entre 0 y 5 en el mensaje
    const ratingMatch = cleanText.match(/^[0-5]$/);

    if (!ratingMatch) {
        // Si no es un número simple 0-5, buscar patrones más complejos
        const complexMatch = cleanText.match(/(?:calific|punt|rate|star|estrell)[^\d]*([0-5])/i) ||
                            cleanText.match(/([0-5])\s*(?:de\s*5|\/5|\*|star|estrell)/i) ||
                            cleanText.match(/^.*?([0-5]).*$/);

        if (!complexMatch) {
            return null;
        }

        const potentialRating = parseInt(complexMatch[1]);
        if (potentialRating < 0 || potentialRating > 5) {
            return null;
        }

        // Para patrones complejos, verificar que el mensaje tenga contexto de calificación
        const hasRatingContext = /calific|punt|rate|star|estrell|satisf|servicio|experiencia|opinion/i.test(cleanText);
        if (!hasRatingContext && cleanText.length > 3) {
            return null; // Probable que no sea una calificación
        }

        return potentialRating;
    }

    const rating = parseInt(ratingMatch[0]);

    // Verificar si el usuario tiene actividad reciente o es conocido
    try {
        const userState = await getUserState(from);

        // Si el usuario tiene un estado activo, es más probable que sea una respuesta de encuesta
        if (userState && userState.state) {
            console.log(`🎯 Usuario ${from} tiene estado activo: ${userState.state}, interpretando ${rating} como encuesta`);
            return rating;
        }

        // Verificar si hay registros recientes de este usuario (últimas 24 horas)
        const recentActivity = await checkRecentUserActivity(from);
        if (recentActivity) {
            console.log(`🎯 Usuario ${from} tiene actividad reciente, interpretando ${rating} como encuesta`);
            return rating;
        }

        // Si no hay contexto pero es un número válido y el mensaje es muy corto, asumir que es encuesta
        if (cleanText.length <= 2) {
            console.log(`🎯 Mensaje muy corto (${cleanText}) de ${from}, interpretando como posible encuesta`);
            return rating;
        }

    } catch (error) {
        console.error('Error verificando contexto de usuario para encuesta:', error);
        // En caso de error, si es un número simple, asumir que es encuesta
        if (cleanText.length <= 2) {
            return rating;
        }
    }

    return null;
}

// Nota: Las encuestas son enviadas por n8n cuando se registra la entrega en Google Sheets
// Este sistema solo detecta y procesa las respuestas de encuesta

/**
 * Verifica si un usuario ha tenido actividad reciente (últimas 24 horas).
 * @param {string} from El número del usuario.
 * @returns {boolean} True si hay actividad reciente, false en caso contrario.
 */
async function checkRecentUserActivity(from) {
    try {
        // Buscar en logs de mensajes recientes
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);

        // Verificar si hay logs de este usuario en las últimas 24 horas
        // Esto es una implementación simple - en un sistema más robusto usarías una base de datos
        const fs = require('fs').promises;

        try {
            const logsPath = './logs/orders.log';
            const logsContent = await fs.readFile(logsPath, 'utf8');
            const recentLogs = logsContent.split('\n')
                .filter(line => line.includes(from))
                .filter(line => {
                    const match = line.match(/^\[([\d\-T:\.Z]+)\]/);
                    if (match) {
                        const logTime = new Date(match[1]).getTime();
                        return logTime > twentyFourHoursAgo;
                    }
                    return false;
                });

            return recentLogs.length > 0;
        } catch (fileError) {
            // Si no se puede leer el archivo de logs, asumir que no hay actividad reciente
            return false;
        }
    } catch (error) {
        console.error('Error verificando actividad reciente:', error);
        return false;
    }
}

/**
 * Maneja la respuesta numérica de una encuesta de satisfacción.
 * @param {string} from El número del remitente.
 * @param {number} rating La calificación dada por el usuario (0-5).
 */
async function handleSurveyResponse(from, rating) {
  console.log(`Respuesta de encuesta recibida de ${from}: Calificación ${rating}`);
  logSurveyResponseToFile({ from: from, rating: rating }); // Log the survey response

  let responseText;

  // Personalizamos el mensaje de agradecimiento según la calificación.
  if (rating <= 2) {
    responseText = `Lamentamos mucho que tu experiencia no haya sido la mejor. Agradecemos tus comentarios y los tomaremos en cuenta para mejorar. Un agente podría contactarte para entender mejor qué pasó.`;
    // Notificamos a un admin sobre la mala calificación para un seguimiento.
    notifyAdmin(`⚠️ ¡Alerta de Calificación Baja! ⚠️\n\nEl cliente ${formatDisplayNumber(from)} ha calificado el servicio con un: *${rating}*.\n\nSería bueno contactarlo para entender qué podemos mejorar.`);
  } else if (rating >= 4) {
    responseText = `¡Nos alegra mucho que hayas tenido una buena experiencia! Gracias por tu calificación. ¡Esperamos verte pronto! 🎉`;
  } else { // Para calificaciones de 3
    responseText = `¡Muchas gracias por tus comentarios! Tu opinión es muy importante para nosotros y nos ayuda a mejorar. 😊`;
  }

  await sendTextMessage(from, responseText);

  // Opcional: Si usaras un estado como 'awaiting_survey', aquí lo limpiarías.
  // await deleteUserState(from);
}
// --- MANEJADORES DE COMANDOS ---

/**
 * Comprueba si un texto es un saludo común.
 * @param {string} text El texto a comprobar en minúsculas.
 * @returns {boolean}
 */
function isGreeting(text) {
  const greetings = ['hola', 'buenas', 'buenos dias', 'buen dia', 'hey', 'que tal', 'buenas tardes','buenas noches'];
  return greetings.some(greeting => text.startsWith(greeting));
}

/**
 * Define los manejadores para los botones interactivos.
 * La clave es el ID del botón y el valor es la función manejadora.
 */
const buttonCommandHandlers = {
  'ver_menu': handleShowMenu,
  'ver_promociones': handleShowPromotions,
  'contactar_agente': handleContactAgent
};

/**
 * Define la lista de comandos de texto, su prioridad y cómo detectarlos.
 * El array se procesa en orden, por lo que los comandos más específicos deben ir primero.
 */
const commandHandlers = [
  // Prioridad 1: Pedido completo desde el menú web. Es el más específico.
  {
    name: 'Handle Web Menu Order',
    match: (text) => text.includes('total del pedido:') || text.includes('total a pagar:'),
    handler: handleNewOrderFromMenu
  },
  // Prioridad 2: Intención de hacer un pedido.
  {
    name: 'Initiate Order',
    keywords: ['pedido', 'ordenar', 'quisiera pedir', 'me gustaría pedir', 'me gustaría hacer el siguiente pedido', 'quiero pedir', 'me gustaría ordenar'],
    handler: handleInitiateOrder
  },
  // Prioridad 3: Saludos comunes.
  {
    name: 'Greeting',
    match: isGreeting,
    handler: sendMainMenu
  },
  // NUEVO: Prioridad 3.5: Preguntas sobre el estado del servicio.
  {
    name: 'Check Service Status',
    keywords: ['servicio', 'abierto', 'trabajando', 'atienden', 'atendiendo', 'laborando'],
    handler: handleServiceStatusCheck
  },
  // Prioridad 4: Comandos generales por palabra clave.
  { name: 'Show Menu', keywords: ['menu'], handler: handleShowMenu },
  { name: 'Show Promotions', keywords: ['promo'], handler: handleShowPromotions },
  { name: 'Show Hours', keywords: ['hora', 'horario'], handler: handleShowHours },
  { name: 'Show Location', keywords: ['ubicacion', 'donde estan', 'domicilio'], handler: handleShowLocation },
  { name: 'Help', keywords: ['ayuda'], handler: sendMainMenu } // 'ayuda' ahora usa el mismo sistema
];

/**
 * Busca y devuelve el manejador de comandos apropiado para un mensaje de texto.
 * Itera a través de la lista `commandHandlers` y devuelve el primer manejador que coincida.
 * @param {string} text El mensaje del usuario en minúsculas y sin espacios extra.
 * @returns {Function|null} La función manejadora o null si no se encuentra.
 */
function findCommandHandler(text) {
    const lowerText = text.toLowerCase().trim();
    console.log(`🔎 Verificando comandos para: "${lowerText}"`);

    // Comandos exactos
    const exactCommands = {
        'hola': sendMainMenu,
        'ayuda': sendMainMenu,
        'menú': handleShowMenu,
        'menu': handleShowMenu,
        'promociones': handleShowPromotions,
        'promos': handleShowPromotions,
        'horario': handleShowHours,
        'horarios': handleShowHours,
        'ubicación': handleShowLocation,
        'ubicacion': handleShowLocation,
        'agente': handleContactAgent,
        'contacto': handleContactAgent,
        'hablar': handleContactAgent
    };

    if (exactCommands[lowerText]) {
        console.log(`✅ Comando exacto encontrado: ${lowerText}`);
        return exactCommands[lowerText];
    }

    // ✅ NUEVO: Patrones de texto para consultas comunes
    const patterns = [
        {
            keywords: ['envío', 'envio', 'delivery', 'domicilio', 'entrega'],
            handler: handleDeliveryInquiry
        },
        {
            keywords: ['precio', 'costo', 'cuanto', 'vale'],
            handler: handlePriceInquiry
        },
        {
            keywords: ['abierto', 'cerrado', 'horario', 'abren', 'cierran'],
            handler: handleServiceStatusCheck
        },
        {
            keywords: ['pedido', 'ordenar', 'comprar', 'quiero'],
            handler: handleInitiateOrder
        }
    ];

    // Buscar patrones que coincidan
    for (const pattern of patterns) {
        if (pattern.keywords.some(keyword => lowerText.includes(keyword))) {
            console.log(`✅ Patrón encontrado: ${pattern.keywords.join(', ')}`);
            return pattern.handler;
        }
    }

    // Compatibilidad con el sistema anterior de commandHandlers
    for (const command of commandHandlers) {
        console.log(`📋 Verificando comando legacy: ${command.name}`);

        // Estrategia 1: Función de match personalizada (la más flexible)
        if (command.match && command.match(lowerText)) {
            console.log(`✅ Match encontrado con función personalizada: ${command.name}`);
            return command.handler;
        }

        // Estrategia 2: Coincidencia por palabras clave
        if (command.keywords && command.keywords.some(keyword => lowerText.includes(keyword))) {
            console.log(`✅ Match encontrado con palabra clave legacy: ${command.name}`);
            return command.handler;
        }
    }

    console.log(`❌ No se encontró ningún comando para: "${lowerText}"`);
    return null; // No se encontró comando
}

// --- ACCIONES DEL BOT (Las respuestas de tu negocio) ---

/**
 * Envía el menú principal con botones.
 * @param {string} to Número del destinatario.
 */
async function sendMainMenu(to, text) {
  // Verificamos el modo "fuera de servicio"
  const isMaintenanceMode = await redisClient.get(MAINTENANCE_MODE_KEY) === 'true';
  let bodyText = '¡Hola! Soy CapiBot, el asistente virtual de CapiBobba. ¿Cómo puedo ayudarte hoy?';
  let adminNotification = `🔔 ¡Atención! El cliente ${formatDisplayNumber(to)} ha iniciado una conversación y está viendo el menú principal.`;

  if (isMaintenanceMode) {
    bodyText = `⚠️ *AVISO: En este momento no estamos tomando pedidos.*

¡Hola! Soy CapiBot. Aunque no hay servicio de pedidos, puedo darte información sobre nuestro menú o promociones. ¿En qué te ayudo?`;
    adminNotification += '\n(Modo "Fuera de Servicio" está ACTIVO)';
  }

  // Notificamos al administrador
  notifyAdmin(adminNotification);

  const payload = {
    type: 'interactive',
    interactive: {
      type: 'button',
      header: { type: 'text', text: '🧋CapiBobba🧋' },
      body: { text: bodyText },
      footer: { text: 'Selecciona una opción' },
      action: {
        buttons: [
          { type: 'reply', reply: { id: 'ver_menu', title: 'Ver Menú 📜' } },
          { type: 'reply', reply: { id: 'ver_promociones', title: 'Promociones ✨' } },
          { type: 'reply', reply: { id: 'contactar_agente', title: 'Hablar con alguien 🧑‍' } }
        ]
      }
    }
  };
  await sendMessage(to, payload);
}

/**
 * Maneja la solicitud para ver el menú.
 * @param {string} to Número del destinatario.
 */
async function handleShowMenu(to, text) {
  await sendTextMessage(to, `¡Claro! Aquí está nuestro delicioso menú: https://feyomx.github.io/menucapibobba/`);
}

/**
 * Maneja la solicitud para ver las promociones.
 * @param {string} to Número del destinatario.
 */
async function handleShowPromotions(to, text) {
  const promoText = `¡Nuestras promos de hoy! ✨\n\n- *Combo dia Lluvioso:* 2 bebidas calientes del mismo sabor x $110.\n- *Combo Amigos:* 2 Frappe base agua del mismo sabor por $130.`;
  await sendTextMessage(to, promoText);
}

/**
 * Maneja la solicitud de horario.
 * @param {string} to Número del destinatario.
 */
async function handleShowHours(to, text) {
  const hoursText = `Nuestro horario de atención es:\nLunes a Viernes: 6:00 PM - 10:00 PM\nSábados y Domingos: 12:00 PM - 10:00 PM`;
  await sendTextMessage(to, hoursText);
}

/**
 * Maneja la solicitud de ubicación.
 * @param {string} to Número del destinatario.
 */
async function handleShowLocation(to, text) {
  const locationText = `Tenemos servicio a domicilio GRATIS en los fraccionamientos aledaños a Viñedos!`;
  await sendTextMessage(to, locationText);
}

/**
 * Maneja la solicitud para contactar a un agente.
 * @param {string} to Número del destinatario.
 */
async function handleContactAgent(to, text) {
  await sendTextMessage(to, 'Entendido. Un agente se pondrá en contacto contigo en breve.');
  await notifyAdmin(`🔔 ¡Atención! El cliente ${formatDisplayNumber(to)} solicita hablar con un agente.`);
}

/**
 * NUEVO: Verifica si hay servicio y responde adecuadamente.
 * Si el modo "fuera de servicio" está activo, lo informa.
 * Si no, delega la pregunta a Gemini para una respuesta más natural.
 * @param {string} to Número del destinatario.
 * @param {string} text El texto de la pregunta del usuario.
 */
async function handleServiceStatusCheck(to, text) {
  const isMaintenanceMode = await redisClient.get(MAINTENANCE_MODE_KEY) === 'true';

  if (isMaintenanceMode) {
    // Si el modo está activo, siempre informa que no hay servicio.
    await sendTextMessage(to, 'Hola. En este momento no estamos tomando pedidos. ¡Agradecemos tu comprensión y esperamos verte pronto! 👋');
  } else {
    // Si el servicio está activo, la pregunta es general ("¿están abiertos?").
    // Dejamos que Gemini la responda usando el contexto del negocio (horarios).
    await handleFreeformQuery(to, text);
  }
}
/**
 * Maneja la intención de iniciar un pedido.
 * Si el pedido ya está en el mensaje, lo procesa.
 * Si no, guía al usuario para que lo genere.
 * @param {string} to Número del destinatario.
 * @param {string} text El texto completo del mensaje del usuario.
 */
async function handleInitiateOrder(to, text) {
  console.log(`🚀 INICIANDO INTENCIÓN DE PEDIDO para ${to}`);
  console.log(`📝 Texto recibido: "${text}"`);

  // NUEVO: Verificación del modo "fuera de servicio"
  const isMaintenanceMode = await redisClient.get(MAINTENANCE_MODE_KEY) === 'true';
  if (isMaintenanceMode) {
    console.log(`⚠️ Intención de pedido rechazada por modo mantenimiento`);
    await sendTextMessage(to, '¡Hola! En este momento no estamos tomando pedidos, pero con gusto puedo darte información sobre nuestro menú o promociones. ¿En qué te puedo ayudar? 😊');
    return;
  }

  // Comprueba si el texto del mensaje ya contiene un pedido formateado con el texto correcto.
  if (text.toLowerCase().includes('total del pedido:')) {
    console.log(`✅ Pedido completo detectado, procesando directamente`);
    await handleNewOrderFromMenu(to, text);
  } else {
    console.log(`📋 Solo intención de pedido, enviando guía del menú`);
    // Si solo es la intención, guía al usuario.
    const guideText = `¡Genial! Para tomar tu pedido de la forma más rápida y sin errores, por favor, créalo en nuestro menú interactivo y cuando termines, copia y pega el resumen de tu orden aquí.

Aquí tienes el enlace: https://feyomx.github.io/menucapibobba/`;
    await sendTextMessage(to, guideText);
  }
}

/**
 * Extrae solo los artículos de un texto de pedido completo.
 * @param {string} orderText El texto completo del pedido.
 * @returns {string} Una cadena con solo los artículos del pedido, uno por línea.
 */
function extractOrderItems(orderText) {
  const lines = orderText.split('\n');
  const totalLineIndex = lines.findIndex(line => line.toLowerCase().startsWith('total del pedido:'));

  // Si no se encuentra la línea de total, es probable que el formato no sea el esperado.
  // Usamos un fallback, pero lo ideal es que el formato siempre sea consistente.
  if (totalLineIndex === -1) {
    return orderText.split('\n').slice(1, -2).join('\n');
  }

  // Buscamos el inicio de los artículos. Asumimos que es después de la primera línea vacía.
  const firstEmptyLineIndex = lines.findIndex(line => line.trim() === '');
  const startIndex = firstEmptyLineIndex > -1 ? firstEmptyLineIndex + 1 : 1;

  // Filtramos las líneas entre el inicio y la línea de total para quedarnos solo con los artículos.
  const items = lines.slice(startIndex, totalLineIndex).filter(line => line.trim() !== '');
  
  return items.join('\n');
}

/**
 * Construye un mensaje de notificación estandarizado para los administradores.
 * @param {string} title El título de la notificación (ej. "🎉 ¡Nuevo pedido en Efectivo!").
 * @param {object} userState El estado completo del usuario.
 * @param {string} from El número de WhatsApp del cliente.
 * @param {object} [extraDetails={}] Un objeto con detalles adicionales a incluir (ej. { 'Paga con': '$500' }).
 * @returns {string} El mensaje de notificación formateado.
 */
function buildAdminNotification(title, userState, from, extraDetails = {}) {
  // 1. Desestructuración segura con valores por defecto para evitar errores.
  const { address = 'No especificada', orderText = '', accessCodeInfo } = userState || {};

  // 2. Extracción de datos.
  const orderSummary = extractOrderItems(orderText);
  // Regex mejorada: busca el total, permitiendo opcionalmente un espacio y decimales.
  const totalMatch = orderText.match(/Total del pedido:\s*(\$?\d+(\.\d{1,2})?)/i);
  const total = totalMatch ? totalMatch[1] : 'N/A';
  
  // 3. Mensajes claros con emojis consistentes.
  const accessCodeMessage = accessCodeInfo === 'access_code_yes'
    ? '🔐 Sí, se necesita código'
    : '🔓 No, acceso libre';

  // 4. Construcción del mensaje usando un array para mayor legibilidad y mantenimiento.
  const notificationParts = [
    title,
    '──────────────────',
    `🧍 *Cliente:* ${formatDisplayNumber(from)}`,
    `🏠 *Dirección:* ${address}`,
    `🔑 *Acceso:* ${accessCodeMessage}`,
    '', // Espacio antes del pedido
    '🧾 *Pedido:*',
    orderSummary,
    '', // Espacio después del pedido
    `💰 *Total:* ${total}`
  ];

  // Añadir detalles extra si se proporcionan
  Object.entries(extraDetails).forEach(([key, value]) => {
    notificationParts.push(`📌 *${key}:* ${value}`);
  });

  return notificationParts.join('\n');
}
/**
 * Maneja la recepción de un nuevo pedido desde el menú web.
 * @param {string} to Número del destinatario.
 * @param {string} orderText El texto completo del pedido del cliente.
 */
async function handleNewOrderFromMenu(to, orderText) {
  console.log(`🛒 INICIANDO PROCESO DE PEDIDO para ${to}`);
  console.log(`📋 Texto del pedido: ${orderText.substring(0, 200)}...`);

  // NUEVO: Verificación del modo "fuera de servicio"
  const isMaintenanceMode = await redisClient.get(MAINTENANCE_MODE_KEY) === 'true';
  console.log(`🔧 Modo mantenimiento: ${isMaintenanceMode}`);

  if (isMaintenanceMode) {
    console.log(`⚠️ Pedido rechazado por modo mantenimiento`);
    await sendTextMessage(to, '¡Hola! En este momento no estamos tomando pedidos, pero con gusto puedo darte información sobre nuestro menú o promociones. ¿En qué te puedo ayudar? 😊');
    return;
  }

  console.log(`✅ Procesando pedido normalmente`);

  const totalMatch = orderText.match(/Total del pedido: $(\d+\.\d{2})/i);
  const total = totalMatch ? totalMatch[1] : null;

  // Notificar a los administradores que se ha iniciado un nuevo pedido.
  const orderSummary = extractOrderItems(orderText);
  const initialAdminNotification = `🔔 ¡Nuevo pedido iniciado!\n\n*Cliente:* ${formatDisplayNumber(to)}\n\n*Pedido:*
${orderSummary}\n\n*Total:* ${total ? '$' + total : 'No especificado'}\n\n*Nota:* Esperando dirección y método de pago.`;
  await notifyAdmin(initialAdminNotification);

  let confirmationText = `¡Gracias por tu pedido! ✨\n\nHemos recibido tu orden y ya está en proceso de confirmación.`;

  if (total) {
    confirmationText += `\n\nConfirmamos un total de *$${total}*. En un momento te enviaremos los detalles para el pago.`;
  }

  // 1. Envía el mensaje de confirmación inicial.
  await sendTextMessage(to, confirmationText);

  // 2. Envía la pregunta de seguimiento para la dirección.
  const addressRequestText = `Para continuar, por favor, indícanos tu dirección completa (calle, número, colonia y alguna referencia). 🏠`;
  await sendTextMessage(to, addressRequestText);

  // 3. Pone al usuario en el estado de "esperando dirección".
  await setUserState(to, { step: 'awaiting_address', orderText: orderText });
}

/**
 * Maneja la respuesta del usuario cuando se le pide la dirección.
 * @param {string} from El número del remitente.
 * @param {string} address El texto de la dirección proporcionada.
 */
async function handleAddressResponse(from, address) {
  console.log(`Dirección recibida de ${from}: ${address}`);

  // Mejora: Si el usuario vuelve a enviar el pedido en lugar de la dirección, se lo volvemos a pedir.
  if (address.toLowerCase().includes('total del pedido:')) {
    await sendTextMessage(from, 'Parece que me enviaste el pedido de nuevo. ¡No te preocupes! Ya lo tengo registrado. 👍\n\nAhora solo necesito que me escribas tu dirección completa para continuar.');
    return; // Detenemos la ejecución para esperar la dirección correcta.
  }

  console.log(`Procesando dirección válida para ${from}, solicitando ubicación...`);

  // Solicitar ubicación con botones interactivos
  const locationPayload = {
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: `✅ Perfecto, dirección guardada:\n\n"${address}"\n\nPara confirmar la ubicación exacta, ¿podrías compartir tu ubicación actual?`
      },
      action: {
        buttons: [
          { type: 'reply', reply: { id: 'send_location_now', title: '📍 Enviar ubicación' } },
          { type: 'reply', reply: { id: 'skip_location', title: 'Omitir ubicación' } }
        ]
      }
    }
  };

  try {
    await sendMessage(from, locationPayload);
    console.log(`Solicitud de ubicación enviada exitosamente a ${from}`);
  } catch (error) {
    console.error(`Error enviando solicitud de ubicación a ${from}:`, error);
    // Enviar mensaje de texto simple como fallback
    await sendTextMessage(from, `✅ Perfecto, dirección guardada:\n\n"${address}"\n\nPara confirmar la ubicación exacta, ¿podrías compartir tu ubicación?\n\nResponde "ubicación" para enviarla o "continuar" para omitir este paso.`);
  }

  // Actualiza el estado del usuario para esperar ubicación
  const currentState = await getUserState(from) || {};
  await setUserState(from, { ...currentState, step: 'awaiting_location_confirmation', address: address });
  console.log(`Estado actualizado para ${from}: awaiting_location_confirmation`);

  // Reacción contextual: dirección guardada
  if (currentState.lastMessageId && reactionManager) {
    reactionManager.reactToOrderFlow(from, currentState.lastMessageId, 'address_saved').catch(() => {});
  }

  // Notifica a n8n que la dirección fue actualizada.
  sendToN8n({ from: from, type: 'address_update', timestamp: Math.floor(Date.now() / 1000) }, { address });
  console.log(`Dirección enviada a n8n: ${address}`);
}

/**
 * Procede a preguntar sobre el código de acceso (usado cuando se omite ubicación o se confirma)
 * @param {string} from El número del remitente.
 * @param {object} userState El estado actual del usuario.
 */
async function proceedToAccessCodeQuestion(from, userState) {
  console.log(`Procediendo a pregunta de código de acceso para ${from}...`);

  // Pregunta si se necesita código de acceso con botones.
  const payload = {
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: '¿Tu domicilio está en una privada y se necesita código de acceso para entrar?' },
      action: {
        buttons: [
          { type: 'reply', reply: { id: 'access_code_yes', title: 'Sí, se necesita' } },
          { type: 'reply', reply: { id: 'access_code_no', title: 'No, no se necesita' } }
        ]
      }
    }
  };

  try {
    await sendMessage(from, payload);
    console.log(`Mensaje de código de acceso enviado exitosamente a ${from}`);
  } catch (error) {
    console.error(`Error enviando mensaje de código de acceso a ${from}:`, error);
    // Enviar mensaje de texto simple como fallback
    await sendTextMessage(from, '¿Tu domicilio está en una privada y se necesita código de acceso para entrar?\n\nResponde "sí" o "no".');
  }

  // Actualizar estado
  const currentState = await getUserState(from) || {};
  await setUserState(from, { ...currentState, step: 'awaiting_access_code_info' });
  console.log(`Estado actualizado para ${from}: awaiting_access_code_info`);
}

/**
 * Maneja la respuesta del usuario sobre el código de acceso.
 * @param {string} from El número del remitente.
 * @param {string} buttonId El ID del botón presionado ('access_code_yes' o 'access_code_no').
 */
async function handleAccessCodeResponse(from, buttonId) {
  const userState = await getUserState(from);

  // Guardamos la información del código de acceso en el estado
  userState.accessCodeInfo = buttonId;

  // Reacción contextual: código de acceso guardado
  if (userState.lastMessageId && reactionManager) {
    reactionManager.reactToOrderFlow(from, userState.lastMessageId, 'access_code_saved').catch(() => {});
  }

  // Ahora, en lugar de finalizar, preguntamos por el método de pago
  const payload = {
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: '¡Excelente! Por último, ¿cómo prefieres realizar tu pago?' },
      action: {
        buttons: [
          { type: 'reply', reply: { id: 'payment_cash', title: 'Efectivo 💵' } },
          { type: 'reply', reply: { id: 'payment_transfer', title: 'Transferencia 💳' } }
        ]
      }
    }
  };
  await sendMessage(from, payload);

  // Actualiza el estado del usuario para esperar la respuesta del método de pago.
  await setUserState(from, { ...userState, step: 'awaiting_payment_method' });
}

/**
 * Maneja respuestas de texto para código de acceso.
 * @param {string} from El número del remitente.
 * @param {string} text El texto del mensaje.
 */
async function handleAccessCodeTextResponse(from, text) {
    const normalizedText = text.toLowerCase().trim();
    if (normalizedText.includes('sí') || normalizedText.includes('si') || normalizedText === 's') {
        await handleAccessCodeResponse(from, 'access_code_yes');
    } else if (normalizedText.includes('no') || normalizedText === 'n') {
        await handleAccessCodeResponse(from, 'access_code_no');
    } else {
        await sendTextMessage(from, 'Por favor responde "sí" si necesitas código de acceso o "no" si no lo necesitas.');
    }
}

/**
 * Maneja respuestas de texto para método de pago.
 * @param {string} from El número del remitente.
 * @param {string} text El texto del mensaje.
 */
async function handlePaymentMethodTextResponse(from, text) {
    const normalizedText = text.toLowerCase().trim();
    if (normalizedText.includes('efectivo') || normalizedText.includes('cash')) {
        await handlePaymentMethodResponse(from, 'payment_cash');
    } else if (normalizedText.includes('transferencia') || normalizedText.includes('transfer')) {
        await handlePaymentMethodResponse(from, 'payment_transfer');
    } else {
        await sendTextMessage(from, 'Por favor responde "efectivo" o "transferencia" para seleccionar tu método de pago.');
    }
}

/**
 * Maneja la respuesta del usuario sobre el método de pago.
 * @param {string} from El número del remitente.
 * @param {string} buttonId El ID del botón presionado ('payment_cash' o 'payment_transfer').
 */
async function handlePaymentMethodResponse(from, buttonId) {
  const userState = await getUserState(from);
  if (!userState) return; // Chequeo de seguridad

  // Reacción contextual: método de pago seleccionado
  if (userState.lastMessageId && reactionManager) {
    reactionManager.reactToOrderFlow(from, userState.lastMessageId, 'payment_received').catch(() => {});
  }

  if (buttonId === 'payment_transfer') {
    const bankDetails = `Para transferencias, puedes usar la siguiente cuenta:\n- Banco: MERCADO PAGO W\n- Número de Cuenta: 722969010305501833\n- A nombre de: Maria Elena Martinez Flores\n\nPor favor, envía tu comprobante de pago a este mismo chat para confirmar tu pedido.`;
    await sendTextMessage(from, bankDetails);
    await sendTextMessage(from, 'Por favor, envía una imagen de tu comprobante de pago a este mismo chat para confirmar tu pedido.');

    // Notificar al administrador
    const adminNotification = buildAdminNotification(
      '⏳ Pedido por Transferencia en espera',
      userState,
      from,
      { 'Nota': 'Esperando comprobante de pago.' }
    );
    await notifyAdmin(adminNotification);

    // Actualizamos el estado para esperar la imagen del comprobante
    await setUserState(from, { ...userState, step: 'awaiting_payment_proof', paymentMethod: 'Transferencia' });
  } else { // 'payment_cash'
    await sendTextMessage(from, 'Has elegido pagar en efectivo. ¿Con qué billete pagarás? (ej. $200, $500) para que podamos llevar tu cambio exacto.');
    // Guardamos el método de pago en el estado
    await setUserState(from, { ...userState, step: 'awaiting_cash_denomination', paymentMethod: 'Efectivo' });
  }
}

/**
 * Maneja la respuesta del usuario sobre la denominación del billete.
 * @param {string} from El número del remitente.
 * @param {string} denomination El texto con la denominación del billete.
 */
async function handleCashDenominationResponse(from, denomination) {
  // Mejora: Validar la entrada del usuario para asegurar que sea un número.
  const sanitizedDenomination = denomination.trim().replace('$', '');
  if (isNaN(sanitizedDenomination) || parseFloat(sanitizedDenomination) <= 0) {
    await sendTextMessage(from, 'Por favor, ingresa un monto válido para el pago en efectivo (ej. 200, 500).');
    return; // No continuamos si la entrada no es válida.
  }

  const userState = await getUserState(from);
  const address = userState.address;
  let finalMessage = `¡Pedido completo y confirmado! 🛵\n\nTu orden será enviada a:\n*${address}*.\n\n`;

  if (userState.accessCodeInfo === 'access_code_yes') {
    finalMessage += `Un agente te contactará para el código de acceso cuando el repartidor esté en camino.\n\n`;
  } else {
    finalMessage += `Hemos registrado que no se necesita código de acceso.`;
  }
  
  finalMessage += `\nLlevaremos cambio para tu pago de *${denomination}*.\n\n✅ ¡Gracias por tu preferencia!`;

  await sendTextMessage(from, finalMessage);

  // Notificar al administrador
  const adminNotification = buildAdminNotification(
    '🎉 ¡Nuevo pedido en Efectivo!',
    userState,
    from,
    { 'Paga con': denomination }
  );
  await notifyAdmin(adminNotification);

  // Reacción de celebración: pedido completado
  if (userState.lastMessageId && reactionManager) {
    reactionManager.reactToOrderFlow(from, userState.lastMessageId, 'celebration').catch(() => {});
  }

  // Guardamos la denominación y enviamos el pedido completo a n8n
  const finalState = { ...userState, cashDenomination: sanitizedDenomination };
  sendOrderCompletionToN8nEnhanced(from, finalState);
  logOrderToFile(finalState); // Log the completed order

  console.log(`Pedido finalizado para ${from}. Dirección: ${address}. Pago: Efectivo (${sanitizedDenomination}).`);
  await deleteUserState(from);
}

/**
 * Maneja la recepción de una imagen como comprobante de pago.
 * @param {string} from El número del remitente.
 * @param {object} imageObject El objeto de imagen del mensaje, que contiene el ID.
 */
async function handlePaymentProofImage(from, imageObject) {
  const userState = await getUserState(from); // <-- CORRECCIÓN: Usar la función async de Redis.
  if (!userState) return;

  console.log(`Recibido comprobante de pago (imagen) de ${from}`);

  // 1. Agradecer al cliente y confirmar el pedido
  await sendTextMessage(from, '✅ ¡Gracias! Hemos recibido tu comprobante. Tu pedido ha sido confirmado y se preparará en breve. 🛵');

  // 2. Preparar la notificación para los administradores
  const adminCaption = buildAdminNotification(
    '✅ Comprobante Recibido',
    userState,
    from
  );

  // 3. Construir el payload para reenviar la imagen con el caption
  const imagePayload = {
    type: 'image',
    image: {
      id: imageObject.id, // Usamos el ID de la imagen recibida para reenviarla
      caption: adminCaption
    }
  };

  // 4. Enviar a todos los administradores
  const adminNumbers = ADMIN_WHATSAPP_NUMBERS.split(',').map(num => num.trim());
  for (const number of adminNumbers) {
    if (number) {
      await sendMessage(number, imagePayload);
    }
  }

  // Reacción de celebración: comprobante validado y pedido completado
  if (userState.lastMessageId && reactionManager) {
    reactionManager.reactToOrderFlow(from, userState.lastMessageId, 'celebration').catch(() => {});
  }

  // Guardamos el ID de la imagen y enviamos el pedido completo a n8n
  const finalState = { ...userState, proofImageId: imageObject.id };
  sendOrderCompletionToN8nEnhanced(from, finalState);
  logOrderToFile(finalState); // Log the completed order

  console.log(`Pedido finalizado y comprobante reenviado para ${from}.`);

  // 5. Limpiar el estado del usuario
  await deleteUserState(from); // <-- CORRECCIÓN: Usar la función async de Redis.
}
/**
 * Maneja preguntas de formato libre usando la API de Gemini.
 * @param {string} to Número del destinatario.
 * @param {string} userQuery La pregunta del usuario.
 */
async function handleFreeformQuery(to, userQuery) {
    console.log(`🤖 Gemini procesando consulta libre: "${userQuery}"`);

    try {
        // === PASO 1: Verificar caché primero ===
        if (geminiCache) {
            const startTime = Date.now();
            const cached = await geminiCache.get(userQuery);

            if (cached) {
                const responseTime = Date.now() - startTime;
                console.log(`⚡ Cache HIT - Respuesta en ${responseTime}ms (vs ~3000ms con API)`);

                // Registrar métrica de cache hit
                if (metricsCollector) {
                    await metricsCollector.incrementMetric('gemini_cache_hits', 1, 3600);
                }

                await sendTextMessage(to, cached.response);
                return;
            }
        }

        // === PASO 2: Si no hay caché, llamar a Gemini API ===
        const apiStartTime = Date.now();

        // Verificar modo mantenimiento
        const isMaintenanceMode = await redisClient.get(MAINTENANCE_MODE_KEY) === 'true';

        // Inicializa el modelo de IA Generativa con configuración optimizada
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

        // Configurar System Instructions (se cargan una sola vez, no en cada llamada)
        const systemInstruction = `Eres el asistente virtual de CapiBobba, una tienda especializada en bubble tea y frappes.

${BUSINESS_CONTEXT}

ESTADO DEL SERVICIO: ${isMaintenanceMode ? 'CERRADO (mantenimiento)' : 'ABIERTO'}

INSTRUCCIONES:
1. Responde de manera amigable y profesional, como un barista experto
2. Si preguntan sobre productos específicos, menciona el menú web: https://feyomx.github.io/menucapibobba/
3. Si quieren hacer pedidos y el servicio está abierto, guíalos al menú web para completar su orden
4. Si el servicio está cerrado, informa amablemente que no estamos tomando pedidos en este momento
5. Para preguntas sobre envío, confirma que es GRATIS en las zonas mencionadas
6. Mantén las respuestas concisas pero informativas (máximo 2-3 párrafos)
7. Si no sabes algo específico, sugiere contactar directamente o revisar el menú web
8. Siempre mantén un tono cálido y entusiasta sobre nuestros productos`;

        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            systemInstruction: systemInstruction,
            generationConfig: {
                temperature: 0.7,        // Balance entre creatividad y consistencia
                topK: 40,                // Diversidad de tokens
                topP: 0.95,              // Nucleus sampling
                maxOutputTokens: 500,    // Limitar longitud de respuestas (aprox 300-400 palabras)
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        });

        // Crear prompt simplificado (el contexto ya está en systemInstruction)
        const prompt = `Pregunta del cliente: "${userQuery}"`;

        // Verificar si streaming está habilitado
        const streamingEnabled = process.env.GEMINI_STREAMING_ENABLED === 'true';

        let response;
        let geminiText = '';

        if (streamingEnabled) {
            // === MODO STREAMING ===
            console.log('🌊 Usando streaming mode para Gemini');

            // Mantener typing indicator activo
            await sendTypingOn(to);

            const streamResult = await model.generateContentStream(prompt);
            let lastTypingTime = Date.now();

            // Procesar chunks en tiempo real
            for await (const chunk of streamResult.stream) {
                const chunkText = chunk.text();
                geminiText += chunkText;

                // Renovar typing indicator cada 15 segundos
                const now = Date.now();
                if (now - lastTypingTime > 15000) {
                    await sendTypingOn(to);
                    lastTypingTime = now;
                }
            }

            // Obtener response final para safety checks
            response = await streamResult.response;

            const streamingTime = Date.now() - apiStartTime;
            console.log(`🌊 Streaming completado en ${streamingTime}ms - ${geminiText.length} caracteres`);

            // Registrar métrica de streaming
            if (metricsCollector) {
                await metricsCollector.incrementMetric('gemini_streaming_requests', 1, 86400);
                await metricsCollector.incrementMetric('gemini_streaming_time', streamingTime, 86400);
            }
        } else {
            // === MODO NORMAL (sin streaming) ===
            const result = await model.generateContent(prompt);
            response = await result.response;
            geminiText = response.text();
        }

        // === VERIFICACIÓN DE SEGURIDAD ===
        // Verificar si el contenido fue bloqueado por razones de seguridad
        if (response.promptFeedback?.blockReason) {
            const blockReason = response.promptFeedback.blockReason;
            console.warn(`🚫 Contenido bloqueado por seguridad - Razón: ${blockReason}`);
            console.warn(`📝 Usuario: ${to} | Consulta: "${userQuery.substring(0, 50)}..."`);

            // Registrar evento de seguridad
            if (metricsCollector) {
                await metricsCollector.incrementMetric('gemini_safety_blocks', 1, 86400);
            }

            // Loguear en sistema de seguridad
            if (security) {
                await security.logSecurityEvent({
                    type: 'gemini_content_blocked',
                    severity: 'medium',
                    phoneNumber: to,
                    message: userQuery,
                    blockReason: blockReason,
                    timestamp: new Date().toISOString()
                });
            }

            // Responder al usuario de manera amable
            await sendTextMessage(to, "Lo siento, no puedo responder a ese tipo de mensajes. ¿Hay algo sobre nuestros productos en lo que pueda ayudarte? 😊");
            return;
        }

        // Verificar y loguear ratings de seguridad si existen
        if (response.promptFeedback?.safetyRatings) {
            const ratings = response.promptFeedback.safetyRatings;
            const highRiskRatings = ratings.filter(r =>
                r.probability === 'HIGH' || r.probability === 'MEDIUM'
            );

            if (highRiskRatings.length > 0) {
                console.log('⚠️ Advertencia de seguridad detectada:', highRiskRatings);

                // Registrar advertencia
                if (metricsCollector) {
                    await metricsCollector.incrementMetric('gemini_safety_warnings', 1, 86400);
                }
            }
        }

        const apiResponseTime = Date.now() - apiStartTime;
        console.log(`🤖 Gemini API respondió en ${apiResponseTime}ms (${geminiText.length} caracteres)`);

        // === PASO 3: Guardar respuesta en caché para futuras consultas ===
        if (geminiCache) {
            await geminiCache.set(userQuery, geminiText, {
                maintenanceMode: isMaintenanceMode,
                responseTime: apiResponseTime
            });

            // Registrar métrica de cache miss (nueva entrada)
            if (metricsCollector) {
                await metricsCollector.incrementMetric('gemini_cache_misses', 1, 3600);
            }
        }

        await sendTextMessage(to, geminiText);
        console.log(`✅ Gemini respondió exitosamente a ${to}`);

    } catch (error) {
        console.error('Error al contactar la API de Gemini:', error);

        // Manejo específico de errores de seguridad
        if (error.message?.includes('SAFETY') || error.message?.includes('blocked')) {
            console.error('🚫 Error de seguridad al generar contenido:', error.message);

            // Registrar evento de seguridad
            if (metricsCollector) {
                await metricsCollector.incrementMetric('gemini_safety_errors', 1, 86400);
            }

            if (security) {
                await security.logSecurityEvent({
                    type: 'gemini_safety_error',
                    severity: 'high',
                    phoneNumber: to,
                    message: userQuery,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }

            await sendTextMessage(to, "Lo siento, no puedo procesar ese mensaje. ¿Hay algo sobre nuestros productos en lo que pueda ayudarte? 😊");
            return;
        }

        // Manejo de rate limiting
        if (error.message?.includes('RATE_LIMIT') || error.message?.includes('429')) {
            console.error('⏱️ Rate limit excedido en Gemini API:', error.message);

            if (metricsCollector) {
                await metricsCollector.incrementMetric('gemini_rate_limit_errors', 1, 3600);
            }

            await sendTextMessage(to, "Estamos experimentando alta demanda. Por favor, espera un momento e inténtalo de nuevo. 🙏");
            return;
        }

        // Para otros errores, usar defaultHandler
        await defaultHandler(to);
    }
}

/**
 * Maneja los mensajes no reconocidos.
 * @param {string} to Número del destinatario.
 */
async function defaultHandler(to, originalMessage = null) {
    console.log(`⚠️ Ejecutando defaultHandler para ${to}`);

    // Si tenemos el mensaje original, intentar una vez más con Gemini
    if (originalMessage) {
        try {
            console.log(`🔄 Intentando Gemini como último recurso para: "${originalMessage}"`);
            await handleFreeformQuery(to, originalMessage);
            return;
        } catch (error) {
            console.error('Error en último intento con Gemini:', error);
        }
    }

    // Solo si todo lo demás falla, usar el mensaje por defecto
    await sendTextMessage(to, `Lo siento, no pude entender tu mensaje.

Puedes intentar:
• Escribir "hola" para ver el menú principal
• Escribir "menu" para ver nuestros productos
• Escribir "ayuda" para más opciones

O simplemente pregúntame sobre nuestros productos, horarios o precios 😊`);
}

// ✅ NUEVAS FUNCIONES PARA CONSULTAS ESPECÍFICAS

/**
 * Maneja consultas específicas sobre envío/delivery.
 * @param {string} to Número del destinatario.
 * @param {string} text El texto original del mensaje.
 */
async function handleDeliveryInquiry(to, text) {
    console.log(`📦 Manejando consulta de envío para ${to}`);

    // Verificar modo mantenimiento
    const isMaintenanceMode = await redisClient.get(MAINTENANCE_MODE_KEY) === 'true';
    if (isMaintenanceMode) {
        await sendTextMessage(to, 'En este momento no estamos tomando pedidos. ¡Agradecemos tu comprensión y esperamos verte pronto! 👋');
        return;
    }

    // Respuesta específica sobre envíos
    const deliveryInfo = `🚚 **Información de Envío**

✅ ¡Tenemos servicio a domicilio GRATIS!

📍 **Cobertura:** Fraccionamientos aledaños a Viñedos
🕒 **Horarios de entrega:**
   • Lunes a Viernes: 6:00 PM - 10:00 PM
   • Sábados y Domingos: 12:00 PM - 10:00 PM

💰 **Sin costo adicional** por envío
⏱️ **Tiempo estimado:** 20-30 minutos

¿Te gustaría hacer un pedido? 😊`;

    await sendTextMessage(to, deliveryInfo);
}

/**
 * Maneja consultas sobre precios.
 * @param {string} to Número del destinatario.
 * @param {string} text El texto original del mensaje.
 */
async function handlePriceInquiry(to, text) {
    console.log(`💰 Manejando consulta de precios para ${to}`);

    const priceInfo = `💰 **Nuestros Precios**

🧋 **Frappes Base Agua:** $75
🥛 **Frappes Base Leche:** $75
🍓 **Especialidades:** $75 - $80

✨ **Promociones actuales:**
🌧️ Combo Día Lluvioso: 2 bebidas calientes x $110
👥 Combo Amigos: 2 Frappes base agua x $130

Para ver el menú completo con todos los precios: https://feyomx.github.io/menucapibobba/

¿Te gustaría hacer un pedido? 😊`;

    await sendTextMessage(to, priceInfo);
}

/**
 * Maneja consultas sobre horarios y estado del servicio.
 * @param {string} to Número del destinatario.
 * @param {string} text El texto original del mensaje.
 */
async function handleServiceStatusCheck(to, text) {
    console.log(`🕒 Manejando consulta de horarios para ${to}`);

    // Verificar modo mantenimiento
    const isMaintenanceMode = await redisClient.get(MAINTENANCE_MODE_KEY) === 'true';

    const statusInfo = `🕒 **Horarios de CapiBobba**

📅 **Lunes a Viernes:** 6:00 PM - 10:00 PM
📅 **Sábados y Domingos:** 12:00 PM - 10:00 PM

${isMaintenanceMode ?
    '🔴 **Estado actual:** CERRADO (Mantenimiento)\nNo estamos tomando pedidos en este momento.' :
    '🟢 **Estado actual:** ABIERTO\n¡Estamos tomando pedidos!'
}

🚚 **Envío gratuito** en fraccionamientos aledaños a Viñedos

¿Te gustaría ver nuestro menú? 😊`;

    await sendTextMessage(to, statusInfo);
}

/**
 * Maneja intención de iniciar un pedido.
 * @param {string} to Número del destinatario.
 * @param {string} text El texto original del mensaje.
 */
async function handleInitiateOrder(to, text) {
    console.log(`🛒 Manejando inicio de pedido para ${to}`);

    // Verificar modo mantenimiento
    const isMaintenanceMode = await redisClient.get(MAINTENANCE_MODE_KEY) === 'true';
    if (isMaintenanceMode) {
        await sendTextMessage(to, 'En este momento no estamos tomando pedidos. ¡Agradecemos tu comprensión y esperamos verte pronto! 👋');
        return;
    }

    // Dirigir al menú web para hacer el pedido
    const orderInfo = `🛒 **¡Perfecto! Vamos a hacer tu pedido**

Para ver todo nuestro menú y realizar tu pedido:
👉 https://feyomx.github.io/menucapibobba/

**Pasos sencillos:**
1️⃣ Selecciona tus bebidas favoritas
2️⃣ Personaliza ingredientes
3️⃣ Confirma tu pedido
4️⃣ Te pediremos tu dirección de entrega

🚚 **Envío GRATIS** en fraccionamientos aledaños a Viñedos
⏱️ **Tiempo de entrega:** 20-30 minutos

¿Listo para ordenar? 😊`;

    await sendTextMessage(to, orderInfo);
}

/**
 * Envía un mensaje de texto simple.
 * @param {string} to El número de teléfono del destinatario.
 * @param {string} text El texto a enviar.
 */
async function sendTextMessage(to, text) {
  const payload = { type: 'text', text: { body: text } };
  await sendMessage(to, payload);
}

/**
 * Envía una notificación a todos los números de WhatsApp de los administradores.
 * @param {string} text El mensaje de notificación.
 */
async function notifyAdmin(text) {
  if (!ADMIN_WHATSAPP_NUMBERS) {
    console.log('No se han configurado números de administrador para notificaciones.');
    return;
  }

  // Separa la cadena de números en un array, elimina espacios y filtra vacíos.
  const adminNumbers = ADMIN_WHATSAPP_NUMBERS.split(',').map(num => num.trim()).filter(Boolean);

  if (adminNumbers.length === 0) {
    return;
  }

  console.log(`Enviando notificación a los administradores: ${adminNumbers.join(', ')}`);

  // Crea una promesa para cada envío de mensaje con manejo de errores
  const promises = adminNumbers.map(async (number) => {
    try {
      await sendTextMessage(number, text);
    } catch (error) {
      console.error(`Error enviando notificación al admin ${number}:`, error);
      // No relanzamos el error para evitar interrumpir el flujo principal
    }
  });

  // Espera a que todas las notificaciones se envíen en paralelo para mayor eficiencia
  await Promise.all(promises);
}

/**
 * Envía el indicador de "escribiendo..." al usuario para mejorar la UX.
 * Esta es una acción de "disparar y olvidar", no bloquea el flujo principal.
 * El indicador dura hasta 25 segundos o hasta que se envíe la respuesta.
 * @param {string} messageId El ID del mensaje al que se está respondiendo.
 */
async function sendTypingOn(messageId) {
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${PHONE_NUMBER_ID}/messages`;
  const data = {
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId,
    typing_indicator: {
      type: 'text',
    },
  };
  const headers = {
    'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
    'Content-Type': 'application/json',
  };

  try {
    // No usamos await en la llamada a esta función, pero la función es async por axios.
    // No logueamos el éxito para no saturar la consola.
    await axios.post(url, data, { headers });
  } catch (error) {
    // Es una función de UX, si falla no es crítico. No logueamos el error para evitar ruido.
    // console.error('Error al enviar el indicador de typing_on:', error.response ? error.response.data : error.message);
  }
}


/**
 * Marca un mensaje como leído en WhatsApp.
 * Mejora la UX mostrando al usuario que su mensaje fue visto.
 * Esta es una acción de "disparar y olvidar", no bloquea el flujo principal.
 * @param {string} messageId El ID del mensaje a marcar como leído.
 */
async function markMessageAsRead(messageId) {
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${PHONE_NUMBER_ID}/messages`;
  const data = {
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId,
  };
  const headers = {
    'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
    'Content-Type': 'application/json',
  };

  try {
    await axios.post(url, data, { headers });
    console.log(`✓ Mensaje ${messageId} marcado como leído`);
  } catch (error) {
    // Es una función de UX, si falla no es crítico
    console.error('Error al marcar mensaje como leído:', error.response ? error.response.data : error.message);
  }
}


/**
 * Envía una reacción (emoji) a un mensaje específico de WhatsApp.
 * Las reacciones mejoran la UX dando feedback visual inmediato.
 * @param {string} to Número de teléfono del destinatario.
 * @param {string} messageId ID del mensaje al que se reaccionará.
 * @param {string} emoji Emoji a enviar como reacción (ej: "👍", "✅", "❤️").
 * @returns {Promise<boolean>} True si se envió exitosamente, false si falló.
 */
async function sendReaction(to, messageId, emoji) {
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${PHONE_NUMBER_ID}/messages`;
  const data = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: to,
    type: 'reaction',
    reaction: {
      message_id: messageId,
      emoji: emoji,
    },
  };
  const headers = {
    'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
    'Content-Type': 'application/json',
  };

  try {
    await axios.post(url, data, { headers });
    console.log(`✓ Reacción ${emoji} enviada a mensaje ${messageId}`);
    return true;
  } catch (error) {
    console.error('Error al enviar reacción:', error.response ? error.response.data : error.message);
    return false;
  }
}


/**
 * Envía un mensaje a través de la API de WhatsApp.
 * @param {string} to El número de teléfono del destinatario.
 * @param {object} payload El objeto de mensaje a enviar (puede ser texto, interactivo, etc.).
 */
async function sendMessage(to, payload) {
  logMessageToFile({ type: 'outgoing', to: to, payload: payload }); // Log outgoing message
  // NUEVO: Registramos la respuesta del bot en n8n antes de enviarla.
  // Es una acción de "disparar y olvidar" para no retrasar la respuesta al usuario.
  // Esto nos permite tener un log de todas las comunicaciones salientes.
  registerBotResponseToN8n(to, payload);

  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${PHONE_NUMBER_ID}/messages`;
  const data = {
    messaging_product: 'whatsapp',
    to: to,
    ...payload, // El payload contiene el tipo de mensaje y su contenido
  };
  const headers = {
    'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
    'Content-Type': 'application/json',
  };

  try {
    console.log(`Enviando mensaje a ${to}:`, JSON.stringify(payload, null, 2));
    await axios.post(url, data, { headers });
    console.log('Mensaje enviado exitosamente.');
  } catch (error) {
    console.error('Error al enviar el mensaje:', error.response ? error.response.data : error.message);
  }
}


// --- Funciones de Logging ---

/**
 * Registra una entrada de log en un archivo .jsonl.
 * @param {string} fileName El nombre del archivo (ej. 'message_log.jsonl').
 * @param {object} logEntry El objeto a registrar.
 */
function logToFile(fileName, logEntry) {
  const logFilePath = path.join(__dirname, fileName);
  const timestampedEntry = { timestamp: new Date().toISOString(), ...logEntry };
  fs.appendFile(logFilePath, JSON.stringify(timestampedEntry) + '\n', (err) => {
    if (err) {
      console.error(`Error al escribir en el archivo de log ${fileName}:`, err);
    }
  });
}

// Funciones específicas de log que usan el logger genérico
const logMessageToFile = (logEntry) => logToFile('message_log.jsonl', logEntry);
const logOrderToFile = (orderData) => logToFile('order_log.jsonl', orderData);
const logSurveyResponseToFile = (surveyData) => logToFile('survey_log.jsonl', surveyData);

/**
 * Lee un archivo de log en formato JSONL y envía el contenido como respuesta JSON.
 * @param {string} logFileName El nombre del archivo de log (ej. 'message_log.jsonl').
 * @param {object} res El objeto de respuesta de Express.
 * @param {string} errorContext Un string para el mensaje de error (ej. 'mensajes').
 */
function sendJsonlLogResponse(logFileName, res, errorContext) {
  const logFilePath = path.join(__dirname, logFileName);
  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.json([]); // Si el archivo no existe, devuelve un array vacío.
      }
      console.error(`Error al leer el archivo de log de ${errorContext}:`, err);
      return res.status(500).json({ error: `Error al leer el log de ${errorContext}.` });
    }
    const items = data.split('\n').filter(Boolean).map(line => {
      try {
        return JSON.parse(line);
      } catch (parseError) {
        console.error(`Error al parsear línea del log de ${errorContext}:`, parseError);
        return null; // Ignora líneas mal formadas
      }
    }).filter(Boolean); // Filtra los nulos
    res.json(items);
  });
}

// Endpoint para obtener el log de mensajes
app.get('/api/message-log', (req, res) => {
  sendJsonlLogResponse('message_log.jsonl', res, 'mensajes');
});

// Endpoint para obtener el log de pedidos con paginación y filtros
app.get('/api/orders', (req, res) => {
  const logFilePath = path.join(__dirname, 'order_log.jsonl');

  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.json({ success: true, data: { orders: [], total: 0, page: 1, limit: 10 } });
      }
      console.error('Error al leer el archivo de pedidos:', err);
      return res.status(500).json({ success: false, error: 'Error al leer pedidos' });
    }

    try {
      // Parsear todas las líneas
      const allOrders = data.split('\n').filter(Boolean).map(line => {
        try {
          return JSON.parse(line);
        } catch (parseError) {
          console.error('Error al parsear línea del log de pedidos:', parseError);
          return null;
        }
      }).filter(Boolean);

      // Obtener parámetros de query
      const limit = parseInt(req.query.limit) || 10;
      const page = parseInt(req.query.page) || 1;
      const sortBy = req.query.sort_by || 'timestamp';
      const sortOrder = req.query.sort_order || 'desc';
      const status = req.query.status;

      // Filtrar por estado si se especifica
      let filteredOrders = allOrders;
      if (status) {
        filteredOrders = allOrders.filter(order => order.status === status);
      }

      // Ordenar
      filteredOrders.sort((a, b) => {
        const aVal = a[sortBy] || a.timestamp;
        const bVal = b[sortBy] || b.timestamp;
        return sortOrder === 'desc' ? (bVal > aVal ? 1 : -1) : (aVal > bVal ? 1 : -1);
      });

      // Paginar
      const startIndex = (page - 1) * limit;
      const paginatedOrders = filteredOrders.slice(startIndex, startIndex + limit);

      res.json({
        success: true,
        data: {
          orders: paginatedOrders,
          total: filteredOrders.length,
          page,
          limit,
          totalPages: Math.ceil(filteredOrders.length / limit)
        }
      });
    } catch (error) {
      console.error('Error procesando pedidos:', error);
      res.status(500).json({ success: false, error: 'Error procesando pedidos' });
    }
  });
});

// Endpoint para obtener el log de encuestas
app.get('/api/surveys', (req, res) => {
  sendJsonlLogResponse('survey_log.jsonl', res, 'encuestas');
});

// ============================================================================
// ENDPOINTS DE PEDIDOS INDIVIDUALES
// ============================================================================

/**
 * Endpoint para obtener un pedido específico por ID
 * GET /api/orders/:id
 */
app.get('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const logFilePath = path.join(__dirname, 'order_log.jsonl');

  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
      }
      console.error('Error al leer el archivo de pedidos:', err);
      return res.status(500).json({ success: false, error: 'Error al leer pedidos' });
    }

    try {
      const allOrders = data.split('\n').filter(Boolean).map(line => {
        try {
          return JSON.parse(line);
        } catch (parseError) {
          console.error('Error al parsear línea del log de pedidos:', parseError);
          return null;
        }
      }).filter(Boolean);

      // Buscar el pedido por ID
      const order = allOrders.find(o => o.id === id || o.timestamp === id);

      if (!order) {
        return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
      }

      res.json({ success: true, data: order });
    } catch (error) {
      console.error('Error procesando pedido:', error);
      res.status(500).json({ success: false, error: 'Error procesando pedido' });
    }
  });
});

/**
 * Endpoint para actualizar el estado de un pedido
 * PATCH /api/orders/:id/status
 * Body: { status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled' }
 */
app.patch('/api/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Validar status
  const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Estado inválido. Debe ser uno de: ${validStatuses.join(', ')}`
    });
  }

  const logFilePath = path.join(__dirname, 'order_log.jsonl');

  try {
    // Leer el archivo
    const data = await fs.promises.readFile(logFilePath, 'utf8').catch(() => '');
    const lines = data.split('\n').filter(Boolean);
    let orderFound = false;
    let updatedOrder = null;

    // Actualizar el pedido en memoria
    const updatedLines = lines.map(line => {
      try {
        const order = JSON.parse(line);
        if (order.id === id || order.timestamp === id) {
          orderFound = true;
          updatedOrder = {
            ...order,
            status,
            updated_at: new Date().toISOString()
          };

          // Si se marca como delivered, agregar delivered_at
          if (status === 'delivered' && !order.delivered_at) {
            updatedOrder.delivered_at = new Date().toISOString();
          }

          // Si se marca como confirmed, agregar confirmed_at
          if (status === 'confirmed' && !order.confirmed_at) {
            updatedOrder.confirmed_at = new Date().toISOString();
          }

          return JSON.stringify(updatedOrder);
        }
        return line;
      } catch (parseError) {
        console.error('Error al parsear línea del log de pedidos:', parseError);
        return line;
      }
    });

    if (!orderFound) {
      return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
    }

    // Escribir el archivo actualizado
    await fs.promises.writeFile(logFilePath, updatedLines.join('\n') + '\n', 'utf8');

    console.log(`✅ Pedido ${id} actualizado a estado: ${status}`);

    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error('Error actualizando estado del pedido:', error);
    res.status(500).json({ success: false, error: 'Error actualizando pedido' });
  }
});

// ============================================================================
// ENDPOINTS DE EVENTOS DE SEGURIDAD
// ============================================================================

/**
 * Endpoint para obtener eventos de seguridad
 * GET /api/security/events
 */
app.get('/api/security/events', async (req, res) => {
  try {
    // Obtener parámetros de paginación
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
    const severity = req.query.severity; // low, medium, high, critical

    // Obtener eventos de seguridad desde Redis
    const eventKeys = await redisClient.keys('security:event:*');
    const events = [];

    for (const key of eventKeys) {
      try {
        const eventData = await redisClient.get(key);
        if (eventData) {
          const event = JSON.parse(eventData);
          // Filtrar por severidad si se especifica
          if (!severity || event.severity === severity) {
            events.push(event);
          }
        }
      } catch (parseError) {
        console.error('Error parseando evento de seguridad:', parseError);
      }
    }

    // Ordenar por timestamp descendente (más recientes primero)
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Paginar
    const startIndex = (page - 1) * limit;
    const paginatedEvents = events.slice(startIndex, startIndex + limit);

    res.json({
      success: true,
      data: {
        events: paginatedEvents,
        total: events.length,
        page,
        limit,
        hasMore: startIndex + limit < events.length
      }
    });
  } catch (error) {
    console.error('Error obteniendo eventos de seguridad:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo eventos de seguridad' });
  }
});

/**
 * Endpoint para resolver un evento de seguridad
 * PATCH /api/security/events/:id/resolve
 */
app.patch('/api/security/events/:id/resolve', async (req, res) => {
  const { id } = req.params;

  try {
    const eventKey = `security:event:${id}`;
    const eventData = await redisClient.get(eventKey);

    if (!eventData) {
      return res.status(404).json({ success: false, error: 'Evento no encontrado' });
    }

    const event = JSON.parse(eventData);

    // Actualizar evento como resuelto
    const updatedEvent = {
      ...event,
      resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: 'admin' // TODO: Agregar autenticación y usar usuario real
    };

    await redisClient.set(eventKey, JSON.stringify(updatedEvent));

    console.log(`✅ Evento de seguridad ${id} marcado como resuelto`);

    res.json({ success: true, data: updatedEvent });
  } catch (error) {
    console.error('Error resolviendo evento de seguridad:', error);
    res.status(500).json({ success: false, error: 'Error resolviendo evento' });
  }
});

// ============================================================================
// ENDPOINTS DE CONFIGURACIÓN
// ============================================================================

/**
 * Endpoint para obtener la configuración del negocio
 * GET /api/config/business
 */
app.get('/api/config/business', async (req, res) => {
  try {
    // Intentar obtener desde Redis primero
    const cachedConfig = await redisClient.get('config:business');

    if (cachedConfig) {
      return res.json({ success: true, data: JSON.parse(cachedConfig) });
    }

    // Si no existe en Redis, retornar configuración actual de business_data.js
    const config = {
      business_name: BUSINESS_CONTEXT.business_name,
      phone_number: BUSINESS_CONTEXT.phone_number,
      location: BUSINESS_CONTEXT.location,
      opening_hours: BUSINESS_CONTEXT.opening_hours,
      delivery_zones: BUSINESS_CONTEXT.delivery_zones,
      delivery_fee: BUSINESS_CONTEXT.delivery_fee,
      payment_methods: BUSINESS_CONTEXT.payment_methods,
      bank_name: BUSINESS_CONTEXT.bank_name,
      bank_account: BUSINESS_CONTEXT.bank_account,
      bank_account_name: BUSINESS_CONTEXT.bank_account_name,
      menu_url: BUSINESS_CONTEXT.menu_url,
    };

    // Guardar en Redis para futuras consultas
    await redisClient.set('config:business', JSON.stringify(config));

    res.json({ success: true, data: config });
  } catch (error) {
    console.error('Error obteniendo configuración del negocio:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo configuración' });
  }
});

/**
 * Endpoint para actualizar la configuración del negocio
 * POST /api/config/business
 */
app.post('/api/config/business', async (req, res) => {
  try {
    const config = req.body;

    // Validar campos requeridos
    const requiredFields = ['business_name', 'phone_number', 'menu_url'];
    for (const field of requiredFields) {
      if (!config[field]) {
        return res.status(400).json({
          success: false,
          error: `Campo requerido faltante: ${field}`
        });
      }
    }

    // Guardar en Redis
    await redisClient.set('config:business', JSON.stringify(config));

    console.log('✅ Configuración del negocio actualizada');

    res.json({ success: true, data: config, message: 'Configuración actualizada exitosamente' });
  } catch (error) {
    console.error('Error actualizando configuración del negocio:', error);
    res.status(500).json({ success: false, error: 'Error actualizando configuración' });
  }
});


/**
 * Endpoint para enviar mensajes a un usuario de WhatsApp desde el dashboard.
 * Requiere 'to' (número de WhatsApp) y 'text' (contenido del mensaje) en el body.
 */
app.post('/api/send-message', async (req, res) => {
  const { to, text } = req.body;

  if (!to || !text) {
    return res.status(400).json({ error: "Faltan parámetros: 'to' y 'text' son requeridos." });
  }

  try {
    await sendTextMessage(to, text);
    res.json({ success: true, message: 'Mensaje enviado exitosamente.' });
  } catch (error) {
    console.error('Error al enviar mensaje desde el dashboard:', error);
    res.status(500).json({ error: 'Error al enviar el mensaje.' });
  }
});

// Endpoint para obtener todos los estados de Redis
app.get('/api/redis-states', async (req, res) => {
  try {
    // Obtener todas las claves de Redis. CUIDADO: KEYS * puede ser lento en bases de datos grandes.
    const keys = await redisClient.keys('*');
    const states = [];

    for (const key of keys) {
      // Excluir la clave de modo de mantenimiento y otras claves internas si es necesario
      if (key === MAINTENANCE_MODE_KEY) continue;
      
      const value = await redisClient.get(key);
      try {
        states.push({ key: key, state: JSON.parse(value) });
      } catch (parseError) {
        // Si no es JSON, lo devolvemos como texto plano
        states.push({ key: key, state: value });
      }
    }
    res.json(states);
  } catch (error) {
    console.error('Error al obtener estados de Redis:', error);
    res.status(500).json({ error: 'Error al obtener estados de Redis.' });
  }
});

// Endpoint para eliminar un estado de Redis por clave
app.delete('/api/redis-states/:key', async (req, res) => {
  const { key } = req.params;
  try {
    const result = await redisClient.del(key);
    if (result === 1) {
      res.json({ success: true, message: `Estado para la clave ${key} eliminado.` });
    } else {
      res.status(404).json({ error: `Clave ${key} no encontrada.` });
    }
  } catch (error) {
    console.error(`Error al eliminar estado para la clave ${key}:`, error);
    res.status(500).json({ error: 'Error al eliminar estado de Redis.' });
  }
});

// === SISTEMA DE MONITOREO ===

// Inicialización del sistema de monitoreo
async function initializeMonitoring() {
    try {
        console.log('🚀 Inicializando sistema de monitoreo...');

        // Inicializar MetricsCollector
        metricsCollector = new MetricsCollector(redisClient, {
            webhookUrl: N8N_WEBHOOK_URL,
            whatsappToken: WHATSAPP_TOKEN,
            phoneNumberId: PHONE_NUMBER_ID,
            whatsappApiVersion: WHATSAPP_API_VERSION,
            maintenanceModeKey: MAINTENANCE_MODE_KEY
        });

        // Inicializar HealthChecker
        healthChecker = new HealthChecker(metricsCollector, {
            checkInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
            cpuThreshold: parseInt(process.env.CPU_THRESHOLD) || 80,
            memoryThreshold: parseInt(process.env.MEMORY_THRESHOLD) || 85,
            responseTimeThreshold: parseInt(process.env.RESPONSE_TIME_THRESHOLD) || 5000,
            errorRateThreshold: parseFloat(process.env.ERROR_RATE_THRESHOLD) || 0.05,
            telegramToken: process.env.TELEGRAM_BOT_TOKEN,
            telegramChatId: process.env.TELEGRAM_CHAT_ID
        });

        // Inicializar WebSocket Server usando el servidor HTTP principal con manejo de errores
        try {
            wsServer = new MonitoringWebSocketServer(metricsCollector, healthChecker, server);
        } catch (wsError) {
            console.error('❌ Error inicializando WebSocket server:', wsError);
            // Continuar sin WebSocket si hay problemas
        }

        // Inicializar Monitor de Memoria para entorno de 512MB
        try {
            memoryMonitor = new MemoryMonitor(redisClient, 80, 90); // Umbrales más bajos para 512MB
            console.log('✅ Monitor de memoria inicializado para entorno de 512MB');
        } catch (memError) {
            console.error('❌ Error inicializando monitor de memoria:', memError);
        }

        console.log('✅ Sistema de monitoreo inicializado exitosamente');

        // Programar tareas de mantenimiento
        scheduleMaintenanceTasks();

    } catch (error) {
        console.error('❌ Error inicializando sistema de monitoreo:', error);
    }
}

// === INICIALIZACIÓN DEL SISTEMA DE SEGURIDAD ===
async function initializeSecurity_system() {
    try {
        console.log('🛡️ Inicializando sistema de seguridad...');

        // Configuración del sistema de seguridad
        const securityConfig = {
            backup: {
                enabled: process.env.ENABLE_AUTO_BACKUP !== 'false', // true por defecto
                schedule: process.env.BACKUP_SCHEDULE || '0 */6 * * *', // Cada 6 horas
                retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 7,
                maxBackups: parseInt(process.env.MAX_BACKUPS) || 30
            },
            monitor: {
                maxFailedLogins: parseInt(process.env.MAX_FAILED_LOGINS) || 5,
                suspiciousActivityThreshold: parseInt(process.env.SUSPICIOUS_ACTIVITY_THRESHOLD) || 10,
                ddosThreshold: parseInt(process.env.DDOS_THRESHOLD) || 100,
                checkInterval: parseInt(process.env.SECURITY_CHECK_INTERVAL) || 60000, // 1 minuto
                retentionHours: parseInt(process.env.SECURITY_LOG_RETENTION_HOURS) || 24
            }
        };

        // Inicializar sistema de seguridad completo
        security = initializeSecurity(redisClient, securityConfig);

        // Configurar listeners de eventos de seguridad
        security.securityMonitor.on('alert', async (alert) => {
            console.log(`🚨 ALERTA DE SEGURIDAD [${alert.severity.toUpperCase()}]: ${alert.type}`);
            console.log('   Datos:', JSON.stringify(alert.data, null, 2));

            // Notificar a admins en caso de alertas críticas
            if (alert.severity === 'critical' && ADMIN_WHATSAPP_NUMBERS) {
                const adminNumbers = ADMIN_WHATSAPP_NUMBERS.split(',');
                const alertMessage = `🚨 *ALERTA DE SEGURIDAD CRÍTICA*\n\n` +
                    `Tipo: ${alert.type}\n` +
                    `Severidad: ${alert.severity}\n` +
                    `Datos: ${JSON.stringify(alert.data, null, 2)}\n` +
                    `Timestamp: ${new Date(alert.timestamp).toLocaleString()}`;

                for (const admin of adminNumbers) {
                    try {
                        await sendTextMessage(admin.trim(), alertMessage);
                    } catch (error) {
                        console.error(`Error notificando alerta a admin ${admin}:`, error);
                    }
                }
            }

            // Registrar en métricas si está disponible
            if (metricsCollector) {
                try {
                    await metricsCollector.setMetricInRedis(
                        `security:alert:${alert.severity}`,
                        Date.now(),
                        3600 // 1 hora
                    );
                } catch (error) {
                    console.error('Error registrando alerta en métricas:', error);
                }
            }
        });

        security.securityMonitor.on('userBlocked', async ({ userId, duration }) => {
            console.log(`🚫 Usuario bloqueado automáticamente: ${userId} por ${duration}s`);

            // Notificar a admins
            if (ADMIN_WHATSAPP_NUMBERS) {
                const adminNumbers = ADMIN_WHATSAPP_NUMBERS.split(',');
                const message = `🚫 *Usuario Bloqueado*\n\n` +
                    `Usuario: ${userId}\n` +
                    `Duración: ${duration}s (${Math.round(duration / 60)} minutos)\n` +
                    `Razón: Comportamiento anómalo detectado automáticamente`;

                for (const admin of adminNumbers) {
                    try {
                        await sendTextMessage(admin.trim(), message);
                    } catch (error) {
                        console.error(`Error notificando bloqueo a admin ${admin}:`, error);
                    }
                }
            }
        });

        security.securityMonitor.on('userUnblocked', ({ userId }) => {
            console.log(`✅ Usuario desbloqueado: ${userId}`);
        });

        console.log('✅ Sistema de seguridad inicializado exitosamente');
        console.log(`   🔒 Rate limiting: Activo`);
        console.log(`   ✅ Validación de inputs: Activa`);
        console.log(`   💾 Backups automáticos: ${securityConfig.backup.enabled ? 'Habilitados' : 'Deshabilitados'}`);
        console.log(`   🚨 Monitoreo 24/7: Activo`);

    } catch (error) {
        console.error('❌ Error inicializando sistema de seguridad:', error);
        throw error;
    }
}

// === INICIALIZACIÓN DEL SISTEMA DE CACHÉ GEMINI ===
/**
 * Inicializa el sistema de reacciones inteligente
 */
async function initializeReactionManager() {
    try {
        console.log('🎨 Inicializando sistema de reacciones inteligente...');

        reactionManager = new ReactionManager(
            WHATSAPP_TOKEN,
            PHONE_NUMBER_ID,
            WHATSAPP_API_VERSION
        );

        // Limpiar reacciones antiguas
        reactionManager.cleanOldReactions();

        // Programar limpieza automática cada 6 horas
        cron.schedule('0 */6 * * *', () => {
            console.log('🧹 Ejecutando limpieza programada de reacciones...');
            reactionManager.cleanOldReactions();
        });

        console.log('✅ Sistema de reacciones inicializado exitosamente');
        console.log('   🎯 Reacciones contextuales: Activas');
        console.log('   📊 Reacciones de métricas: Activas');
        console.log('   🔄 Reacciones progresivas: Activas');
        console.log('   🛡️ Reacciones de validación: Activas');

    } catch (error) {
        console.error('❌ Error inicializando sistema de reacciones:', error);
        // No bloquear el arranque del servidor
    }
}

async function initializeGeminiCache() {
    try {
        console.log('⚡ Inicializando sistema de caché Gemini...');

        const cacheConfig = {
            ttl: parseInt(process.env.GEMINI_CACHE_TTL) || 86400, // 24 horas por defecto
            maxKeys: parseInt(process.env.GEMINI_CACHE_MAX_KEYS) || 10000,
            enableNormalization: process.env.GEMINI_CACHE_NORMALIZATION !== 'false'
        };

        geminiCache = new GeminiCache(redisClient, cacheConfig);

        // Limpiar entradas antiguas si es necesario
        await geminiCache.cleanupOldEntries();

        // Obtener estadísticas iniciales
        const stats = await geminiCache.getStats();

        console.log('✅ Sistema de caché Gemini inicializado exitosamente');
        console.log(`   💾 TTL: ${cacheConfig.ttl}s (${Math.round(cacheConfig.ttl / 3600)}h)`);
        console.log(`   📦 Máx. entradas: ${cacheConfig.maxKeys}`);
        console.log(`   🔄 Normalización: ${cacheConfig.enableNormalization ? 'Activa' : 'Desactivada'}`);
        console.log(`   📊 Entradas actuales: ${stats.cacheSize}`);
        console.log(`   📈 Hit rate histórico: ${stats.hitRate}`);

    } catch (error) {
        console.error('❌ Error inicializando sistema de caché:', error);
        // No lanzar error, el sistema puede funcionar sin caché
    }
}

// Tareas de mantenimiento programadas
function scheduleMaintenanceTasks() {
    // Backup diario a las 3 AM
    cron.schedule(process.env.BACKUP_SCHEDULE || '0 3 * * *', async () => {
        try {
            console.log('🔄 Ejecutando backup diario...');
            await createSystemBackup();
        } catch (error) {
            console.error('❌ Error en backup diario:', error);
            if (metricsCollector) {
                metricsCollector.recordError('backup');
            }
        }
    });

    // Limpieza semanal los domingos a las 2 AM
    cron.schedule(process.env.CLEANUP_SCHEDULE || '0 2 * * 0', async () => {
        try {
            console.log('🧹 Ejecutando limpieza semanal...');
            await cleanupOldData();
        } catch (error) {
            console.error('❌ Error en limpieza:', error);
        }
    });

    // Limpieza de memoria cada 6 horas para optimización
    cron.schedule('0 */6 * * *', async () => {
        try {
            console.log('🧹 Ejecutando limpieza de memoria...');
            if (metricsCollector) {
                await metricsCollector.cleanupMemoryMetrics();
            }

            // Forzar garbage collection si está disponible
            if (global.gc) {
                global.gc();
                console.log('♻️ Garbage collection ejecutado');
            }
        } catch (error) {
            console.error('❌ Error en limpieza de memoria:', error);
        }
    });
}

// Crear backup del sistema
async function createSystemBackup() {
    try {
        const backupData = {
            timestamp: new Date().toISOString(),
            version: require('./package.json').version,

            // Estados de usuarios activos
            userStates: await getAllUserStates(),

            // Configuración del bot
            configuration: {
                adminNumbers: ADMIN_WHATSAPP_NUMBERS.split(','),
                maintenanceMode: await redisClient.get(MAINTENANCE_MODE_KEY),
                phoneNumberId: PHONE_NUMBER_ID
            },

            // Métricas del sistema
            systemMetrics: metricsCollector ? await metricsCollector.getSystemMetrics() : null,

            // Estado de salud
            healthStatus: healthChecker ? await healthChecker.performHealthCheck() : null
        };

        // Guardar en Redis como backup
        await redisClient.setEx('system:backup:latest', 604800, JSON.stringify(backupData)); // 7 días

        console.log('✅ Backup del sistema creado exitosamente');
        return backupData;

    } catch (error) {
        console.error('❌ Error creando backup:', error);
        throw error;
    }
}

// Obtener todos los estados de usuario
async function getAllUserStates() {
    try {
        const keys = await redisClient.keys('*');
        const userStates = {};

        for (const key of keys) {
            if (key.match(/^\d+$/)) { // Solo claves que son números (estados de usuario)
                const state = await redisClient.get(key);
                if (state) {
                    userStates[key] = JSON.parse(state);
                }
            }
        }

        return userStates;
    } catch (error) {
        console.error('Error obteniendo estados de usuario:', error);
        return {};
    }
}

// Limpiar datos antiguos
async function cleanupOldData() {
    try {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const keys = await redisClient.keys('metrics:*');
        let cleanedCount = 0;

        for (const key of keys) {
            const ttl = await redisClient.ttl(key);
            if (ttl < 0) {
                const keyData = await redisClient.get(key);
                if (keyData) {
                    const data = JSON.parse(keyData);
                    if (data.timestamp && new Date(data.timestamp).getTime() < thirtyDaysAgo) {
                        await redisClient.del(key);
                        cleanedCount++;
                    }
                }
            }
        }

        console.log(`🧹 Limpieza completada: ${cleanedCount} métricas antiguas eliminadas`);

    } catch (error) {
        console.error('❌ Error en limpieza:', error);
    }
}

// === ENDPOINTS DE MONITOREO ===

// Endpoint para métricas
app.get('/api/metrics', async (req, res) => {
    try {
        if (!metricsCollector) {
            return res.status(503).json({ error: 'Sistema de monitoreo no disponible' });
        }
        const metrics = await metricsCollector.getSystemMetrics();
        res.json(metrics);
    } catch (error) {
        console.error('Error obteniendo métricas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para estado de salud
app.get('/api/health', async (req, res) => {
    try {
        if (!healthChecker) {
            return res.status(503).json({ error: 'Health checker no disponible' });
        }
        const health = await healthChecker.performHealthCheck();
        res.json(health);
    } catch (error) {
        console.error('Error obteniendo estado de salud:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// === ENDPOINTS PARA DASHBOARD NEXT ===

// Endpoint para métricas del dashboard
app.get('/api/metrics/dashboard', async (req, res) => {
    try {
        if (!metricsCollector) {
            return res.status(503).json({ success: false, error: 'Sistema de monitoreo no disponible' });
        }

        const metrics = await metricsCollector.getSystemMetrics();

        // Transformar métricas al formato esperado por el dashboard
        const dashboardMetrics = {
            orders: {
                today: metrics.conversations?.total || 0,
                total: metrics.conversations?.total || 0,
                trend: { value: 0, isPositive: true }
            },
            revenue: {
                today: 0, // Calcular desde order_log.jsonl
                total: 0, // Calcular desde order_log.jsonl
                trend: { value: 0, isPositive: true }
            },
            gemini: {
                calls_today: metrics.gemini?.totalRequests || 0,
                total_calls: metrics.gemini?.totalRequests || 0,
                cache_hit_rate: metrics.gemini?.cacheHitRate || 0,
                trend: { value: 0, isPositive: true }
            },
            cache: {
                hit_rate: metrics.gemini?.cacheHitRate || 0,
                trend: { value: 0, isPositive: true }
            },
            users: {
                active: metrics.system?.activeConnections || 0,
                trend: { value: 0, isPositive: true }
            }
        };

        res.json({ success: true, data: dashboardMetrics });
    } catch (error) {
        console.error('Error obteniendo métricas del dashboard:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Endpoint para gráfico de ventas
app.get('/api/metrics/sales-chart', async (req, res) => {
    try {
        const range = req.query.range || 'daily';

        // Retornar estructura esperada por el componente SalesAnalysisChart
        // Formato: {daily: [{date, value, orders}]}
        res.json({
            success: true,
            data: {
                daily: [], // Array de objetos con {date, value, orders}
                weekly: [],
                monthly: []
            }
        });
    } catch (error) {
        console.error('Error obteniendo gráfico de ventas:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Endpoint para ingresos por producto
app.get('/api/metrics/revenue-by-product', async (req, res) => {
    try {
        // Leer order_log.jsonl y agrupar por producto
        // Por ahora retornar datos de ejemplo

        res.json({
            success: true,
            data: []
        });
    } catch (error) {
        console.error('Error obteniendo ingresos por producto:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Endpoint para uso de Gemini
app.get('/api/metrics/gemini-usage', async (req, res) => {
    try {
        if (!geminiCache) {
            return res.status(503).json({ success: false, error: 'Sistema de caché no disponible' });
        }

        const stats = await geminiCache.getStats();

        res.json({
            success: true,
            data: {
                totalRequests: stats.totalRequests || 0,
                cacheHits: stats.cacheHits || 0,
                cacheMisses: stats.cacheMisses || 0,
                cacheHitRate: stats.hitRate || 0,
                avgResponseTime: stats.avgResponseTime || 0
            }
        });
    } catch (error) {
        console.error('Error obteniendo uso de Gemini:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Endpoint para dashboard de monitoreo
app.get('/monitoring', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard', 'monitoring.html'));
});

// Endpoint para backup manual
app.post('/api/backup', async (req, res) => {
    try {
        const backup = await createSystemBackup();
        res.json({
            success: true,
            message: 'Backup creado exitosamente',
            timestamp: backup.timestamp
        });
    } catch (error) {
        console.error('Error creando backup:', error);
        res.status(500).json({ error: 'Error creando backup' });
    }
});

// Endpoint para reporte de memoria específico
app.get('/api/memory-report', (req, res) => {
    try {
        if (!memoryMonitor) {
            return res.status(503).json({ error: 'Monitor de memoria no disponible' });
        }

        const report = memoryMonitor.getMemoryReport();
        res.json({
            success: true,
            data: report,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error obteniendo reporte de memoria:', error);
        res.status(500).json({ error: 'Error obteniendo reporte de memoria' });
    }
});

// Redis está listo
redisClient.on('ready', () => {
    console.log('🎯 Redis conectado y listo');
});

// Manejo de cierre limpio
process.on('SIGINT', async () => {
    console.log('\n🔄 Cerrando sistema...');

    try {
        if (metricsCollector) {
            await createSystemBackup();
        }

        if (wsServer) {
            wsServer.close();
        }

        console.log('✅ Sistema cerrado limpiamente');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error en cierre:', error);
        process.exit(1);
    }
});

// Crear servidor HTTP para integrar WebSocket
const http = require('http');
const server = http.createServer(app);

// Inicializar monitoreo después de crear el servidor
server.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);

  // Inicializar sistema de monitoreo con manejo de errores
  setTimeout(async () => {
    try {
      await initializeMonitoring();
      console.log('✅ Sistema de monitoreo inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando monitoreo (continuando sin monitoreo):', error);
      // El chatbot continuará funcionando sin monitoreo
    }

    // Inicializar sistema de seguridad
    try {
      await initializeSecurity_system();
      console.log('✅ Sistema de seguridad inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando sistema de seguridad (continuando sin seguridad):', error);
      // El chatbot continuará funcionando sin protecciones adicionales
    }

    // Inicializar sistema de caché Gemini
    try {
      await initializeGeminiCache();
      console.log('✅ Sistema de caché Gemini inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando sistema de caché (continuando sin caché):', error);
      // El chatbot continuará funcionando sin caché
    }

    // Inicializar sistema de reacciones inteligente
    try {
      await initializeReactionManager();
      console.log('✅ Sistema de reacciones inteligente inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando sistema de reacciones (continuando sin reacciones avanzadas):', error);
      // El chatbot continuará funcionando con reacciones básicas
    }
  }, 2000); // Esperar 2 segundos para asegurar que todo esté listo
});