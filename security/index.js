// security/index.js
// Módulo principal de seguridad - Exporta todos los componentes

const RateLimiter = require('./rate-limiter');
const InputValidator = require('./input-validator');
const RedisBackup = require('./redis-backup');
const SecurityMonitor = require('./security-monitor');

/**
 * Inicializa el sistema de seguridad completo
 * @param {Object} redisClient - Cliente de Redis
 * @param {Object} options - Opciones de configuración
 * @returns {Object} Instancias de todos los módulos de seguridad
 */
function initializeSecurity(redisClient, options = {}) {
    console.log('🛡️ Inicializando sistema de seguridad...');

    // Inicializar componentes
    const rateLimiter = new RateLimiter(redisClient);
    const inputValidator = new InputValidator();
    const securityMonitor = new SecurityMonitor(redisClient, options.monitor);

    // Configurar backup automático
    const backupConfig = {
        enabled: options.backup?.enabled !== false,
        schedule: options.backup?.schedule || '0 */6 * * *', // Cada 6 horas
        retentionDays: options.backup?.retentionDays || 7,
        ...options.backup
    };

    const redisBackup = new RedisBackup(redisClient, backupConfig);

    // Iniciar servicios automáticos
    if (backupConfig.enabled) {
        redisBackup.start().catch(err => {
            console.error('❌ Error iniciando sistema de backups:', err);
        });
    }

    securityMonitor.start();

    // Configurar listeners de eventos de seguridad
    securityMonitor.on('alert', (alert) => {
        console.log(`🚨 ALERTA DE SEGURIDAD [${alert.severity.toUpperCase()}]:`, alert.type);
        console.log('   Datos:', JSON.stringify(alert.data, null, 2));
    });

    securityMonitor.on('userBlocked', ({ userId, duration }) => {
        console.log(`🚫 Usuario bloqueado automáticamente: ${userId} por ${duration}s`);
    });

    console.log('✅ Sistema de seguridad iniciado correctamente');

    return {
        rateLimiter,
        inputValidator,
        redisBackup,
        securityMonitor
    };
}

/**
 * Middleware de Express para validación de mensajes entrantes
 */
function securityMiddleware(security) {
    return async (req, res, next) => {
        try {
            const body = req.body;

            // Validar estructura del mensaje
            if (body?.entry?.[0]?.changes?.[0]?.value?.messages) {
                const messages = body.entry[0].changes[0].value.messages;

                for (const message of messages) {
                    const phoneNumber = message.from;

                    // 1. Verificar si el usuario está bloqueado
                    const isBlocked = await security.securityMonitor.isUserBlocked(phoneNumber);
                    if (isBlocked) {
                        console.log(`🚫 Mensaje bloqueado de usuario: ${phoneNumber}`);
                        return res.status(403).json({ error: 'Usuario bloqueado temporalmente' });
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

                        return res.status(429).json({
                            error: rateLimitCheck.reason,
                            resetIn: rateLimitCheck.resetIn
                        });
                    }

                    // 3. Validar y sanitizar mensaje
                    const validation = security.inputValidator.validateWhatsAppMessage(message);
                    if (!validation.valid) {
                        console.log(`❌ Mensaje inválido de ${phoneNumber}:`, validation.errors);

                        // Registrar actividad sospechosa
                        await security.securityMonitor.logSecurityEvent('invalid_input', {
                            phoneNumber,
                            errors: validation.errors
                        });

                        return res.status(400).json({ error: 'Mensaje inválido' });
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

                    // Reemplazar mensaje con versión sanitizada
                    Object.assign(message, validation.sanitized);
                }
            }

            next();
        } catch (error) {
            console.error('❌ Error en middleware de seguridad:', error);
            // En caso de error, permitir que pase (fail-open)
            next();
        }
    };
}

/**
 * Función helper para validar inputs en el flujo del chatbot
 */
function validateInput(security, type, value) {
    const validator = security.inputValidator;

    switch (type) {
        case 'text':
            return validator.validateText(value);
        case 'phone':
            return validator.validatePhoneNumber(value);
        case 'address':
            return validator.validateAddress(value);
        case 'number':
            return validator.validateNumber(value);
        case 'order':
            return validator.validateOrderData(value);
        default:
            return { valid: false, errors: ['Tipo de validación desconocido'] };
    }
}

module.exports = {
    initializeSecurity,
    securityMiddleware,
    validateInput,
    RateLimiter,
    InputValidator,
    RedisBackup,
    SecurityMonitor
};