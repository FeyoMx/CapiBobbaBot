// monitoring/memory-monitor.js
// Monitor específico para entornos con memoria limitada (512MB)

class MemoryMonitor {
    constructor(redisClient, warningThreshold = 85, criticalThreshold = 95) {
        this.redis = redisClient;
        this.warningThreshold = warningThreshold;
        this.criticalThreshold = criticalThreshold;
        this.lastWarning = 0;
        this.lastCritical = 0;
        this.alertCooldown = 300000; // 5 minutos entre alertas

        this.startMonitoring();
    }

    startMonitoring() {
        // Monitorear cada 30 segundos en entornos limitados
        setInterval(() => {
            this.checkMemoryUsage();
        }, 30000);

        console.log('🔍 Monitor de memoria iniciado para entorno de 512MB');
    }

    async checkMemoryUsage() {
        try {
            const memInfo = process.memoryUsage();

            // Usar límite de contenedor de 512MB en lugar del sistema completo
            const containerMemoryLimit = 512 * 1024 * 1024; // 512MB en bytes
            const processMemoryUsed = memInfo.rss; // Memoria real usada por el proceso
            const containerUsagePercent = (processMemoryUsed / containerMemoryLimit) * 100;
            const processHeapPercent = (memInfo.heapUsed / memInfo.heapTotal) * 100;

            // Log detallado cada 5 minutos
            if (Date.now() % 300000 < 30000) {
                console.log('📊 Estado de memoria:');
                console.log(`   Contenedor: ${Math.round(containerUsagePercent)}% (${Math.round(processMemoryUsed/1024/1024)}MB/512MB)`);
                console.log(`   Proceso heap: ${Math.round(processHeapPercent)}% (${Math.round(memInfo.heapUsed/1024/1024)}MB/${Math.round(memInfo.heapTotal/1024/1024)}MB)`);
                console.log(`   RSS: ${Math.round(memInfo.rss/1024/1024)}MB`);
                console.log(`   External: ${Math.round(memInfo.external/1024/1024)}MB`);
            }

            // Alertas por uso crítico (usar memoria del contenedor)
            const now = Date.now();

            if (containerUsagePercent >= this.criticalThreshold && (now - this.lastCritical) > this.alertCooldown) {
                await this.handleCriticalMemory(containerUsagePercent);
                this.lastCritical = now;
            } else if (containerUsagePercent >= this.warningThreshold && (now - this.lastWarning) > this.alertCooldown) {
                await this.handleWarningMemory(containerUsagePercent);
                this.lastWarning = now;
            }

            // Guardar métricas en Redis
            await this.saveMemoryMetrics({
                timestamp: new Date().toISOString(),
                container: {
                    total: 512,
                    used: Math.round(processMemoryUsed / 1024 / 1024),
                    usagePercent: Math.round(containerUsagePercent * 100) / 100
                },
                process: {
                    heapUsed: Math.round(memInfo.heapUsed / 1024 / 1024),
                    heapTotal: Math.round(memInfo.heapTotal / 1024 / 1024),
                    rss: Math.round(memInfo.rss / 1024 / 1024),
                    external: Math.round(memInfo.external / 1024 / 1024),
                    heapPercent: Math.round(processHeapPercent * 100) / 100
                }
            });

        } catch (error) {
            console.error('❌ Error en monitor de memoria:', error);
        }
    }

    async handleWarningMemory(usagePercent) {
        console.warn(`⚠️ ADVERTENCIA: Uso de memoria alto: ${Math.round(usagePercent)}%`);

        // Ejecutar garbage collection si está disponible
        if (global.gc) {
            global.gc();
            console.log('🗑️ Garbage collection forzado por advertencia');
        }

        // Limpiar caché en Redis si existe
        try {
            const keys = await this.redis.keys('cache:*');
            if (keys.length > 0) {
                await this.redis.del(keys);
                console.log(`🧹 ${keys.length} claves de caché eliminadas`);
            }
        } catch (error) {
            console.error('Error limpiando caché:', error);
        }

        // Guardar alerta
        await this.saveAlert('warning', `Uso de memoria alto: ${Math.round(usagePercent)}%`);
    }

    async handleCriticalMemory(usagePercent) {
        console.error(`🚨 CRÍTICO: Uso de memoria muy alto: ${Math.round(usagePercent)}%`);

        // Ejecutar limpieza agresiva
        if (global.gc) {
            global.gc();
            console.log('🗑️ Garbage collection crítico ejecutado');
        }

        // Limpiar todas las métricas antiguas
        try {
            const keys = await this.redis.keys('metrics:*');
            const oldKeys = [];

            for (const key of keys) {
                const ttl = await this.redis.ttl(key);
                if (ttl > 3600) { // Mantener solo última hora
                    oldKeys.push(key);
                }
            }

            if (oldKeys.length > 0) {
                await this.redis.del(oldKeys);
                console.log(`🧹 ${oldKeys.length} métricas antiguas eliminadas`);
            }
        } catch (error) {
            console.error('Error en limpieza crítica:', error);
        }

        // Guardar alerta crítica
        await this.saveAlert('critical', `Uso de memoria crítico: ${Math.round(usagePercent)}%`);
    }

    async saveMemoryMetrics(metrics) {
        try {
            const key = `memory:${Date.now()}`;
            await this.redis.setEx(key, 3600, JSON.stringify(metrics)); // 1 hora TTL
        } catch (error) {
            console.error('Error guardando métricas de memoria:', error);
        }
    }

    async saveAlert(level, message) {
        try {
            const alert = {
                id: `memory_${Date.now()}`,
                level: level,
                source: 'memory_monitor',
                message: message,
                timestamp: new Date().toISOString()
            };

            await this.redis.setEx(`alert:${alert.id}`, 86400, JSON.stringify(alert));
            console.log(`📢 Alerta ${level} guardada: ${message}`);
        } catch (error) {
            console.error('Error guardando alerta:', error);
        }
    }

    getMemoryReport() {
        const memInfo = process.memoryUsage();
        const containerMemoryLimit = 512 * 1024 * 1024; // 512MB
        const processMemoryUsed = memInfo.rss;
        const containerUsagePercent = (processMemoryUsed / containerMemoryLimit) * 100;

        return {
            container: {
                total: 512,
                used: Math.round(processMemoryUsed / 1024 / 1024),
                free: 512 - Math.round(processMemoryUsed / 1024 / 1024),
                usagePercent: Math.round(containerUsagePercent * 100) / 100
            },
            process: {
                heapUsed: Math.round(memInfo.heapUsed / 1024 / 1024),
                heapTotal: Math.round(memInfo.heapTotal / 1024 / 1024),
                rss: Math.round(memInfo.rss / 1024 / 1024),
                external: Math.round(memInfo.external / 1024 / 1024),
                arrayBuffers: Math.round(memInfo.arrayBuffers / 1024 / 1024)
            },
            recommendations: this.getRecommendations(processMemoryUsed, containerMemoryLimit, memInfo)
        };
    }

    getRecommendations(usedMemory, totalMemory, memInfo) {
        const containerUsagePercent = (usedMemory / totalMemory) * 100;
        const recommendations = [];

        if (containerUsagePercent > 80) {
            recommendations.push('Uso crítico: Considerar reiniciar la aplicación');
            recommendations.push('Revisar memory leaks en el código');
        } else if (containerUsagePercent > 60) {
            recommendations.push('Uso moderado: Ejecutar garbage collection más frecuentemente');
            recommendations.push('Reducir tiempo de retención de métricas');
        } else if (containerUsagePercent < 30) {
            recommendations.push('Uso óptimo: Sistema funcionando eficientemente');
        }

        if (memInfo.heapUsed / memInfo.heapTotal > 0.8) {
            recommendations.push('Heap alto: Revisar objetos almacenados en memoria');
        }

        if (memInfo.rss > 300 * 1024 * 1024) { // > 300MB para 512MB container
            recommendations.push('RSS alto: Revisar uso de buffers y streams');
        }

        return recommendations;
    }
}

module.exports = MemoryMonitor;