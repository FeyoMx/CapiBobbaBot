// security/redis-backup.js
// Sistema de backup y recuperación automática de Redis

const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');

class RedisBackup {
    constructor(redisClient, options = {}) {
        this.redisClient = redisClient;

        // Configuración por defecto
        this.config = {
            backupDir: options.backupDir || path.join(__dirname, '../backups'),
            schedule: options.schedule || '0 */6 * * *', // Cada 6 horas por defecto
            retentionDays: options.retentionDays || 7, // Mantener backups por 7 días
            maxBackups: options.maxBackups || 30, // Máximo 30 backups
            enabled: options.enabled !== false // Habilitado por defecto
        };

        this.backupJob = null;
        this.cleanupJob = null;
    }

    /**
     * Inicia el sistema de backups automáticos
     */
    async start() {
        if (!this.config.enabled) {
            console.log('📦 Sistema de backups deshabilitado');
            return;
        }

        try {
            // Crear directorio de backups si no existe
            await this._ensureBackupDirectory();

            // Programar backup automático
            this.backupJob = cron.schedule(this.config.schedule, async () => {
                console.log('📦 Ejecutando backup automático...');
                await this.createBackup();
            });

            // Programar limpieza de backups antiguos (diariamente a las 2 AM)
            this.cleanupJob = cron.schedule('0 2 * * *', async () => {
                console.log('🧹 Limpiando backups antiguos...');
                await this.cleanupOldBackups();
            });

            console.log(`✅ Sistema de backups iniciado. Schedule: ${this.config.schedule}`);

            // Crear backup inicial
            await this.createBackup();
        } catch (error) {
            console.error('❌ Error iniciando sistema de backups:', error);
        }
    }

    /**
     * Detiene el sistema de backups
     */
    stop() {
        if (this.backupJob) {
            this.backupJob.stop();
            console.log('⏹️ Backup automático detenido');
        }

        if (this.cleanupJob) {
            this.cleanupJob.stop();
            console.log('⏹️ Limpieza automática detenida');
        }
    }

    /**
     * Crea un backup completo de Redis
     */
    async createBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(this.config.backupDir, `redis-backup-${timestamp}.json`);

        try {
            console.log('📦 Iniciando backup de Redis...');
            const startTime = Date.now();

            // Obtener todas las claves
            const keys = await this.redisClient.keys('*');
            console.log(`📊 Encontradas ${keys.length} claves para respaldar`);

            const backupData = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                keyCount: keys.length,
                data: {}
            };

            // Respaldar cada clave con su tipo y valor
            for (const key of keys) {
                try {
                    const type = await this.redisClient.type(key);
                    const ttl = await this.redisClient.ttl(key);

                    let value;
                    switch (type) {
                        case 'string':
                            value = await this.redisClient.get(key);
                            break;
                        case 'list':
                            value = await this.redisClient.lRange(key, 0, -1);
                            break;
                        case 'set':
                            value = await this.redisClient.sMembers(key);
                            break;
                        case 'zset':
                            value = await this.redisClient.zRange(key, 0, -1, { WITHSCORES: true });
                            break;
                        case 'hash':
                            value = await this.redisClient.hGetAll(key);
                            break;
                        default:
                            console.warn(`⚠️ Tipo desconocido para clave ${key}: ${type}`);
                            continue;
                    }

                    backupData.data[key] = {
                        type,
                        value,
                        ttl: ttl > 0 ? ttl : null
                    };
                } catch (error) {
                    console.error(`❌ Error respaldando clave ${key}:`, error.message);
                }
            }

            // Guardar backup a archivo
            await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));

            const duration = Date.now() - startTime;
            console.log(`✅ Backup completado en ${duration}ms. Archivo: ${backupFile}`);

            // Limpiar backups antiguos si exceden el límite
            await this.cleanupOldBackups();

            return {
                success: true,
                file: backupFile,
                keyCount: keys.length,
                duration
            };
        } catch (error) {
            console.error('❌ Error creando backup:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Restaura Redis desde un archivo de backup
     * @param {string} backupFile - Ruta al archivo de backup
     * @param {boolean} clearBefore - Si debe limpiar Redis antes de restaurar
     */
    async restore(backupFile, clearBefore = false) {
        try {
            console.log(`📥 Iniciando restauración desde ${backupFile}...`);
            const startTime = Date.now();

            // Leer archivo de backup
            const backupContent = await fs.readFile(backupFile, 'utf8');
            const backupData = JSON.parse(backupContent);

            console.log(`📊 Backup contiene ${backupData.keyCount} claves`);
            console.log(`📅 Fecha del backup: ${backupData.timestamp}`);

            // Limpiar Redis si se solicita
            if (clearBefore) {
                console.log('🧹 Limpiando Redis antes de restaurar...');
                await this.redisClient.flushDb();
            }

            // Restaurar cada clave
            let restored = 0;
            let failed = 0;

            for (const [key, data] of Object.entries(backupData.data)) {
                try {
                    const { type, value, ttl } = data;

                    switch (type) {
                        case 'string':
                            await this.redisClient.set(key, value);
                            break;
                        case 'list':
                            for (const item of value) {
                                await this.redisClient.rPush(key, item);
                            }
                            break;
                        case 'set':
                            for (const item of value) {
                                await this.redisClient.sAdd(key, item);
                            }
                            break;
                        case 'zset':
                            for (let i = 0; i < value.length; i += 2) {
                                await this.redisClient.zAdd(key, { score: parseFloat(value[i + 1]), value: value[i] });
                            }
                            break;
                        case 'hash':
                            for (const [field, val] of Object.entries(value)) {
                                await this.redisClient.hSet(key, field, val);
                            }
                            break;
                    }

                    // Restaurar TTL si existía
                    if (ttl && ttl > 0) {
                        await this.redisClient.expire(key, ttl);
                    }

                    restored++;
                } catch (error) {
                    console.error(`❌ Error restaurando clave ${key}:`, error.message);
                    failed++;
                }
            }

            const duration = Date.now() - startTime;
            console.log(`✅ Restauración completada en ${duration}ms`);
            console.log(`   ✓ ${restored} claves restauradas`);
            if (failed > 0) {
                console.log(`   ✗ ${failed} claves fallidas`);
            }

            return {
                success: true,
                restored,
                failed,
                duration
            };
        } catch (error) {
            console.error('❌ Error restaurando backup:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Lista todos los backups disponibles
     */
    async listBackups() {
        try {
            const files = await fs.readdir(this.config.backupDir);
            const backupFiles = files.filter(f => f.startsWith('redis-backup-') && f.endsWith('.json'));

            const backups = [];
            for (const file of backupFiles) {
                const filePath = path.join(this.config.backupDir, file);
                const stats = await fs.stat(filePath);

                backups.push({
                    file,
                    path: filePath,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime
                });
            }

            // Ordenar por fecha (más reciente primero)
            backups.sort((a, b) => b.created - a.created);

            return backups;
        } catch (error) {
            console.error('❌ Error listando backups:', error);
            return [];
        }
    }

    /**
     * Obtiene el backup más reciente
     */
    async getLatestBackup() {
        const backups = await this.listBackups();
        return backups.length > 0 ? backups[0] : null;
    }

    /**
     * Limpia backups antiguos según la configuración
     */
    async cleanupOldBackups() {
        try {
            const backups = await this.listBackups();

            if (backups.length <= this.config.maxBackups) {
                console.log(`✓ Solo hay ${backups.length} backups (límite: ${this.config.maxBackups})`);
                return;
            }

            // Eliminar backups que excedan el límite
            const toDelete = backups.slice(this.config.maxBackups);
            let deleted = 0;

            for (const backup of toDelete) {
                // También eliminar por antigüedad
                const ageInDays = (Date.now() - backup.created.getTime()) / (1000 * 60 * 60 * 24);

                if (ageInDays > this.config.retentionDays) {
                    await fs.unlink(backup.path);
                    console.log(`🗑️ Eliminado backup antiguo: ${backup.file}`);
                    deleted++;
                }
            }

            if (deleted > 0) {
                console.log(`✅ Limpieza completada: ${deleted} backups eliminados`);
            }
        } catch (error) {
            console.error('❌ Error limpiando backups antiguos:', error);
        }
    }

    /**
     * Asegura que el directorio de backups existe
     * @private
     */
    async _ensureBackupDirectory() {
        try {
            await fs.access(this.config.backupDir);
        } catch {
            await fs.mkdir(this.config.backupDir, { recursive: true });
            console.log(`📁 Directorio de backups creado: ${this.config.backupDir}`);
        }
    }

    /**
     * Exporta un backup a un formato legible
     */
    async exportBackup(backupFile, outputFormat = 'json') {
        try {
            const backupContent = await fs.readFile(backupFile, 'utf8');
            const backupData = JSON.parse(backupContent);

            if (outputFormat === 'csv') {
                // Exportar a CSV
                let csv = 'Key,Type,Value,TTL\n';
                for (const [key, data] of Object.entries(backupData.data)) {
                    const value = typeof data.value === 'object'
                        ? JSON.stringify(data.value).replace(/"/g, '""')
                        : data.value;
                    csv += `"${key}","${data.type}","${value}","${data.ttl || ''}"\n`;
                }
                return csv;
            }

            // Por defecto devolver JSON
            return JSON.stringify(backupData, null, 2);
        } catch (error) {
            console.error('❌ Error exportando backup:', error);
            return null;
        }
    }
}

module.exports = RedisBackup;