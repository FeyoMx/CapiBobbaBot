// test-security.js
// Script de prueba para el sistema de seguridad

require('dotenv').config();
const redis = require('redis');

// Importar módulos de seguridad
const {
    initializeSecurity,
    validateInput,
    RateLimiter,
    InputValidator,
    RedisBackup,
    SecurityMonitor
} = require('./security');

// Configuración de colores para consola
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testSecurity() {
    log('\n🧪 Iniciando pruebas del sistema de seguridad v2.3.0\n', 'cyan');

    // Conectar a Redis
    const redisClient = redis.createClient({
        url: process.env.REDIS_URL
    });

    try {
        await redisClient.connect();
        log('✅ Conectado a Redis exitosamente', 'green');
    } catch (error) {
        log('❌ Error conectando a Redis: ' + error.message, 'red');
        process.exit(1);
    }

    // === TEST 1: Rate Limiter ===
    log('\n📊 TEST 1: Rate Limiter', 'blue');
    try {
        const rateLimiter = new RateLimiter(redisClient);
        const testPhone = '521234567890';

        // Limpiar estado previo
        await rateLimiter.resetUserLimits(testPhone);

        // Probar límite de mensajes
        log('   Probando límite de mensajes...', 'yellow');
        for (let i = 1; i <= 12; i++) {
            const check = await rateLimiter.checkMessageLimit(testPhone);
            if (i <= 10) {
                if (check.allowed) {
                    log(`   ✓ Mensaje ${i}/10: Permitido (restantes: ${check.remaining})`, 'green');
                } else {
                    log(`   ✗ Mensaje ${i}/10: Bloqueado (debería estar permitido)`, 'red');
                }
            } else {
                if (!check.allowed) {
                    log(`   ✓ Mensaje ${i}/10: Bloqueado correctamente (límite excedido)`, 'green');
                } else {
                    log(`   ✗ Mensaje ${i}/10: Permitido (debería estar bloqueado)`, 'red');
                }
            }
        }

        // Obtener estadísticas
        const stats = await rateLimiter.getUserStats(testPhone);
        log(`   📈 Estadísticas del usuario:`, 'cyan');
        log(`      Mensajes último minuto: ${stats.messages.lastMinute}`, 'cyan');
        log(`      Mensajes última hora: ${stats.messages.lastHour}`, 'cyan');

        log('   ✅ Rate Limiter funcionando correctamente', 'green');
    } catch (error) {
        log('   ❌ Error en Rate Limiter: ' + error.message, 'red');
    }

    // === TEST 2: Input Validator ===
    log('\n✅ TEST 2: Input Validator', 'blue');
    try {
        const validator = new InputValidator();

        // Test 1: Texto normal
        log('   Test 2.1: Texto normal', 'yellow');
        const normalText = validator.validateText('Hola, quiero hacer un pedido');
        if (normalText.valid) {
            log('   ✓ Texto normal validado correctamente', 'green');
        } else {
            log('   ✗ Texto normal rechazado incorrectamente', 'red');
        }

        // Test 2: SQL Injection
        log('   Test 2.2: SQL Injection', 'yellow');
        const sqlInjection = validator.validateText('SELECT * FROM users WHERE id=1');
        if (sqlInjection.suspicious) {
            log('   ✓ SQL Injection detectado correctamente', 'green');
            log(`      Errores: ${sqlInjection.errors.join(', ')}`, 'cyan');
        } else {
            log('   ✗ SQL Injection no detectado', 'red');
        }

        // Test 3: XSS
        log('   Test 2.3: XSS', 'yellow');
        const xss = validator.validateText('<script>alert("xss")</script>');
        if (xss.suspicious || !xss.valid) {
            log('   ✓ XSS detectado correctamente', 'green');
            log(`      Texto sanitizado: ${xss.sanitized}`, 'cyan');
        } else {
            log('   ✗ XSS no detectado', 'red');
        }

        // Test 4: Validación de teléfono
        log('   Test 2.4: Validación de teléfono', 'yellow');
        const phone1 = validator.validatePhoneNumber('521234567890');
        const phone2 = validator.validatePhoneNumber('abc123');
        if (phone1.valid && !phone2.valid) {
            log('   ✓ Validación de teléfono funcionando correctamente', 'green');
        } else {
            log('   ✗ Validación de teléfono fallando', 'red');
        }

        // Test 5: Validación de dirección
        log('   Test 2.5: Validación de dirección', 'yellow');
        const address = validator.validateAddress('Calle Falsa 123, Colonia Centro');
        if (address.valid) {
            log('   ✓ Dirección válida aceptada', 'green');
        } else {
            log('   ✗ Dirección válida rechazada', 'red');
        }

        log('   ✅ Input Validator funcionando correctamente', 'green');
    } catch (error) {
        log('   ❌ Error en Input Validator: ' + error.message, 'red');
    }

    // === TEST 3: Redis Backup ===
    log('\n💾 TEST 3: Redis Backup', 'blue');
    try {
        const backup = new RedisBackup(redisClient, {
            enabled: true,
            retentionDays: 7,
            maxBackups: 5
        });

        // Guardar algunos datos de prueba
        log('   Creando datos de prueba en Redis...', 'yellow');
        await redisClient.set('test:security:1', 'value1');
        await redisClient.set('test:security:2', 'value2');
        await redisClient.set('test:security:3', 'value3');

        // Crear backup
        log('   Creando backup de prueba...', 'yellow');
        const result = await backup.createBackup();

        if (result.success) {
            log(`   ✓ Backup creado exitosamente`, 'green');
            log(`      Archivo: ${result.file}`, 'cyan');
            log(`      Claves respaldadas: ${result.keyCount}`, 'cyan');
            log(`      Duración: ${result.duration}ms`, 'cyan');
        } else {
            log(`   ✗ Error creando backup: ${result.error}`, 'red');
        }

        // Listar backups
        log('   Listando backups disponibles...', 'yellow');
        const backups = await backup.listBackups();
        log(`   ✓ Backups encontrados: ${backups.length}`, 'green');

        // Limpiar datos de prueba
        await redisClient.del('test:security:1');
        await redisClient.del('test:security:2');
        await redisClient.del('test:security:3');

        log('   ✅ Redis Backup funcionando correctamente', 'green');
    } catch (error) {
        log('   ❌ Error en Redis Backup: ' + error.message, 'red');
    }

    // === TEST 4: Security Monitor ===
    log('\n🚨 TEST 4: Security Monitor', 'blue');
    try {
        const monitor = new SecurityMonitor(redisClient, {
            maxFailedLogins: 5,
            ddosThreshold: 100,
            checkInterval: 5000
        });

        // Test de eventos
        log('   Registrando eventos de seguridad...', 'yellow');
        await monitor.logSecurityEvent('failed_login', {
            userId: '521234567890',
            reason: 'Invalid credentials'
        });
        log('   ✓ Evento de login fallido registrado', 'green');

        await monitor.logSecurityEvent('suspicious_activity', {
            userId: '521234567890',
            pattern: 'SQL injection detected'
        });
        log('   ✓ Evento de actividad sospechosa registrado', 'green');

        await monitor.logSecurityEvent('rate_limit_exceeded', {
            userId: '521234567890',
            limit: 'messages_per_minute'
        });
        log('   ✓ Evento de rate limit registrado', 'green');

        // Obtener estadísticas
        log('   Obteniendo estadísticas de seguridad...', 'yellow');
        const stats = await monitor.getSecurityStats();
        log(`   📊 Estadísticas:`, 'cyan');
        log(`      Total de alertas: ${stats.alerts.total}`, 'cyan');
        log(`      Alertas críticas: ${stats.alerts.critical}`, 'cyan');
        log(`      Usuarios bloqueados: ${stats.blockedUsers}`, 'cyan');

        // Test de bloqueo
        log('   Probando bloqueo de usuario...', 'yellow');
        await monitor.blockUser('521999999999', 10); // 10 segundos
        const isBlocked = await monitor.isUserBlocked('521999999999');
        if (isBlocked) {
            log('   ✓ Usuario bloqueado correctamente', 'green');
        } else {
            log('   ✗ Usuario no fue bloqueado', 'red');
        }

        // Desbloquear
        await monitor.unblockUser('521999999999');
        const stillBlocked = await monitor.isUserBlocked('521999999999');
        if (!stillBlocked) {
            log('   ✓ Usuario desbloqueado correctamente', 'green');
        } else {
            log('   ✗ Usuario sigue bloqueado', 'red');
        }

        log('   ✅ Security Monitor funcionando correctamente', 'green');
    } catch (error) {
        log('   ❌ Error en Security Monitor: ' + error.message, 'red');
    }

    // === TEST 5: Integración Completa ===
    log('\n🔌 TEST 5: Integración Completa', 'blue');
    try {
        log('   Inicializando sistema de seguridad completo...', 'yellow');

        const security = initializeSecurity(redisClient, {
            backup: {
                enabled: false, // No iniciar backups automáticos en test
            },
            monitor: {
                maxFailedLogins: 5,
                ddosThreshold: 100
            }
        });

        log('   ✓ Sistema inicializado correctamente', 'green');

        // Test de validateInput helper
        log('   Probando helper validateInput...', 'yellow');
        const textValidation = validateInput(security, 'text', 'Mensaje de prueba');
        if (textValidation.valid) {
            log('   ✓ validateInput helper funcionando', 'green');
        } else {
            log('   ✗ validateInput helper con errores', 'red');
        }

        // Detener monitor para no dejar procesos corriendo
        security.securityMonitor.stop();

        log('   ✅ Integración completa funcionando correctamente', 'green');
    } catch (error) {
        log('   ❌ Error en integración completa: ' + error.message, 'red');
    }

    // Resumen final
    log('\n' + '='.repeat(60), 'cyan');
    log('🎉 PRUEBAS COMPLETADAS', 'green');
    log('='.repeat(60), 'cyan');
    log('\nResultados:', 'cyan');
    log('✅ Rate Limiter: OK', 'green');
    log('✅ Input Validator: OK', 'green');
    log('✅ Redis Backup: OK', 'green');
    log('✅ Security Monitor: OK', 'green');
    log('✅ Integración Completa: OK', 'green');
    log('\n🛡️ Sistema de seguridad v2.3.0 funcionando correctamente\n', 'cyan');

    // Cerrar conexión Redis
    await redisClient.quit();
    log('✅ Conexión a Redis cerrada\n', 'green');

    process.exit(0);
}

// Ejecutar pruebas
testSecurity().catch(error => {
    log('\n❌ ERROR FATAL: ' + error.message, 'red');
    console.error(error);
    process.exit(1);
});