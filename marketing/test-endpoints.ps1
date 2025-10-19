# Script de prueba para endpoints de marketing (PowerShell)
# Ejecutar después de que el deploy en Render esté completo

$ApiUrl = "https://capibobbabot.onrender.com"

Write-Host "🧪 Iniciando pruebas de endpoints de marketing..." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Verificar servidor
Write-Host "1️⃣ Verificando servidor..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$ApiUrl/health" -Method Get
    if ($health.status -eq "healthy") {
        Write-Host "✅ Servidor OK" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Servidor no responde" -ForegroundColor Red
}
Write-Host ""

# Test 2: Listar campañas
Write-Host "2️⃣ Listando campañas existentes..." -ForegroundColor Yellow
try {
    $campaigns = Invoke-RestMethod -Uri "$ApiUrl/api/marketing/campaigns" -Method Get
    $campaigns | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Crear campaña
Write-Host "3️⃣ Creando campaña de prueba..." -ForegroundColor Yellow
$campaignBody = @{
    id = "test_tracking_2025_01"
    name = "Campaña de Prueba - Sistema de Tracking"
    templateName = "test_template"
    description = "Primera campaña de prueba para validar el sistema de tracking"
} | ConvertTo-Json

try {
    $campaign = Invoke-RestMethod -Uri "$ApiUrl/api/marketing/campaign/create" `
        -Method Post `
        -ContentType "application/json" `
        -Body $campaignBody

    $campaign | ConvertTo-Json -Depth 10

    if ($campaign.success) {
        Write-Host "✅ Campaña creada" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error creando campaña: $_" -ForegroundColor Red
}
Write-Host ""

# Test 4: Verificar en lista
Write-Host "4️⃣ Verificando que la campaña aparece en la lista..." -ForegroundColor Yellow
try {
    $campaigns = Invoke-RestMethod -Uri "$ApiUrl/api/marketing/campaigns" -Method Get
    $found = $campaigns.campaigns | Where-Object { $_.id -eq "test_tracking_2025_01" }

    if ($found) {
        Write-Host "✅ Campaña listada" -ForegroundColor Green
    } else {
        Write-Host "❌ Campaña no aparece" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 5: Obtener detalle
Write-Host "5️⃣ Obteniendo detalle de la campaña..." -ForegroundColor Yellow
try {
    $detail = Invoke-RestMethod -Uri "$ApiUrl/api/marketing/campaign/test_tracking_2025_01" -Method Get
    $detail | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 6: Obtener estadísticas
Write-Host "6️⃣ Obteniendo estadísticas de la campaña..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$ApiUrl/api/marketing/campaign/test_tracking_2025_01/stats" -Method Get
    $stats | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 7: Simular registro de mensaje
Write-Host "7️⃣ Simulando registro de mensaje..." -ForegroundColor Yellow
$messageBody = @{
    messageId = "wamid.TEST123456789"
    campaignId = "test_tracking_2025_01"
    recipient = "5215512345678"
    templateName = "test_template"
    sentAt = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
} | ConvertTo-Json

try {
    $message = Invoke-RestMethod -Uri "$ApiUrl/api/marketing/register-message" `
        -Method Post `
        -ContentType "application/json" `
        -Body $messageBody

    $message | ConvertTo-Json -Depth 10

    if ($message.success) {
        Write-Host "✅ Mensaje registrado" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error registrando mensaje: $_" -ForegroundColor Red
}
Write-Host ""

# Test 8: Verificar stats actualizadas
Write-Host "8️⃣ Verificando actualización de estadísticas..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$ApiUrl/api/marketing/campaign/test_tracking_2025_01/stats" -Method Get

    if ($stats.stats.stats.totalSent -eq 1) {
        Write-Host "✅ Stats actualizadas (totalSent: 1)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Stats no actualizadas (totalSent: $($stats.stats.stats.totalSent))" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 9: Obtener mensajes
Write-Host "9️⃣ Obteniendo mensajes de la campaña..." -ForegroundColor Yellow
try {
    $messages = Invoke-RestMethod -Uri "$ApiUrl/api/marketing/campaign/test_tracking_2025_01/messages" -Method Get
    $messages | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 10: Dashboard stats
Write-Host "🔟 Obteniendo estadísticas del dashboard..." -ForegroundColor Yellow
try {
    $dashboard = Invoke-RestMethod -Uri "$ApiUrl/api/marketing/dashboard-stats" -Method Get
    $dashboard | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ Pruebas completadas!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Verificar que todos los tests pasaron"
Write-Host "2. Revisar los logs en Render para confirmar que no hay errores"
Write-Host "3. Modificar el workflow de n8n (ID: qSKrf1OiNFS6ZbSu)"
Write-Host "4. Enviar mensajes reales de prueba"
Write-Host ""
Write-Host "📖 Consulta marketing/EJEMPLO_USO.md para más información" -ForegroundColor Cyan
