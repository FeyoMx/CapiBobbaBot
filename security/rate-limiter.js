// security/rate-limiter.js
// Sistema de rate limiting por usuario para prevenir spam y abuso

const redis = require('redis');

class RateLimiter {
    constructor(redisClient) {
        this.redisClient = redisClient;

        // Configuración de límites
        this.limits = {
            messages: {
                maxPerMinute: 10,        // Máximo 10 mensajes por minuto
                maxPerHour: 100,         // Máximo 100 mensajes por hora
                maxPerDay: 500           // Máximo 500 mensajes por día
            },
            orders: {
                maxPerHour: 3,           // Máximo 3 pedidos por hora
                maxPerDay: 10            // Máximo 10 pedidos por día
            },
            apiCalls: {
                maxPerMinute: 20,        // Máximo 20 llamadas API por minuto
                maxPerHour: 200          // Máximo 200 llamadas API por hora
            }
        };
    }

    /**
     * Verifica si un usuario ha excedido el límite de mensajes
     * @param {string} phoneNumber - Número de teléfono del usuario
     * @returns {Promise<{allowed: boolean, remaining: number, resetIn: number}>}
     */
    async checkMessageLimit(phoneNumber) {
        return this._checkLimit(phoneNumber, 'messages', 'minute');
    }

    /**
     * Verifica si un usuario ha excedido el límite de pedidos
     * @param {string} phoneNumber - Número de teléfono del usuario
     * @returns {Promise<{allowed: boolean, remaining: number, resetIn: number}>}
     */
    async checkOrderLimit(phoneNumber) {
        return this._checkLimit(phoneNumber, 'orders', 'hour');
    }

    /**
     * Verifica si se ha excedido el límite de llamadas API
     * @param {string} identifier - Identificador de la API (ej: 'gemini', 'whatsapp')
     * @returns {Promise<{allowed: boolean, remaining: number, resetIn: number}>}
     */
    async checkApiLimit(identifier) {
        return this._checkLimit(identifier, 'apiCalls', 'minute');
    }

    /**
     * Implementación genérica de rate limiting
     * @private
     */
    async _checkLimit(identifier, limitType, window) {
        const now = Date.now();
        const key = `rate_limit:${limitType}:${window}:${identifier}`;

        let windowMs, maxRequests;

        // Determinar ventana de tiempo y límite
        switch (window) {
            case 'minute':
                windowMs = 60 * 1000;
                maxRequests = this.limits[limitType].maxPerMinute;
                break;
            case 'hour':
                windowMs = 60 * 60 * 1000;
                maxRequests = this.limits[limitType].maxPerHour;
                break;
            case 'day':
                windowMs = 24 * 60 * 60 * 1000;
                maxRequests = this.limits[limitType].maxPerDay;
                break;
            default:
                throw new Error(`Window inválida: ${window}`);
        }

        try {
            // Obtener el contador actual
            const currentCount = await this.redisClient.get(key);
            const count = currentCount ? parseInt(currentCount) : 0;

            if (count >= maxRequests) {
                // Límite excedido
                const ttl = await this.redisClient.ttl(key);
                return {
                    allowed: false,
                    remaining: 0,
                    resetIn: ttl > 0 ? ttl : windowMs / 1000,
                    limit: maxRequests
                };
            }

            // Incrementar contador
            await this.redisClient.incr(key);

            // Establecer expiración si es la primera vez
            if (count === 0) {
                await this.redisClient.expire(key, Math.ceil(windowMs / 1000));
            }

            return {
                allowed: true,
                remaining: maxRequests - (count + 1),
                resetIn: windowMs / 1000,
                limit: maxRequests
            };
        } catch (error) {
            console.error('❌ Error en rate limiter:', error);
            // En caso de error, permitir la petición (fail-open)
            return { allowed: true, remaining: maxRequests, resetIn: windowMs / 1000 };
        }
    }

    /**
     * Verifica múltiples límites a la vez
     * @param {string} phoneNumber - Número de teléfono del usuario
     * @returns {Promise<{allowed: boolean, reason: string}>}
     */
    async checkAllLimits(phoneNumber) {
        // Verificar límites en paralelo
        const [minuteLimit, hourLimit, dayLimit] = await Promise.all([
            this._checkLimit(phoneNumber, 'messages', 'minute'),
            this._checkLimit(phoneNumber, 'messages', 'hour'),
            this._checkLimit(phoneNumber, 'messages', 'day')
        ]);

        if (!minuteLimit.allowed) {
            return {
                allowed: false,
                reason: `Límite de mensajes por minuto excedido. Por favor espera ${minuteLimit.resetIn}s.`,
                resetIn: minuteLimit.resetIn
            };
        }

        if (!hourLimit.allowed) {
            return {
                allowed: false,
                reason: `Límite de mensajes por hora excedido. Por favor espera ${Math.ceil(hourLimit.resetIn / 60)} minutos.`,
                resetIn: hourLimit.resetIn
            };
        }

        if (!dayLimit.allowed) {
            return {
                allowed: false,
                reason: `Límite diario de mensajes excedido. Por favor intenta mañana.`,
                resetIn: dayLimit.resetIn
            };
        }

        return { allowed: true, remaining: minuteLimit.remaining };
    }

    /**
     * Resetea los límites de un usuario (útil para admins)
     * @param {string} phoneNumber - Número de teléfono del usuario
     */
    async resetUserLimits(phoneNumber) {
        const patterns = [
            `rate_limit:messages:minute:${phoneNumber}`,
            `rate_limit:messages:hour:${phoneNumber}`,
            `rate_limit:messages:day:${phoneNumber}`,
            `rate_limit:orders:hour:${phoneNumber}`,
            `rate_limit:orders:day:${phoneNumber}`
        ];

        for (const pattern of patterns) {
            await this.redisClient.del(pattern);
        }

        console.log(`✅ Límites reseteados para ${phoneNumber}`);
    }

    /**
     * Obtiene estadísticas de uso de un usuario
     * @param {string} phoneNumber - Número de teléfono del usuario
     * @returns {Promise<Object>} Estadísticas de uso
     */
    async getUserStats(phoneNumber) {
        const stats = {
            messages: {},
            orders: {}
        };

        // Obtener contadores de mensajes
        const msgMinKey = `rate_limit:messages:minute:${phoneNumber}`;
        const msgHourKey = `rate_limit:messages:hour:${phoneNumber}`;
        const msgDayKey = `rate_limit:messages:day:${phoneNumber}`;

        const [msgMin, msgHour, msgDay] = await Promise.all([
            this.redisClient.get(msgMinKey),
            this.redisClient.get(msgHourKey),
            this.redisClient.get(msgDayKey)
        ]);

        stats.messages = {
            lastMinute: msgMin ? parseInt(msgMin) : 0,
            lastHour: msgHour ? parseInt(msgHour) : 0,
            lastDay: msgDay ? parseInt(msgDay) : 0
        };

        // Obtener contadores de pedidos
        const orderHourKey = `rate_limit:orders:hour:${phoneNumber}`;
        const orderDayKey = `rate_limit:orders:day:${phoneNumber}`;

        const [orderHour, orderDay] = await Promise.all([
            this.redisClient.get(orderHourKey),
            this.redisClient.get(orderDayKey)
        ]);

        stats.orders = {
            lastHour: orderHour ? parseInt(orderHour) : 0,
            lastDay: orderDay ? parseInt(orderDay) : 0
        };

        return stats;
    }
}

module.exports = RateLimiter;