// check-security-health.js
// Script rápido para verificar el estado del sistema de seguridad en producción

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkSecurityHealth() {
    log('\n🔍 Verificando estado del sistema de seguridad...\n', 'cyan');

    let allPassed = true;

    // Test 1: Verificar endpoint de estadísticas
    try {
        log('📊 Verificando endpoint de estadísticas...', 'yellow');
        const response = await axios.get(`${BASE_URL}/api/security/stats`);

        if (response.status === 200) {
            log('✅ Endpoint de estadísticas: OK', 'green');
            log(`   - Total de alertas: ${response.data.alerts.total}`, 'cyan');
            log(`   - Alertas críticas: ${response.data.alerts.critical}`, 'cyan');
            log(`   - Usuarios bloqueados: ${response.data.blockedUsers}`, 'cyan');
        } else {
            log(`❌ Endpoint de estadísticas retornó código ${response.status}`, 'red');
            allPassed = false;
        }
    } catch (error) {
        if (error.response?.status === 503) {
            log('⚠️  Sistema de seguridad no inicializado todavía', 'yellow');
        } else {
            log(`❌ Error verificando estadísticas: ${error.message}`, 'red');
        }
        allPassed = false;
    }

    // Test 2: Verificar endpoint de alertas
    try {
        log('\n🚨 Verificando endpoint de alertas...', 'yellow');
        const response = await axios.get(`${BASE_URL}/api/security/alerts`);

        if (response.status === 200) {
            log('✅ Endpoint de alertas: OK', 'green');
            const alertCount = response.data.alerts.length;
            log(`   - Alertas activas: ${alertCount}`, 'cyan');

            if (alertCount > 0) {
                log('   - Últimas alertas:', 'cyan');
                response.data.alerts.slice(0, 3).forEach(alert => {
                    log(`     • [${alert.severity.toUpperCase()}] ${alert.type}`, 'yellow');
                });
            }
        } else {
            log(`❌ Endpoint de alertas retornó código ${response.status}`, 'red');
            allPassed = false;
        }
    } catch (error) {
        if (error.response?.status === 503) {
            log('⚠️  Sistema de seguridad no inicializado todavía', 'yellow');
        } else {
            log(`❌ Error verificando alertas: ${error.message}`, 'red');
        }
        allPassed = false;
    }

    // Test 3: Verificar endpoint de backups
    try {
        log('\n💾 Verificando backups disponibles...', 'yellow');
        const response = await axios.get(`${BASE_URL}/api/security/backups`);

        if (response.status === 200) {
            log('✅ Endpoint de backups: OK', 'green');
            const backupCount = response.data.backups.length;
            log(`   - Backups disponibles: ${backupCount}`, 'cyan');

            if (backupCount > 0) {
                const latest = response.data.backups[0];
                const date = new Date(latest.created);
                log(`   - Último backup: ${date.toLocaleString()}`, 'cyan');
                log(`   - Tamaño: ${(latest.size / 1024).toFixed(2)} KB`, 'cyan');
            } else {
                log('   ⚠️  No hay backups disponibles todavía', 'yellow');
            }
        } else {
            log(`❌ Endpoint de backups retornó código ${response.status}`, 'red');
            allPassed = false;
        }
    } catch (error) {
        if (error.response?.status === 503) {
            log('⚠️  Sistema de seguridad no inicializado todavía', 'yellow');
        } else {
            log(`❌ Error verificando backups: ${error.message}`, 'red');
        }
        allPassed = false;
    }

    // Test 4: Verificar endpoint raíz (bot activo)
    try {
        log('\n🤖 Verificando que el bot esté activo...', 'yellow');
        const response = await axios.get(BASE_URL);

        if (response.status === 200) {
            log('✅ Bot activo y respondiendo', 'green');
        } else {
            log(`❌ Bot retornó código ${response.status}`, 'red');
            allPassed = false;
        }
    } catch (error) {
        log(`❌ Error verificando bot: ${error.message}`, 'red');
        allPassed = false;
    }

    // Resumen final
    log('\n' + '='.repeat(60), 'cyan');
    if (allPassed) {
        log('✅ SISTEMA DE SEGURIDAD: OPERATIVO', 'green');
    } else {
        log('⚠️  SISTEMA DE SEGURIDAD: VERIFICACIÓN INCOMPLETA', 'yellow');
        log('   Algunas verificaciones fallaron. Revisa los logs arriba.', 'yellow');
    }
    log('='.repeat(60) + '\n', 'cyan');
}

// Ejecutar verificación
checkSecurityHealth().catch(error => {
    log('\n❌ ERROR FATAL: ' + error.message, 'red');
    console.error(error);
    process.exit(1);
});