// security/security-monitor.js
// Sistema de monitoreo de seguridad 24/7 con alertas automáticas

const EventEmitter = require('events');

class SecurityMonitor extends EventEmitter {
    constructor(redisClient, options = {}) {
        super();

        this.redisClient = redisClient;
        this.config = {
            // Umbrales de seguridad
            maxFailedLogins: options.maxFailedLogins || 5,
            suspiciousActivityThreshold: options.suspiciousActivityThreshold || 10,
            ddosThreshold: options.ddosThreshold || 100, // requests por minuto
            anomalyScoreThreshold: options.anomalyScoreThreshold || 75,

            // Intervalos de monitoreo
            checkInterval: options.checkInterval || 60000, // 1 minuto
            cleanupInterval: options.cleanupInterval || 3600000, // 1 hora

            // Retención de logs
            retentionHours: options.retentionHours || 24
        };

        this.alerts = [];
        this.blockedUsers = new Set();
        this.monitoringInterval = null;
        this.cleanupInterval = null;
    }

    /**
     * Inicia el monitoreo de seguridad
     */
    start() {
        console.log('🛡️ Iniciando monitoreo de seguridad...');

        // Monitoreo continuo
        this.monitoringInterval = setInterval(async () => {
            await this.performSecurityCheck();
        }, this.config.checkInterval);

        // Limpieza periódica
        this.cleanupInterval = setInterval(async () => {
            await this.cleanupOldData();
        }, this.config.cleanupInterval);

        console.log('✅ Monitoreo de seguridad activo');
    }

    /**
     * Detiene el monitoreo
     */
    stop() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            console.log('⏹️ Monitoreo de seguridad detenido');
        }

        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }

    /**
     * Registra un evento de seguridad
     * @param {string} type - Tipo de evento (failed_login, suspicious_activity, etc.)
     * @param {Object} data - Datos del evento
     */
    async logSecurityEvent(type, data) {
        const event = {
            type,
            timestamp: Date.now(),
            data,
            severity: this._calculateSeverity(type, data)
        };

        const key = `security:events:${type}:${Date.now()}`;
        await this.redisClient.setEx(
            key,
            this.config.retentionHours * 3600,
            JSON.stringify(event)
        );

        // Incrementar contador
        const countKey = `security:count:${type}`;
        await this.redisClient.incr(countKey);
        await this.redisClient.expire(countKey, 3600); // 1 hora

        console.log(`🔒 Evento de seguridad registrado: ${type}`, data);

        // Emitir evento para procesamiento
        this.emit('securityEvent', event);

        // Verificar si requiere alerta inmediata
        if (event.severity === 'critical' || event.severity === 'high') {
            await this.createAlert(event);
        }
    }

    /**
     * Realiza verificación periódica de seguridad
     */
    async performSecurityCheck() {
        try {
            // 1. Verificar intentos de login fallidos
            await this.checkFailedLogins();

            // 2. Detectar patrones de DDoS
            await this.checkDDoSPatterns();

            // 3. Analizar actividad sospechosa
            await this.checkSuspiciousActivity();

            // 4. Verificar anomalías en el tráfico
            await this.checkTrafficAnomalies();

            // 5. Revisar usuarios bloqueados
            await this.checkBlockedUsers();
        } catch (error) {
            console.error('❌ Error en verificación de seguridad:', error);
        }
    }

    /**
     * Verifica intentos de login fallidos
     */
    async checkFailedLogins() {
        try {
            const pattern = 'security:failed_login:*';
            const keys = await this.redisClient.keys(pattern);

            const userAttempts = {};

            for (const key of keys) {
                const data = await this.redisClient.get(key);
                if (data) {
                    const event = JSON.parse(data);
                    const userId = event.data.userId || event.data.phoneNumber;

                    if (!userAttempts[userId]) {
                        userAttempts[userId] = 0;
                    }
                    userAttempts[userId]++;
                }
            }

            // Alertar sobre usuarios con múltiples intentos fallidos
            for (const [userId, attempts] of Object.entries(userAttempts)) {
                if (attempts >= this.config.maxFailedLogins) {
                    await this.createAlert({
                        type: 'failed_logins_exceeded',
                        severity: 'high',
                        data: { userId, attempts },
                        timestamp: Date.now()
                    });

                    // Bloquear usuario temporalmente
                    await this.blockUser(userId, 3600); // 1 hora
                }
            }
        } catch (error) {
            console.error('❌ Error verificando logins fallidos:', error);
        }
    }

    /**
     * Detecta patrones de ataque DDoS
     */
    async checkDDoSPatterns() {
        try {
            // Obtener contadores de requests por IP/usuario
            const pattern = 'rate_limit:messages:minute:*';
            const keys = await this.redisClient.keys(pattern);

            let highTrafficUsers = [];

            for (const key of keys) {
                const count = await this.redisClient.get(key);
                if (count && parseInt(count) > this.config.ddosThreshold) {
                    const userId = key.split(':').pop();
                    highTrafficUsers.push({ userId, count: parseInt(count) });
                }
            }

            if (highTrafficUsers.length > 0) {
                await this.createAlert({
                    type: 'possible_ddos',
                    severity: 'critical',
                    data: { users: highTrafficUsers },
                    timestamp: Date.now()
                });

                // Bloquear usuarios con tráfico anómalo
                for (const user of highTrafficUsers) {
                    await this.blockUser(user.userId, 7200); // 2 horas
                }
            }
        } catch (error) {
            console.error('❌ Error detectando DDoS:', error);
        }
    }

    /**
     * Analiza actividad sospechosa
     */
    async checkSuspiciousActivity() {
        try {
            const pattern = 'security:events:suspicious_*';
            const keys = await this.redisClient.keys(pattern);

            if (keys.length > this.config.suspiciousActivityThreshold) {
                await this.createAlert({
                    type: 'high_suspicious_activity',
                    severity: 'high',
                    data: { eventCount: keys.length },
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            console.error('❌ Error analizando actividad sospechosa:', error);
        }
    }

    /**
     * Verifica anomalías en el tráfico
     */
    async checkTrafficAnomalies() {
        try {
            // Obtener estadísticas de tráfico
            const messagesKey = 'metrics:messages_processed';
            const errorsKey = 'metrics:errors';

            const messages = parseInt(await this.redisClient.get(messagesKey) || '0');
            const errors = parseInt(await this.redisClient.get(errorsKey) || '0');

            // Calcular tasa de error
            if (messages > 0) {
                const errorRate = (errors / messages) * 100;

                if (errorRate > 10) {
                    await this.createAlert({
                        type: 'high_error_rate',
                        severity: 'high',
                        data: { errorRate: errorRate.toFixed(2), messages, errors },
                        timestamp: Date.now()
                    });
                }
            }
        } catch (error) {
            console.error('❌ Error verificando anomalías:', error);
        }
    }

    /**
     * Revisa usuarios bloqueados
     */
    async checkBlockedUsers() {
        try {
            const pattern = 'security:blocked:*';
            const keys = await this.redisClient.keys(pattern);

            console.log(`🔒 Usuarios bloqueados actualmente: ${keys.length}`);
        } catch (error) {
            console.error('❌ Error verificando usuarios bloqueados:', error);
        }
    }

    /**
     * Bloquea un usuario temporalmente
     * @param {string} userId - ID del usuario
     * @param {number} duration - Duración en segundos
     */
    async blockUser(userId, duration) {
        const key = `security:blocked:${userId}`;
        await this.redisClient.setEx(key, duration, JSON.stringify({
            blockedAt: Date.now(),
            expiresAt: Date.now() + (duration * 1000),
            reason: 'Automated security block'
        }));

        this.blockedUsers.add(userId);

        console.log(`🚫 Usuario bloqueado: ${userId} por ${duration}s`);

        this.emit('userBlocked', { userId, duration });
    }

    /**
     * Desbloquea un usuario manualmente
     * @param {string} userId - ID del usuario
     */
    async unblockUser(userId) {
        const key = `security:blocked:${userId}`;
        await this.redisClient.del(key);

        this.blockedUsers.delete(userId);

        console.log(`✅ Usuario desbloqueado: ${userId}`);

        this.emit('userUnblocked', { userId });
    }

    /**
     * Verifica si un usuario está bloqueado
     * @param {string} userId - ID del usuario
     */
    async isUserBlocked(userId) {
        const key = `security:blocked:${userId}`;
        const blocked = await this.redisClient.get(key);
        return blocked !== null;
    }

    /**
     * Crea una alerta de seguridad
     * @param {Object} alertData - Datos de la alerta
     */
    async createAlert(alertData) {
        const alert = {
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...alertData,
            createdAt: Date.now(),
            status: 'open'
        };

        this.alerts.push(alert);

        // Guardar en Redis
        const key = `security:alert:${alert.id}`;
        await this.redisClient.setEx(
            key,
            this.config.retentionHours * 3600,
            JSON.stringify(alert)
        );

        console.log(`🚨 ALERTA DE SEGURIDAD [${alert.severity.toUpperCase()}]:`, alert.type);

        // Emitir evento de alerta
        this.emit('alert', alert);

        return alert;
    }

    /**
     * Obtiene todas las alertas activas
     */
    async getActiveAlerts() {
        const pattern = 'security:alert:*';
        const keys = await this.redisClient.keys(pattern);

        const alerts = [];
        for (const key of keys) {
            const data = await this.redisClient.get(key);
            if (data) {
                const alert = JSON.parse(data);
                if (alert.status === 'open') {
                    alerts.push(alert);
                }
            }
        }

        return alerts.sort((a, b) => b.createdAt - a.createdAt);
    }

    /**
     * Obtiene estadísticas de seguridad
     */
    async getSecurityStats() {
        try {
            const stats = {
                alerts: {
                    total: this.alerts.length,
                    critical: this.alerts.filter(a => a.severity === 'critical').length,
                    high: this.alerts.filter(a => a.severity === 'high').length,
                    medium: this.alerts.filter(a => a.severity === 'medium').length,
                    low: this.alerts.filter(a => a.severity === 'low').length
                },
                blockedUsers: this.blockedUsers.size,
                events: {}
            };

            // Contar eventos por tipo
            const eventTypes = ['failed_login', 'suspicious_activity', 'invalid_input', 'rate_limit_exceeded'];

            for (const type of eventTypes) {
                const countKey = `security:count:${type}`;
                const count = await this.redisClient.get(countKey);
                stats.events[type] = count ? parseInt(count) : 0;
            }

            return stats;
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            return null;
        }
    }

    /**
     * Limpia datos antiguos
     */
    async cleanupOldData() {
        try {
            console.log('🧹 Limpiando datos de seguridad antiguos...');

            const patterns = [
                'security:events:*',
                'security:alert:*'
            ];

            let deleted = 0;
            for (const pattern of patterns) {
                const keys = await this.redisClient.keys(pattern);

                for (const key of keys) {
                    const ttl = await this.redisClient.ttl(key);
                    if (ttl === -1) {
                        // Clave sin expiración, eliminar si es antigua
                        await this.redisClient.del(key);
                        deleted++;
                    }
                }
            }

            console.log(`✅ Limpieza completada: ${deleted} claves eliminadas`);
        } catch (error) {
            console.error('❌ Error en limpieza:', error);
        }
    }

    /**
     * Calcula la severidad de un evento
     * @private
     */
    _calculateSeverity(type, data) {
        const severityMap = {
            failed_login: 'medium',
            suspicious_activity: 'high',
            invalid_input: 'medium',
            rate_limit_exceeded: 'medium',
            possible_ddos: 'critical',
            unauthorized_access: 'critical',
            data_breach_attempt: 'critical'
        };

        return severityMap[type] || 'low';
    }
}

module.exports = SecurityMonitor;