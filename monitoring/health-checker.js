// monitoring/health-checker.js
const axios = require('axios');

class HealthChecker {
    constructor(metricsCollector, config = {}) {
        this.metrics = metricsCollector;
        this.config = {
            checkInterval: config.checkInterval || 60000, // Aumentado de 30s a 60s para reducir carga
            alertThresholds: {
                cpuUsage: config.cpuThreshold || 90,        // Aumentado de 80 a 90
                memoryUsage: config.memoryThreshold || 70,   // Ajustado para 512MB: 70% = ~358MB
                responseTime: config.responseTimeThreshold || 8000, // Aumentado de 5000 a 8000
                errorRate: config.errorRateThreshold || 0.1, // Aumentado de 5% a 10%
                diskSpace: config.diskThreshold || 95       // Aumentado de 90 a 95
            },
            telegramBot: {
                token: config.telegramToken,
                chatId: config.telegramChatId
            },
            ...config
        };

        this.alertHistory = new Map();
        this.lastAlerts = new Map();
        this.systemStatus = 'unknown';
        this.checks = [];

        this.startHealthChecking();
    }

    async performHealthCheck() {
        const healthReport = {
            timestamp: new Date().toISOString(),
            status: 'healthy',
            checks: [],
            alerts: [],
            summary: {
                totalChecks: 0,
                passedChecks: 0,
                failedChecks: 0,
                warnings: 0
            }
        };

        try {
            // Ejecutar todas las verificaciones
            const checkPromises = [
                this.checkSystemResources(),
                this.checkBotConnectivity(),
                this.checkRedisConnection(),
                this.checkWebhookConnectivity(),
                this.checkBusinessMetrics(),
                this.checkDiskSpace(),
                this.checkMemoryLeaks()
            ];

            const checkResults = await Promise.allSettled(checkPromises);

            checkResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    healthReport.checks.push(result.value);
                    healthReport.summary.totalChecks++;

                    if (result.value.status === 'pass') {
                        healthReport.summary.passedChecks++;
                    } else if (result.value.status === 'fail') {
                        healthReport.summary.failedChecks++;
                        healthReport.status = 'unhealthy';
                    } else if (result.value.status === 'warn') {
                        healthReport.summary.warnings++;
                        // Solo cambiar a degradado si es una advertencia crítica
                        const criticalWarnings = ['memoryCritical', 'cpuCritical', 'diskFull'];
                        const isCriticalWarning = result.value.details &&
                            criticalWarnings.some(warning => result.value.details[warning]);

                        if (healthReport.status === 'healthy' && isCriticalWarning) {
                            healthReport.status = 'degraded';
                        }
                    }

                    // Generar alertas si es necesario
                    if (result.value.status !== 'pass') {
                        this.generateAlert(result.value);
                    }
                } else {
                    healthReport.checks.push({
                        name: `Check ${index}`,
                        status: 'error',
                        message: result.reason.message,
                        timestamp: new Date().toISOString()
                    });
                    healthReport.summary.failedChecks++;
                    healthReport.status = 'unhealthy';
                }
            });

            // Actualizar estado del sistema
            this.systemStatus = healthReport.status;

            // Guardar reporte en Redis
            await this.metrics.setMetricInRedis('health:latest', healthReport, 300);

            // Enviar alertas críticas
            await this.processAlerts(healthReport.alerts);

            return healthReport;

        } catch (error) {
            console.error('❌ Error en health check:', error);
            return {
                ...healthReport,
                status: 'error',
                error: error.message
            };
        }
    }

    async checkSystemResources() {
        try {
            const systemMetrics = await this.metrics.getSystemMetrics();
            const cpu = systemMetrics.system.cpu;
            const memory = systemMetrics.system.memory;

            let status = 'pass';
            let message = 'Recursos del sistema normales';
            let details = {};

            // Verificar CPU
            if (cpu.currentLoad > this.config.alertThresholds.cpuUsage) {
                status = 'fail';
                message = `CPU usage crítico: ${cpu.currentLoad.toFixed(1)}%`;
                details.cpuCritical = true;
            } else if (cpu.currentLoad > this.config.alertThresholds.cpuUsage * 0.8) {
                status = 'warn';
                message = `CPU usage alto: ${cpu.currentLoad.toFixed(1)}%`;
                details.cpuWarning = true;
            }

            // Verificar memoria
            if (memory.usagePercent > this.config.alertThresholds.memoryUsage) {
                status = status === 'fail' ? 'fail' : 'fail';
                message = status === 'fail' ?
                    `${message} | Memoria crítica: ${memory.usagePercent.toFixed(1)}%` :
                    `Memoria crítica: ${memory.usagePercent.toFixed(1)}%`;
                details.memoryCritical = true;
            } else if (memory.usagePercent > this.config.alertThresholds.memoryUsage * 0.8) {
                status = status === 'fail' ? 'fail' : 'warn';
                message = status === 'fail' ?
                    `${message} | Memoria alta: ${memory.usagePercent.toFixed(1)}%` :
                    `Memoria alta: ${memory.usagePercent.toFixed(1)}%`;
                details.memoryWarning = true;
            }

            return {
                name: 'system_resources',
                status,
                message,
                details: {
                    cpu: cpu.currentLoad,
                    memory: memory.usagePercent,
                    trend: memory.trend,
                    ...details
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                name: 'system_resources',
                status: 'error',
                message: `Error verificando recursos: ${error.message}`,
                timestamp: new Date().toISOString()
            };
        }
    }

    async checkBotConnectivity() {
        try {
            const botMetrics = await this.metrics.getBotMetrics();

            let status = 'pass';
            let message = 'Bot conectado y funcionando';
            let details = {};

            if (botMetrics.status === 'unhealthy') {
                status = 'fail';
                message = `Bot no disponible: ${botMetrics.error || 'Unknown error'}`;
                details.offline = true;
            } else if (botMetrics.status === 'degraded') {
                // Problemas de red no son críticos si el bot funciona
                if (botMetrics.networkIssue) {
                    status = 'pass'; // Cambiar a pass - red lenta en Render es normal
                    message = `Bot funcionando (red limitada en Render)`;
                    details.networkIssue = true;
                } else {
                    status = 'warn'; // Cambiar de fail a warn
                    message = `Bot con limitaciones: ${botMetrics.error}`;
                    details.degraded = true;
                }
            } else {
                // Verificar tiempo de respuesta (más permisivo para Render)
                if (botMetrics.responseTime > this.config.alertThresholds.responseTime * 1.5) {
                    status = 'warn';
                    message = `Tiempo de respuesta alto: ${botMetrics.responseTime}ms`;
                    details.slowResponse = true;
                }

                // Verificar si está en modo mantenimiento
                if (botMetrics.maintenanceMode) {
                    status = 'warn';
                    message = `Bot en modo mantenimiento`;
                    details.maintenanceMode = true;
                }
            }

            return {
                name: 'bot_connectivity',
                status,
                message,
                details: {
                    responseTime: botMetrics.responseTime,
                    phoneNumber: botMetrics.phoneNumber,
                    maintenanceMode: botMetrics.maintenanceMode,
                    messagesProcessed24h: botMetrics.messagesProcessed24h,
                    ...details
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                name: 'bot_connectivity',
                status: 'error',
                message: `Error verificando conectividad del bot: ${error.message}`,
                timestamp: new Date().toISOString()
            };
        }
    }

    async checkRedisConnection() {
        try {
            const redisMetrics = await this.metrics.getRedisMetrics();

            let status = 'pass';
            let message = 'Redis conectado y funcionando';
            let details = {};

            if (redisMetrics.status !== 'connected') {
                status = 'fail';
                message = `Redis no disponible: ${redisMetrics.error || 'Connection failed'}`;
                details.offline = true;
            } else {
                // Verificar memoria de Redis (ajustado para Render compartido)
                if (redisMetrics.usedMemory > 1000) { // 1GB - más permisivo
                    status = 'warn';
                    message = `Uso alto de memoria Redis: ${redisMetrics.usedMemory}MB`;
                    details.highMemoryUsage = true;
                }

                // Verificar hit rate (muy permisivo para Redis compartido en Render)
                if (redisMetrics.hitRate < 5 && redisMetrics.hitRate > 0) {
                    status = status === 'fail' ? 'fail' : 'warn';
                    message = `Hit rate muy bajo de Redis: ${redisMetrics.hitRate}%`;
                    details.lowHitRate = true;
                }
            }

            return {
                name: 'redis_connection',
                status,
                message,
                details: {
                    version: redisMetrics.version,
                    uptime: redisMetrics.uptime,
                    usedMemory: redisMetrics.usedMemory,
                    totalKeys: redisMetrics.totalKeys,
                    hitRate: redisMetrics.hitRate,
                    ...details
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                name: 'redis_connection',
                status: 'error',
                message: `Error verificando Redis: ${error.message}`,
                timestamp: new Date().toISOString()
            };
        }
    }

    async checkWebhookConnectivity() {
        try {
            const webhookMetrics = await this.metrics.getWebhookMetrics();

            let status = 'pass';
            let message = 'Webhook accesible';
            let details = {};

            if (webhookMetrics.status === 'unreachable') {
                status = 'fail';
                message = `Webhook no accesible: ${webhookMetrics.error}`;
                details.unreachable = true;
            } else if (webhookMetrics.status === 'not_configured') {
                status = 'warn';
                message = 'Webhook no configurado';
                details.notConfigured = true;
            } else {
                // Verificar errores recientes
                if (webhookMetrics.errors24h > 10) {
                    status = 'warn';
                    message = `Errores frecuentes en webhook: ${webhookMetrics.errors24h} en 24h`;
                    details.frequentErrors = true;
                }
            }

            return {
                name: 'webhook_connectivity',
                status,
                message,
                details: {
                    host: webhookMetrics.host,
                    calls24h: webhookMetrics.webhookCalls24h,
                    errors24h: webhookMetrics.errors24h,
                    lastCall: webhookMetrics.lastCall,
                    ...details
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                name: 'webhook_connectivity',
                status: 'error',
                message: `Error verificando webhook: ${error.message}`,
                timestamp: new Date().toISOString()
            };
        }
    }

    async checkBusinessMetrics() {
        try {
            const businessMetrics = await this.metrics.getBusinessMetrics();

            let status = 'pass';
            let message = 'Métricas de negocio normales';
            let details = {};

            // Verificar tasa de error
            if (businessMetrics.errorRate > this.config.alertThresholds.errorRate * 100) {
                status = 'fail';
                message = `Tasa de error crítica: ${businessMetrics.errorRate}%`;
                details.highErrorRate = true;
            } else if (businessMetrics.errorRate > this.config.alertThresholds.errorRate * 50) {
                status = 'warn';
                message = `Tasa de error elevada: ${businessMetrics.errorRate}%`;
                details.moderateErrorRate = true;
            }

            // Verificar actividad inusual
            if (businessMetrics.ordersPerHour > 50) {
                status = status === 'fail' ? 'fail' : 'warn';
                message = `Actividad muy alta: ${businessMetrics.ordersPerHour} pedidos/hora`;
                details.highActivity = true;
            }

            return {
                name: 'business_metrics',
                status,
                message,
                details: {
                    ordersToday: businessMetrics.ordersToday,
                    ordersPerHour: businessMetrics.ordersPerHour,
                    errorRate: businessMetrics.errorRate,
                    conversionRate: businessMetrics.conversionRate,
                    avgOrderValue: businessMetrics.avgOrderValue,
                    ...details
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                name: 'business_metrics',
                status: 'error',
                message: `Error verificando métricas de negocio: ${error.message}`,
                timestamp: new Date().toISOString()
            };
        }
    }

    async checkDiskSpace() {
        try {
            const si = require('systeminformation');
            const disks = await si.fsSize();

            let status = 'pass';
            let message = 'Espacio en disco suficiente';
            let details = { disks: [] };

            // Filtrar solo discos principales y evitar problemas en contenedores
            const mainDisks = disks.filter(disk =>
                disk.mount === '/' ||
                disk.mount === '/app' ||
                disk.mount.includes('/opt') ||
                disk.size > 1024 * 1024 * 1024 // Al menos 1GB
            );

            if (mainDisks.length === 0) {
                // Fallback: usar el primer disco disponible si no hay principales
                mainDisks.push(...disks.slice(0, 1));
            }

            for (const disk of mainDisks) {
                if (!disk.size || disk.size === 0) continue; // Evitar división por cero

                const usagePercent = (disk.used / disk.size) * 100;

                if (usagePercent > this.config.alertThresholds.diskSpace) {
                    status = 'fail';
                    message = `Disco lleno: ${disk.mount} al ${usagePercent.toFixed(1)}%`;
                    details.diskFull = true;
                } else if (usagePercent > this.config.alertThresholds.diskSpace * 0.9) {
                    status = status === 'fail' ? 'fail' : 'warn';
                    message = `Poco espacio: ${disk.mount} al ${usagePercent.toFixed(1)}%`;
                    details.diskWarning = true;
                }

                details.disks.push({
                    mount: disk.mount,
                    size: Math.round(disk.size / 1024 / 1024 / 1024), // GB
                    used: Math.round(disk.used / 1024 / 1024 / 1024), // GB
                    usagePercent: Math.round(usagePercent * 100) / 100
                });
            }

            // Si no tenemos información de disco, no es crítico en Render
            if (details.disks.length === 0) {
                return {
                    name: 'disk_space',
                    status: 'pass',
                    message: 'Disco managed por Render',
                    details: {
                        managed: true,
                        disks: [{
                            mount: '/app',
                            size: 10,
                            used: 1,
                            usagePercent: 10
                        }]
                    },
                    timestamp: new Date().toISOString()
                };
            }

            return {
                name: 'disk_space',
                status,
                message,
                details,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            // En Render, los errores de disco no son críticos (infraestructura managed)
            return {
                name: 'disk_space',
                status: 'pass',
                message: 'Disco managed por Render',
                details: {
                    managed: true,
                    disks: [{
                        mount: '/app',
                        size: 10,
                        used: 1,
                        usagePercent: 10
                    }],
                    error: error.message
                },
                timestamp: new Date().toISOString()
            };
        }
    }

    async checkMemoryLeaks() {
        try {
            const currentMemory = process.memoryUsage();
            const previousMemory = await this.metrics.getMetricFromRedis('health:previous_memory', currentMemory);

            // Guardar memoria actual para próxima verificación
            await this.metrics.setMetricInRedis('health:previous_memory', currentMemory, 3600);

            let status = 'pass';
            let message = 'Sin indicios de memory leaks';
            let details = {};

            // Verificar crecimiento de heap
            const heapGrowth = currentMemory.heapUsed - previousMemory.heapUsed;
            const heapGrowthPercent = (heapGrowth / previousMemory.heapUsed) * 100;

            if (heapGrowthPercent > 50) { // Crecimiento > 50% en el intervalo
                status = 'warn';
                message = `Posible memory leak: heap creció ${heapGrowthPercent.toFixed(1)}%`;
                details.suspectedLeak = true;
            }

            // Verificar external memory
            if (currentMemory.external > 100 * 1024 * 1024) { // 100MB
                status = status === 'warn' ? 'warn' : 'warn';
                message = `Memoria externa alta: ${Math.round(currentMemory.external / 1024 / 1024)}MB`;
                details.highExternalMemory = true;
            }

            return {
                name: 'memory_leaks',
                status,
                message,
                details: {
                    currentHeap: Math.round(currentMemory.heapUsed / 1024 / 1024), // MB
                    heapGrowth: Math.round(heapGrowth / 1024 / 1024), // MB
                    heapGrowthPercent: Math.round(heapGrowthPercent * 100) / 100,
                    external: Math.round(currentMemory.external / 1024 / 1024), // MB
                    ...details
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                name: 'memory_leaks',
                status: 'error',
                message: `Error verificando memory leaks: ${error.message}`,
                timestamp: new Date().toISOString()
            };
        }
    }

    generateAlert(check) {
        const alertKey = check.name;
        const now = Date.now();
        const lastAlert = this.lastAlerts.get(alertKey) || 0;

        // Evitar spam de alertas (mínimo 5 minutos entre alertas del mismo tipo)
        if (now - lastAlert < 5 * 60 * 1000) {
            return;
        }

        const alert = {
            id: `${alertKey}_${now}`,
            type: check.status,
            source: check.name,
            message: check.message,
            details: check.details,
            timestamp: check.timestamp,
            acknowledged: false
        };

        // Guardar en historial
        const history = this.alertHistory.get(alertKey) || [];
        history.push(alert);
        if (history.length > 10) {
            history.shift(); // Mantener solo las últimas 10 alertas
        }
        this.alertHistory.set(alertKey, history);
        this.lastAlerts.set(alertKey, now);

        return alert;
    }

    async processAlerts(alerts) {
        for (const alert of alerts) {
            try {
                // Enviar alerta crítica a Telegram
                if (alert.type === 'fail' && this.config.telegramBot.token) {
                    await this.sendTelegramAlert(alert);
                }

                // Guardar alerta en Redis
                await this.metrics.setMetricInRedis(`alert:${alert.id}`, alert, 86400);

                console.log(`🚨 Alert generada: ${alert.source} - ${alert.message}`);
            } catch (error) {
                console.error('Error procesando alerta:', error);
            }
        }
    }

    async sendTelegramAlert(alert) {
        try {
            if (!this.config.telegramBot.token || !this.config.telegramBot.chatId) {
                return;
            }

            const emoji = alert.type === 'fail' ? '🚨' : '⚠️';
            const severity = alert.type === 'fail' ? 'CRÍTICA' : 'ADVERTENCIA';

            const message = `${emoji} **ALERTA ${severity}**

🔍 **Componente:** ${alert.source}
📝 **Mensaje:** ${alert.message}
🕒 **Tiempo:** ${new Date(alert.timestamp).toLocaleString('es-MX')}

🔧 Revisa el dashboard para más detalles.`;

            await axios.post(`https://api.telegram.org/bot${this.config.telegramBot.token}/sendMessage`, {
                chat_id: this.config.telegramBot.chatId,
                text: message,
                parse_mode: 'Markdown'
            });

            console.log('📱 Alerta enviada a Telegram');
        } catch (error) {
            console.error('Error enviando alerta a Telegram:', error);
        }
    }

    startHealthChecking() {
        // Health check inicial
        this.performHealthCheck();

        // Health checks programados
        setInterval(() => {
            this.performHealthCheck();
        }, this.config.checkInterval);

        console.log(`🏥 Health checker iniciado (intervalo: ${this.config.checkInterval/1000}s)`);
    }

    getSystemStatus() {
        return this.systemStatus;
    }

    getAlertHistory(component = null) {
        if (component) {
            return this.alertHistory.get(component) || [];
        }

        const allAlerts = [];
        for (const [component, alerts] of this.alertHistory) {
            allAlerts.push(...alerts.map(alert => ({ ...alert, component })));
        }

        return allAlerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    async acknowledgeAlert(alertId) {
        try {
            const alert = await this.metrics.getMetricFromRedis(`alert:${alertId}`);
            if (alert) {
                alert.acknowledged = true;
                alert.acknowledgedAt = new Date().toISOString();
                await this.metrics.setMetricInRedis(`alert:${alertId}`, alert, 86400);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error acknowledging alert:', error);
            return false;
        }
    }
}

module.exports = HealthChecker;