# Script de Monitoreo de Campana - CapiBobbaBot Marketing
# Uso: .\monitor-campaign.ps1 -campaignId "promo_capicombovideo_18_10_25" -interval 30

param(
    [string]$campaignId = "promo_capicombovideo_18_10_25",
    [int]$interval = 30,
    [string]$baseUrl = "https://capibobbabot.onrender.com"
)

# Configurar encoding UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Colores
function Write-Success { param($message) Write-Host $message -ForegroundColor Green }
function Write-Warning { param($message) Write-Host $message -ForegroundColor Yellow }
function Write-Error { param($message) Write-Host $message -ForegroundColor Red }
function Write-Info { param($message) Write-Host $message -ForegroundColor Cyan }
function Write-Title { param($message) Write-Host $message -ForegroundColor Magenta }

# Funcion para hacer request HTTP
function Invoke-ApiRequest {
    param([string]$endpoint)
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl$endpoint" -Method Get -ContentType "application/json"
        return $response
    } catch {
        Write-Error "Error en request a ${endpoint}: $_"
        return $null
    }
}

# Funcion para mostrar estadisticas
function Show-CampaignStats {
    param($stats)

    Clear-Host
    Write-Title "`n=========================================="
    Write-Title "  Monitor de Campana - CapiBobbaBot"
    Write-Title "=========================================="
    Write-Host ""

    if (-not $stats -or -not $stats.success) {
        Write-Error "No se pudieron obtener las estadisticas"
        return
    }

    $campaign = $stats.stats.campaign
    $s = $stats.stats.stats
    $messages = $stats.stats.messages

    # Informacion de la campana
    Write-Title "Campana: $($campaign.name)"
    Write-Info "   ID: $($campaign.id)"
    Write-Info "   Template: $($campaign.templateName)"
    $createdDate = [DateTimeOffset]::FromUnixTimeMilliseconds($campaign.created).LocalDateTime
    Write-Info "   Creada: $($createdDate.ToString('yyyy-MM-dd HH:mm:ss'))"

    if ($campaign.active) {
        Write-Success "   Estado: Activa"
    } else {
        Write-Warning "   Estado: Inactiva"
    }

    Write-Host ""
    Write-Title "Metricas Generales"
    Write-Host "   =========================================="

    # Total enviados
    Write-Host "   Total Enviados:    " -NoNewline
    Write-Host "$($s.totalSent)" -ForegroundColor White -BackgroundColor DarkBlue

    # Entregados
    Write-Host "   Entregados:        " -NoNewline
    Write-Host "$($s.delivered) " -NoNewline -ForegroundColor White -BackgroundColor DarkGreen
    Write-Host "($($s.deliveryRate)%)" -ForegroundColor Green

    # Leidos
    Write-Host "   Leidos:            " -NoNewline
    if ($s.readRate -lt 10) {
        Write-Host "$($s.read) " -NoNewline -ForegroundColor White -BackgroundColor DarkRed
        Write-Host "($($s.readRate)%)" -ForegroundColor Red
    } elseif ($s.readRate -lt 30) {
        Write-Host "$($s.read) " -NoNewline -ForegroundColor Black -BackgroundColor Yellow
        Write-Host "($($s.readRate)%)" -ForegroundColor Yellow
    } else {
        Write-Host "$($s.read) " -NoNewline -ForegroundColor White -BackgroundColor DarkGreen
        Write-Host "($($s.readRate)%)" -ForegroundColor Green
    }

    # Fallidos
    Write-Host "   Fallidos:          " -NoNewline
    if ($s.failureRate -gt 15) {
        Write-Host "$($s.failed) " -NoNewline -ForegroundColor White -BackgroundColor DarkRed
        Write-Host "($($s.failureRate)%)" -ForegroundColor Red
    } elseif ($s.failureRate -gt 10) {
        Write-Host "$($s.failed) " -NoNewline -ForegroundColor Black -BackgroundColor Yellow
        Write-Host "($($s.failureRate)%)" -ForegroundColor Yellow
    } else {
        Write-Host "$($s.failed) " -NoNewline -ForegroundColor White -BackgroundColor DarkGreen
        Write-Host "($($s.failureRate)%)" -ForegroundColor Green
    }

    # Reacciones
    Write-Host "   Reacciones:        " -NoNewline
    if ($s.reactions -eq 0) {
        Write-Host "$($s.reactions) " -NoNewline -ForegroundColor Gray
        Write-Host "($($s.engagementRate)%)" -ForegroundColor Gray
    } else {
        Write-Host "$($s.reactions) " -NoNewline -ForegroundColor White -BackgroundColor DarkBlue
        Write-Host "($($s.engagementRate)%)" -ForegroundColor Cyan
    }

    Write-Host ""
    Write-Title "Distribucion de Estados"
    Write-Host "   =========================================="
    Write-Host "   En transito:       " -NoNewline
    Write-Host "$($messages.byStatus.sent)" -ForegroundColor Cyan
    Write-Host "   Entregados:        " -NoNewline
    Write-Host "$($messages.byStatus.delivered)" -ForegroundColor Green
    Write-Host "   Leidos:            " -NoNewline
    Write-Host "$($messages.byStatus.read)" -ForegroundColor Blue
    Write-Host "   Fallidos:          " -NoNewline
    Write-Host "$($messages.byStatus.failed)" -ForegroundColor Red

    Write-Host ""
    Write-Title "KPIs"
    Write-Host "   =========================================="

    # Delivery Rate
    Write-Host "   Tasa de Entrega:   " -NoNewline
    if ($s.deliveryRate -ge 85) {
        Write-Host "$($s.deliveryRate)% OK" -ForegroundColor Green
    } elseif ($s.deliveryRate -ge 75) {
        Write-Host "$($s.deliveryRate)% ALERTA" -ForegroundColor Yellow
    } else {
        Write-Host "$($s.deliveryRate)% CRITICO" -ForegroundColor Red
    }

    # Read Rate
    Write-Host "   Tasa de Lectura:   " -NoNewline
    if ($s.readRate -ge 30) {
        Write-Host "$($s.readRate)% OK" -ForegroundColor Green
    } elseif ($s.readRate -ge 15) {
        Write-Host "$($s.readRate)% ALERTA" -ForegroundColor Yellow
    } else {
        Write-Host "$($s.readRate)% BAJO" -ForegroundColor Red
    }

    # Engagement Rate
    Write-Host "   Tasa de Engagement:" -NoNewline
    if ($s.engagementRate -ge 5) {
        Write-Host "$($s.engagementRate)% OK" -ForegroundColor Green
    } elseif ($s.engagementRate -ge 2) {
        Write-Host "$($s.engagementRate)% ALERTA" -ForegroundColor Yellow
    } else {
        Write-Host "$($s.engagementRate)% BAJO" -ForegroundColor Red
    }

    Write-Host ""
    Write-Title "Alertas"
    Write-Host "   =========================================="

    $alertCount = 0

    if ($s.deliveryRate -lt 75) {
        Write-Error "   CRITICO: Tasa de entrega muy baja ($($s.deliveryRate)%)"
        $alertCount++
    }

    if ($s.failureRate -gt 15) {
        Write-Error "   CRITICO: Tasa de fallas muy alta ($($s.failureRate)%)"
        $alertCount++
    }

    if ($s.readRate -lt 10 -and $s.totalSent -gt 50) {
        Write-Warning "   ALERTA: Tasa de lectura baja ($($s.readRate)%)"
        $alertCount++
    }

    if ($messages.byStatus.sent -gt 10) {
        Write-Warning "   ALERTA: $($messages.byStatus.sent) mensajes aun en transito"
        $alertCount++
    }

    if ($s.reactions -eq 0 -and $s.totalSent -gt 50) {
        Write-Warning "   ALERTA: Sin reacciones aun"
        $alertCount++
    }

    if ($alertCount -eq 0) {
        Write-Success "   OK: No hay alertas activas"
    }

    Write-Host ""
    Write-Host "==========================================" -ForegroundColor DarkGray
    Write-Host "Ultima actualizacion: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
    Write-Host "Proxima actualizacion en $interval segundos..." -ForegroundColor Gray
    Write-Host "Presiona Ctrl+C para salir" -ForegroundColor DarkGray
}

# Funcion para obtener reacciones
function Show-ReactionStats {
    $reactions = Invoke-ApiRequest "/api/marketing/campaign/$campaignId/reactions"

    if ($reactions -and $reactions.success -and $reactions.stats.total -gt 0) {
        Write-Host ""
        Write-Title "Analisis de Reacciones"
        Write-Host "   =========================================="
        Write-Host "   Total: $($reactions.stats.total)" -ForegroundColor Cyan
        Write-Host "   Positivas: $($reactions.stats.bySentiment.positive) " -NoNewline -ForegroundColor Green
        Write-Host "($($reactions.stats.sentimentRate.positive)%)" -ForegroundColor Green
        Write-Host "   Negativas: $($reactions.stats.bySentiment.negative) " -NoNewline -ForegroundColor Red
        Write-Host "($($reactions.stats.sentimentRate.negative)%)" -ForegroundColor Red
        Write-Host "   Neutrales: $($reactions.stats.bySentiment.neutral) " -NoNewline -ForegroundColor Gray
        Write-Host "($($reactions.stats.sentimentRate.neutral)%)" -ForegroundColor Gray

        if ($reactions.stats.topEmojis.Count -gt 0) {
            Write-Host ""
            Write-Host "   Top Emojis:" -ForegroundColor Yellow
            $reactions.stats.topEmojis | Select-Object -First 5 | ForEach-Object {
                Write-Host "      $($_.emoji) x$($_.count)" -ForegroundColor White
            }
        }
    }
}

# Banner inicial
Clear-Host
Write-Title "`n=========================================="
Write-Title "  Monitor de Campana - CapiBobbaBot"
Write-Title "=========================================="
Write-Host ""
Write-Info "Campana: $campaignId"
Write-Info "Intervalo: $interval segundos"
Write-Info "URL Base: $baseUrl"
Write-Host ""
Write-Warning "Iniciando monitoreo..."
Start-Sleep -Seconds 2

# Loop principal
try {
    while ($true) {
        # Obtener estadisticas
        $stats = Invoke-ApiRequest "/api/marketing/campaign/$campaignId/stats"

        # Mostrar estadisticas
        Show-CampaignStats -stats $stats

        # Mostrar reacciones si hay
        Show-ReactionStats

        # Esperar
        Start-Sleep -Seconds $interval
    }
} catch {
    Write-Error "`nMonitoreo detenido: $_"
}

Write-Host "`nMonitoreo finalizado." -ForegroundColor Gray
