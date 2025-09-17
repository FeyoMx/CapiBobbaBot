// monitoring/metrics.js
const redis = require('redis');
const axios = require('axios');
const si = require('systeminformation');

class MetricsCollector {
    constructor(redisClient, config = {}) {
        this.redis = redisClient;
        this.config = {
            webhookUrl: config.webhookUrl || process.env.N8N_WEBHOOK_URL,
            whatsappToken: config.whatsappToken || process.env.WHATSAPP_TOKEN,
            phoneNumberId: config.phoneNumberId || process.env.PHONE_NUMBER_ID,
            whatsappApiVersion: config.whatsappApiVersion || process.env.WHATSAPP_API_VERSION || 'v18.0',
            maintenanceModeKey: config.maintenanceModeKey || 'maintenance_mode_status',
            metricsRetentionHours: config.metricsRetentionHours || 24
        };

        // Contadores en memoria para métricas rápidas
        this.counters = {
            messagesProcessed: 0,
            ordersReceived: 0,
            errorsEncountered: 0,
            webhookCalls: 0,
            telegramNotifications: 0
        };

        // Timestamps para calcular rates
        this.timestamps = {
            lastMetricReset: Date.now(),
            lastHealthCheck: 0,
            lastBackup: 0
        };

        // Métricas de rendimiento (optimizado para menor uso de memoria)
        this.performance = {
            responseTime: new Array(20).fill(0), // Reducido de 100 a 20
            memoryUsage: new Array(12).fill(0),  // Reducido de 60 a 12 (12 intervalos de 5 min = 1 hora)
            cpuUsage: new Array(12).fill(0)      // Reducido de 60 a 12
        };

        this.startMetricsCollection();
    }

    // === MÉTRICAS PRINCIPALES ===

    async getSystemMetrics() {
        try {
            const [cpu, memory, system, redis, bot, webhook, business] = await Promise.all([
                this.getCPUMetrics(),
                this.getMemoryMetrics(),
                this.getSystemInfo(),
                this.getRedisMetrics(),
                this.getBotMetrics(),
                this.getWebhookMetrics(),
                this.getBusinessMetrics()
            ]);

            return {
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                system: {
                    cpu,
                    memory,
                    info: system
                },
                services: {
                    redis,
                    bot,
                    webhook
                },
                business,
                counters: { ...this.counters },
                performance: {
                    avgResponseTime: this.getAverageResponseTime(),
                    errorRate: this.calculateErrorRate(),
                    throughput: this.calculateThroughput()
                }
            };
        } catch (error) {
            console.error('❌ Error obteniendo métricas del sistema:', error);
            throw error;
        }
    }

    async getCPUMetrics() {
        try {
            const cpuLoad = await si.currentLoad();
            const cpuTemp = await si.cpuTemperature();

            // Agregar a histórico (memoria optimizada)
            this.performance.cpuUsage.push(cpuLoad.currentLoad);
            if (this.performance.cpuUsage.length > 12) {
                this.performance.cpuUsage.shift();
            }

            return {
                currentLoad: Math.round(cpuLoad.currentLoad * 100) / 100,
                avgLoad: Math.round(cpuLoad.avgLoad * 100) / 100,
                temperature: cpuTemp.main || null,
                cores: cpuLoad.cpus.length,
                usage1min: this.performance.cpuUsage.slice(-1)[0],
                usage5min: this.calculateAverage(this.performance.cpuUsage.slice(-5)),
                usage15min: this.calculateAverage(this.performance.cpuUsage.slice(-15))
            };
        } catch (error) {
            console.error('Error obteniendo métricas de CPU:', error);
            // Fallback básico usando información del proceso
            return {
                currentLoad: 0,
                avgLoad: 0,
                temperature: null,
                cores: require('os').cpus().length,
                usage1min: 0,
                usage5min: 0,
                usage15min: 0,
                error: 'Limited CPU metrics available'
            };
        }
    }

    async getMemoryMetrics() {
        try {
            const mem = await si.mem();
            const processMemory = process.memoryUsage();

            // Agregar a histórico (memoria optimizada)
            const memUsagePercent = (mem.used / mem.total) * 100;
            this.performance.memoryUsage.push(memUsagePercent);
            if (this.performance.memoryUsage.length > 12) {
                this.performance.memoryUsage.shift();
            }

            return {
                total: Math.round(mem.total / 1024 / 1024), // MB
                used: Math.round(mem.used / 1024 / 1024), // MB
                free: Math.round(mem.free / 1024 / 1024), // MB
                usagePercent: Math.round(memUsagePercent * 100) / 100,
                process: {
                    rss: Math.round(processMemory.rss / 1024 / 1024), // MB
                    heapUsed: Math.round(processMemory.heapUsed / 1024 / 1024), // MB
                    heapTotal: Math.round(processMemory.heapTotal / 1024 / 1024), // MB
                    external: Math.round(processMemory.external / 1024 / 1024) // MB
                },
                trend: this.calculateTrend(this.performance.memoryUsage.slice(-10))
            };
        } catch (error) {
            console.error('Error obteniendo métricas de memoria:', error);
            // Fallback usando solo métricas del proceso
            const processMemory = process.memoryUsage();
            const totalSystemMemory = require('os').totalmem();
            const freeSystemMemory = require('os').freemem();
            const usedSystemMemory = totalSystemMemory - freeSystemMemory;

            return {
                total: Math.round(totalSystemMemory / 1024 / 1024), // MB
                used: Math.round(usedSystemMemory / 1024 / 1024), // MB
                free: Math.round(freeSystemMemory / 1024 / 1024), // MB
                usagePercent: Math.round((usedSystemMemory / totalSystemMemory) * 100 * 100) / 100,
                process: {
                    rss: Math.round(processMemory.rss / 1024 / 1024), // MB
                    heapUsed: Math.round(processMemory.heapUsed / 1024 / 1024), // MB
                    heapTotal: Math.round(processMemory.heapTotal / 1024 / 1024), // MB
                    external: Math.round(processMemory.external / 1024 / 1024) // MB
                },
                trend: 'stable',
                error: 'Limited memory metrics available'
            };
        }
    }

    async getSystemInfo() {
        try {
            const [osInfo, time] = await Promise.all([
                si.osInfo(),
                si.time()
            ]);

            return {
                platform: osInfo.platform,
                arch: osInfo.arch,
                hostname: osInfo.hostname,
                uptime: Math.floor(time.uptime / 3600), // horas
                timezone: time.timezone,
                nodeVersion: process.version
            };
        } catch (error) {
            return { error: 'Unable to fetch system info' };
        }
    }

    async getRedisMetrics() {
        try {
            if (!this.redis.isReady) {
                return {
                    status: 'disconnected',
                    error: 'Redis client not ready'
                };
            }

            const info = await this.redis.info();
            // Note: memory command might not be available in all Redis versions
            let memoryInfo = null;
            try {
                if (typeof this.redis.memory === 'function') {
                    memoryInfo = await this.redis.memory('stats');
                }
            } catch (error) {
                // Memory command not available, skip it
            }

            // Parsear información de Redis
            const lines = info.split('\r\n');
            const stats = {};

            lines.forEach(line => {
                if (line.includes(':') && !line.startsWith('#')) {
                    const [key, value] = line.split(':');
                    stats[key] = value;
                }
            });

            return {
                status: 'connected',
                version: stats.redis_version,
                uptime: parseInt(stats.uptime_in_seconds),
                connectedClients: parseInt(stats.connected_clients),
                usedMemory: Math.round(parseInt(stats.used_memory) / 1024 / 1024), // MB
                totalKeys: await this.redis.dbSize(),
                hitRate: stats.keyspace_hits && stats.keyspace_misses ?
                    Math.round((parseInt(stats.keyspace_hits) /
                    (parseInt(stats.keyspace_hits) + parseInt(stats.keyspace_misses))) * 100) : 0,
                lastSave: new Date(parseInt(stats.rdb_last_save_time) * 1000)
            };
        } catch (error) {
            console.error('Error obteniendo métricas de Redis:', error);
            return {
                status: 'error',
                error: error.message
            };
        }
    }

    async getBotMetrics() {
        try {
            // Método alternativo: verificar estado del bot usando métricas internas primero
            const lastActivity = await this.getMetricFromRedis('bot:last_activity', 0);
            const timeSinceLastActivity = Date.now() - lastActivity;

            // Si el bot ha tenido actividad reciente (menos de 5 minutos), considerarlo healthy
            if (timeSinceLastActivity < 300000) { // 5 minutos
                return {
                    status: 'healthy',
                    phoneNumber: 'Active (based on recent activity)',
                    verifiedName: 'CapiBobba Bot',
                    responseTime: 100, // Valor simulado para actividad reciente
                    avgResponseTime: this.getAverageResponseTime(),
                    maintenanceMode: await this.redis.get(this.config.maintenanceModeKey) === 'true',
                    lastHealthCheck: new Date().toISOString(),
                    messagesProcessed24h: await this.getMetricFromRedis('messages:24h', 0),
                    ordersProcessed24h: await this.getMetricFromRedis('orders:24h', 0),
                    source: 'internal_activity'
                };
            }

            // Solo si no hay actividad reciente, intentar verificar con WhatsApp API
            const startTime = Date.now();

            const response = await axios.get(
                `https://graph.facebook.com/${this.config.whatsappApiVersion}/${this.config.phoneNumberId}`,
                {
                    headers: { Authorization: `Bearer ${this.config.whatsappToken}` },
                    timeout: 15000, // Aumentado de 5s a 15s para Render.com
                    retry: 2, // Intentar 2 veces si falla
                    retryDelay: 1000 // Esperar 1s entre reintentos
                }
            );

            const responseTime = Date.now() - startTime;

            // Agregar tiempo de respuesta al histórico (memoria optimizada)
            this.performance.responseTime.push(responseTime);
            if (this.performance.responseTime.length > 20) {
                this.performance.responseTime.shift();
            }

            // Obtener estado de mantenimiento
            const maintenanceMode = await this.redis.get(this.config.maintenanceModeKey) === 'true';

            return {
                status: 'healthy',
                phoneNumber: response.data.display_phone_number || 'Unknown',
                verifiedName: response.data.verified_name || 'Unknown',
                responseTime: responseTime,
                avgResponseTime: this.getAverageResponseTime(),
                maintenanceMode: maintenanceMode,
                lastHealthCheck: new Date().toISOString(),
                messagesProcessed24h: await this.getMetricFromRedis('messages:24h', 0),
                ordersProcessed24h: await this.getMetricFromRedis('orders:24h', 0)
            };
        } catch (error) {
            // Manejo mejorado de errores de red para reducir logs verbosos
            let errorMessage = error.message;

            if (error.code === 'ETIMEDOUT' || error.code === 'ENETUNREACH') {
                console.warn('⚠️ Timeout/red lenta conectando a WhatsApp API - probablemente restricciones de Render.com');
                errorMessage = 'Network timeout - WhatsApp API unreachable from Render.com';
            } else if (error.response?.status === 429) {
                console.warn('⚠️ Rate limiting de WhatsApp API');
                errorMessage = 'WhatsApp API rate limited';
            } else {
                console.error('❌ Error verificando estado del bot:', error.message);
            }

            return {
                status: 'degraded', // Cambiar de 'unhealthy' a 'degraded' para timeouts de red
                error: errorMessage,
                lastError: new Date().toISOString(),
                networkIssue: error.code === 'ETIMEDOUT' || error.code === 'ENETUNREACH'
            };
        }
    }

    async getWebhookMetrics() {
        try {
            if (!this.config.webhookUrl) {
                return { status: 'not_configured' };
            }

            // Hacer una petición de health check (GET) al webhook
            const startTime = Date.now();

            // La mayoría de webhooks de n8n no responden a GET, así que usamos una estrategia diferente
            // Verificamos la conectividad del dominio
            const url = new URL(this.config.webhookUrl);

            try {
                const response = await axios.get(`https://${url.hostname}`, {
                    timeout: 3000,
                    validateStatus: () => true // Aceptar cualquier status code
                });

                const responseTime = Date.now() - startTime;

                return {
                    status: 'reachable',
                    host: url.hostname,
                    responseTime: responseTime,
                    webhookCalls24h: await this.getMetricFromRedis('webhook:calls:24h', 0),
                    lastCall: await this.getMetricFromRedis('webhook:last_call'),
                    errors24h: await this.getMetricFromRedis('webhook:errors:24h', 0)
                };
            } catch (error) {
                return {
                    status: 'unreachable',
                    host: url.hostname,
                    error: error.message,
                    lastError: new Date().toISOString()
                };
            }
        } catch (error) {
            return {
                status: 'error',
                error: error.message
            };
        }
    }

    async getBusinessMetrics() {
        try {
            const now = Date.now();
            const last24h = now - (24 * 60 * 60 * 1000);
            const last1h = now - (60 * 60 * 1000);

            // Obtener métricas de negocio desde Redis
            const [
                ordersToday,
                messagesHour,
                ordersHour,
                avgOrderValue,
                topCustomers,
                errorRate
            ] = await Promise.all([
                this.getMetricFromRedis('business:orders:today', 0),
                this.getMetricFromRedis('business:messages:hour', 0),
                this.getMetricFromRedis('business:orders:hour', 0),
                this.getMetricFromRedis('business:avg_order_value', 0),
                this.getTopCustomers(),
                this.calculateErrorRate()
            ]);

            return {
                ordersToday: ordersToday,
                messagesPerHour: messagesHour,
                ordersPerHour: ordersHour,
                avgOrderValue: Math.round(avgOrderValue * 100) / 100,
                errorRate: Math.round(errorRate * 10000) / 100, // Porcentaje con 2 decimales
                topCustomers: topCustomers,
                revenue24h: ordersToday * avgOrderValue,
                conversionRate: messagesHour > 0 ? Math.round((ordersHour / messagesHour) * 10000) / 100 : 0
            };
        } catch (error) {
            console.error('Error obteniendo métricas de negocio:', error);
            return { error: 'Unable to fetch business metrics' };
        }
    }

    // === MÉTODOS DE UTILIDAD ===

    getAverageResponseTime() {
        const validTimes = this.performance.responseTime.filter(t => t > 0);
        return validTimes.length > 0 ?
            Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length) : 0;
    }

    calculateErrorRate() {
        const totalRequests = this.counters.webhookCalls + this.counters.messagesProcessed;
        return totalRequests > 0 ? this.counters.errorsEncountered / totalRequests : 0;
    }

    calculateThroughput() {
        const timeElapsed = (Date.now() - this.timestamps.lastMetricReset) / 1000; // segundos
        return timeElapsed > 0 ? this.counters.messagesProcessed / timeElapsed : 0;
    }

    calculateAverage(array) {
        return array.length > 0 ? array.reduce((a, b) => a + b, 0) / array.length : 0;
    }

    calculateTrend(array) {
        if (array.length < 2) return 'stable';
        const recent = array.slice(-3);
        const older = array.slice(-6, -3);
        const recentAvg = this.calculateAverage(recent);
        const olderAvg = this.calculateAverage(older);

        if (recentAvg > olderAvg * 1.1) return 'increasing';
        if (recentAvg < olderAvg * 0.9) return 'decreasing';
        return 'stable';
    }

    async getMetricFromRedis(key, defaultValue = null) {
        try {
            const value = await this.redis.get(key);
            return value !== null ? JSON.parse(value) : defaultValue;
        } catch (error) {
            return defaultValue;
        }
    }

    async setMetricInRedis(key, value, expireSeconds = 86400) {
        try {
            await this.redis.setEx(key, expireSeconds, JSON.stringify(value));
        } catch (error) {
            console.error(`Error guardando métrica ${key}:`, error);
        }
    }

    // Limpieza automática de memoria optimizada
    async cleanupMemoryMetrics() {
        try {
            // Limpiar arrays en memoria si están creciendo demasiado
            if (this.performance.responseTime.length > 20) {
                this.performance.responseTime = this.performance.responseTime.slice(-10);
            }
            if (this.performance.cpuUsage.length > 12) {
                this.performance.cpuUsage = this.performance.cpuUsage.slice(-6);
            }
            if (this.performance.memoryUsage.length > 12) {
                this.performance.memoryUsage = this.performance.memoryUsage.slice(-6);
            }

            console.log('🧹 Arrays de memoria optimizados');
        } catch (error) {
            console.error('Error en limpieza de memoria:', error);
        }
    }

    async incrementMetric(key, amount = 1, expireSeconds = 86400) {
        try {
            const current = await this.getMetricFromRedis(key, 0);
            await this.setMetricInRedis(key, current + amount, expireSeconds);
        } catch (error) {
            console.error(`Error incrementando métrica ${key}:`, error);
        }
    }

    async getTopCustomers(limit = 5) {
        try {
            // Obtener top customers desde Redis (esto se debería poblar desde el workflow)
            const topCustomers = await this.getMetricFromRedis('business:top_customers', []);
            return topCustomers.slice(0, limit);
        } catch (error) {
            return [];
        }
    }

    // === RECOLECCIÓN AUTOMÁTICA ===

    startMetricsCollection() {
        console.log('🚀 Iniciando sistema de métricas...');

        // Recolectar métricas de sistema cada minuto
        setInterval(async () => {
            try {
                console.log('📊 Recolectando métricas del sistema...');
                const metrics = await this.getSystemMetrics();
                await this.setMetricInRedis('system:latest', metrics, 300); // 5 minutos

                console.log(`✅ Métricas guardadas - CPU: ${metrics.system.cpu.currentLoad}%, Memoria: ${metrics.system.memory.usagePercent}%`);

                // Limpiar métricas antiguas cada hora
                if (Date.now() - this.timestamps.lastMetricReset > 60 * 60 * 1000) {
                    await this.cleanupOldMetrics();
                    this.timestamps.lastMetricReset = Date.now();
                }
            } catch (error) {
                console.error('❌ Error en recolección de métricas:', error);
            }
        }, 120000); // Aumentado de 60s a 120s (2 minutos) para reducir carga en Render.com

        // Ejecutar una recolección inicial inmediatamente
        setTimeout(async () => {
            try {
                console.log('🔄 Ejecutando recolección inicial de métricas...');
                const metrics = await this.getSystemMetrics();
                await this.setMetricInRedis('system:latest', metrics, 300);
                console.log('✅ Métricas iniciales guardadas exitosamente');
            } catch (error) {
                console.error('❌ Error en recolección inicial:', error);
            }
        }, 5000); // Después de 5 segundos

        console.log('🚀 Sistema de métricas iniciado exitosamente');
    }

    async cleanupOldMetrics() {
        try {
            const keys = await this.redis.keys('metrics:*');
            const now = Date.now();

            for (const key of keys) {
                const ttl = await this.redis.ttl(key);
                if (ttl < 0) { // Sin expiración
                    await this.redis.expire(key, 86400); // 24 horas
                }
            }

            console.log(`🧹 Limpieza de métricas completada: ${keys.length} claves revisadas`);
        } catch (error) {
            console.error('Error en limpieza de métricas:', error);
        }
    }

    // === MÉTODOS PÚBLICOS PARA EL BOT ===

    recordMessage(type = 'regular') {
        this.counters.messagesProcessed++;
        this.incrementMetric('business:messages:hour', 1, 3600);
        this.incrementMetric('business:messages:today', 1, 86400);
    }

    recordOrder(orderValue = 0) {
        this.counters.ordersReceived++;
        this.incrementMetric('business:orders:hour', 1, 3600);
        this.incrementMetric('business:orders:today', 1, 86400);

        if (orderValue > 0) {
            this.updateAverageOrderValue(orderValue);
        }
    }

    recordError(context = 'general') {
        this.counters.errorsEncountered++;
        this.incrementMetric(`errors:${context}:hour`, 1, 3600);
        this.incrementMetric('webhook:errors:24h', 1, 86400);
    }

    recordWebhookCall() {
        this.counters.webhookCalls++;
        this.setMetricInRedis('webhook:last_call', new Date().toISOString(), 86400);
        this.incrementMetric('webhook:calls:24h', 1, 86400);
    }

    async updateAverageOrderValue(newOrderValue) {
        try {
            const currentAvg = await this.getMetricFromRedis('business:avg_order_value', 0);
            const totalOrders = await this.getMetricFromRedis('business:orders:today', 1);

            // Calcular nuevo promedio
            const newAvg = ((currentAvg * (totalOrders - 1)) + newOrderValue) / totalOrders;
            await this.setMetricInRedis('business:avg_order_value', newAvg, 86400);
        } catch (error) {
            console.error('Error actualizando valor promedio de pedido:', error);
        }
    }

    resetCounters() {
        this.counters = {
            messagesProcessed: 0,
            ordersReceived: 0,
            errorsEncountered: 0,
            webhookCalls: 0,
            telegramNotifications: 0
        };
        this.timestamps.lastMetricReset = Date.now();
    }
}

module.exports = MetricsCollector;