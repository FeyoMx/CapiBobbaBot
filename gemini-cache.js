// gemini-cache.js
// Sistema de caché inteligente para respuestas de Gemini AI

const crypto = require('crypto');

class GeminiCache {
    constructor(redisClient, options = {}) {
        this.redis = redisClient;
        this.config = {
            // TTL por defecto: 24 horas
            ttl: options.ttl || 86400,

            // Prefijo para las claves de caché
            prefix: options.prefix || 'gemini:cache:',

            // Prefijo para métricas
            metricsPrefix: options.metricsPrefix || 'gemini:metrics:',

            // Habilitar normalización de texto
            enableNormalization: options.enableNormalization !== false,

            // Máximo de claves en caché
            maxKeys: options.maxKeys || 10000
        };

        this.stats = {
            hits: 0,
            misses: 0,
            saves: 0
        };
    }

    /**
     * Normaliza un mensaje para mejorar el cache hit rate
     * @param {string} message - Mensaje del usuario
     * @returns {string} - Mensaje normalizado
     */
    normalizeMessage(message) {
        if (!this.config.enableNormalization) {
            return message;
        }

        return message
            .toLowerCase()
            .trim()
            // Remover signos de puntuación
            .replace(/[¿?¡!.,;:]/g, '')
            // Remover espacios múltiples
            .replace(/\s+/g, ' ')
            // Remover artículos comunes que no cambian el significado
            .replace(/\b(el|la|los|las|un|una|unos|unas)\b/g, '')
            .trim();
    }

    /**
     * Genera una clave de caché única basada en el mensaje
     * @param {string} message - Mensaje del usuario
     * @returns {string} - Clave de caché
     */
    getCacheKey(message) {
        const normalized = this.normalizeMessage(message);
        const hash = crypto.createHash('md5').update(normalized).digest('hex');
        return `${this.config.prefix}${hash}`;
    }

    /**
     * Obtiene una respuesta desde la caché
     * @param {string} message - Mensaje del usuario
     * @returns {Promise<object|null>} - Respuesta cacheada o null
     */
    async get(message) {
        try {
            const key = this.getCacheKey(message);
            const cached = await this.redis.get(key);

            if (cached) {
                this.stats.hits++;
                await this.incrementMetric('hits');

                const data = JSON.parse(cached);
                console.log(`✅ Cache HIT - Respuesta instantánea (${message.substring(0, 30)}...)`);

                return {
                    response: data.response,
                    cached: true,
                    cachedAt: data.cachedAt,
                    originalMessage: data.originalMessage
                };
            }

            this.stats.misses++;
            await this.incrementMetric('misses');
            console.log(`❌ Cache MISS - Llamando a Gemini (${message.substring(0, 30)}...)`);

            return null;
        } catch (error) {
            console.error('Error obteniendo desde caché:', error);
            return null;
        }
    }

    /**
     * Guarda una respuesta en la caché
     * @param {string} message - Mensaje del usuario
     * @param {string} response - Respuesta de Gemini
     * @param {object} metadata - Metadata adicional
     */
    async set(message, response, metadata = {}) {
        try {
            const key = this.getCacheKey(message);
            const data = {
                response,
                originalMessage: message,
                normalizedMessage: this.normalizeMessage(message),
                cachedAt: Date.now(),
                metadata
            };

            await this.redis.setEx(
                key,
                this.config.ttl,
                JSON.stringify(data)
            );

            this.stats.saves++;
            await this.incrementMetric('saves');

            console.log(`💾 Respuesta guardada en caché (TTL: ${this.config.ttl}s)`);
        } catch (error) {
            console.error('Error guardando en caché:', error);
        }
    }

    /**
     * Invalida (elimina) una entrada de caché específica
     * @param {string} message - Mensaje a invalidar
     */
    async invalidate(message) {
        try {
            const key = this.getCacheKey(message);
            const deleted = await this.redis.del(key);

            if (deleted) {
                console.log(`🗑️ Caché invalidado para: ${message.substring(0, 30)}...`);
            }

            return deleted > 0;
        } catch (error) {
            console.error('Error invalidando caché:', error);
            return false;
        }
    }

    /**
     * Limpia toda la caché de Gemini
     */
    async clear() {
        try {
            const pattern = `${this.config.prefix}*`;
            const keys = await this.redis.keys(pattern);

            if (keys.length > 0) {
                await this.redis.del(keys);
                console.log(`🧹 Limpieza completa: ${keys.length} entradas eliminadas`);
            }

            return keys.length;
        } catch (error) {
            console.error('Error limpiando caché:', error);
            return 0;
        }
    }

    /**
     * Incrementa un contador de métricas
     * @param {string} metric - Nombre de la métrica (hits, misses, saves)
     */
    async incrementMetric(metric) {
        try {
            const key = `${this.config.metricsPrefix}${metric}`;
            await this.redis.incr(key);
            // Expirar métricas después de 7 días
            await this.redis.expire(key, 604800);
        } catch (error) {
            console.error('Error incrementando métrica:', error);
        }
    }

    /**
     * Obtiene estadísticas de uso de la caché
     * @returns {Promise<object>} - Estadísticas de caché
     */
    async getStats() {
        try {
            const hits = parseInt(await this.redis.get(`${this.config.metricsPrefix}hits`) || '0');
            const misses = parseInt(await this.redis.get(`${this.config.metricsPrefix}misses`) || '0');
            const saves = parseInt(await this.redis.get(`${this.config.metricsPrefix}saves`) || '0');

            const total = hits + misses;
            const hitRate = total > 0 ? ((hits / total) * 100).toFixed(2) : 0;

            // Obtener tamaño de caché
            const pattern = `${this.config.prefix}*`;
            const keys = await this.redis.keys(pattern);
            const cacheSize = keys.length;

            return {
                hits,
                misses,
                saves,
                total,
                hitRate: `${hitRate}%`,
                cacheSize,
                maxKeys: this.config.maxKeys,
                ttl: this.config.ttl,
                efficiency: hitRate >= 70 ? 'Excelente' : hitRate >= 50 ? 'Buena' : hitRate >= 30 ? 'Regular' : 'Baja'
            };
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            return null;
        }
    }

    /**
     * Obtiene las entradas más populares de la caché
     * @param {number} limit - Número de entradas a retornar
     * @returns {Promise<Array>} - Array de entradas populares
     */
    async getPopularEntries(limit = 10) {
        try {
            const pattern = `${this.config.prefix}*`;
            const keys = await this.redis.keys(pattern);

            const entries = [];

            for (const key of keys.slice(0, limit)) {
                const data = await this.redis.get(key);
                if (data) {
                    const parsed = JSON.parse(data);
                    const ttl = await this.redis.ttl(key);

                    entries.push({
                        message: parsed.originalMessage,
                        normalized: parsed.normalizedMessage,
                        cachedAt: new Date(parsed.cachedAt).toISOString(),
                        ttl: `${ttl}s`,
                        response: parsed.response.substring(0, 100) + '...'
                    });
                }
            }

            return entries.sort((a, b) =>
                new Date(b.cachedAt) - new Date(a.cachedAt)
            );
        } catch (error) {
            console.error('Error obteniendo entradas populares:', error);
            return [];
        }
    }

    /**
     * Limpia entradas antiguas si se excede el límite máximo
     */
    async cleanupOldEntries() {
        try {
            const pattern = `${this.config.prefix}*`;
            const keys = await this.redis.keys(pattern);

            if (keys.length > this.config.maxKeys) {
                const excess = keys.length - this.config.maxKeys;

                // Obtener todas las entradas con su timestamp
                const entries = [];
                for (const key of keys) {
                    const data = await this.redis.get(key);
                    if (data) {
                        const parsed = JSON.parse(data);
                        entries.push({ key, cachedAt: parsed.cachedAt });
                    }
                }

                // Ordenar por más antiguas primero
                entries.sort((a, b) => a.cachedAt - b.cachedAt);

                // Eliminar las más antiguas
                const toDelete = entries.slice(0, excess).map(e => e.key);
                if (toDelete.length > 0) {
                    await this.redis.del(toDelete);
                    console.log(`🧹 Limpieza automática: ${toDelete.length} entradas antiguas eliminadas`);
                }
            }
        } catch (error) {
            console.error('Error en limpieza automática:', error);
        }
    }
}

module.exports = GeminiCache;
