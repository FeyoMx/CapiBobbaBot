// monitoring-client.js - Cliente WebSocket para Dashboard de Monitoreo
class MonitoringClient {
    constructor() {
        this.ws = null;
        this.clientId = null;
        this.isConnected = false;
        this.autoRefresh = true;
        this.activityPaused = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 5000;

        // Charts
        this.charts = {
            system: null,
            business: null,
            performance: null
        };

        // Data storage
        this.data = {
            metrics: null,
            health: null,
            alerts: [],
            activities: []
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeCharts();
        this.connectWebSocket();

        // Inicializar modal handlers
        this.setupModals();

        console.log('🚀 Monitoring Client iniciado');
    }

    setupEventListeners() {
        // Header buttons
        document.getElementById('toggle-auto-refresh')?.addEventListener('click', () => {
            this.toggleAutoRefresh();
        });

        document.getElementById('refresh-now')?.addEventListener('click', () => {
            this.requestDataRefresh();
        });

        document.getElementById('emergency-maintenance')?.addEventListener('click', () => {
            this.showMaintenanceModal();
        });

        // Activity controls
        document.getElementById('pause-activity')?.addEventListener('click', () => {
            this.toggleActivityFeed();
        });

        document.getElementById('clear-activity')?.addEventListener('click', () => {
            this.clearActivityFeed();
        });

        // Business timeframe selector
        document.getElementById('business-timeframe')?.addEventListener('change', (e) => {
            this.updateBusinessTimeframe(e.target.value);
        });

        // Window events
        window.addEventListener('beforeunload', () => {
            this.disconnect();
        });

        window.addEventListener('focus', () => {
            if (!this.isConnected) {
                this.connectWebSocket();
            }
        });
    }

    connectWebSocket() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.hostname;

            // En producción (Render.com), usar el mismo puerto que la aplicación
            // En desarrollo local, usar puerto específico 3001
            let wsUrl;
            if (host === 'localhost' || host === '127.0.0.1') {
                // Desarrollo local
                wsUrl = `${protocol}//${host}:3001`;
            } else {
                // Producción - usar el mismo puerto/host
                wsUrl = `${protocol}//${host}`;
            }

            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = (event) => {
                this.onWebSocketOpen(event);
            };

            this.ws.onmessage = (event) => {
                this.onWebSocketMessage(event);
            };

            this.ws.onclose = (event) => {
                this.onWebSocketClose(event);
            };

            this.ws.onerror = (error) => {
                this.onWebSocketError(error);
            };

            this.updateConnectionStatus('connecting', 'Conectando...');

        } catch (error) {
            console.error('❌ Error conectando WebSocket:', error);
            this.updateConnectionStatus('disconnected', 'Error de conexión');
            this.scheduleReconnect();
        }
    }

    onWebSocketOpen(event) {
        console.log('✅ WebSocket conectado');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.updateConnectionStatus('connected', 'Conectado');

        // Suscribirse a todos los canales
        this.subscribe(['metrics', 'health', 'alerts', 'business']);

        this.addActivity('system', 'Conectado al monitor en tiempo real', 'Conexión establecida');
    }

    onWebSocketMessage(event) {
        try {
            const message = JSON.parse(event.data);
            this.handleWebSocketMessage(message);
        } catch (error) {
            console.error('❌ Error procesando mensaje WebSocket:', error);
        }
    }

    onWebSocketClose(event) {
        console.log('🔌 WebSocket desconectado:', event.code, event.reason);
        this.isConnected = false;
        this.updateConnectionStatus('disconnected', 'Desconectado');

        if (event.code !== 1000) { // No fue cierre normal
            this.scheduleReconnect();
        }
    }

    onWebSocketError(error) {
        console.error('❌ Error WebSocket:', error);
        this.updateConnectionStatus('disconnected', 'Error de conexión');
    }

    handleWebSocketMessage(message) {
        switch (message.type) {
            case 'welcome':
                this.clientId = message.clientId;
                console.log(`🎉 Bienvenido! Cliente ID: ${this.clientId}`);
                break;

            case 'initial_metrics':
            case 'metrics_update':
                this.updateMetrics(message.data);
                break;

            case 'initial_health':
            case 'health_update':
                this.updateHealthStatus(message.data);
                break;

            case 'initial_alerts':
            case 'new_alerts':
                this.updateAlerts(message.data);
                break;

            case 'new_message':
                this.addActivity('message', 'Nuevo mensaje recibido', `De: ${message.data.from}`);
                break;

            case 'new_order':
                this.addActivity('order', 'Nuevo pedido recibido', `Total: $${message.data.total}`);
                break;

            case 'system_error':
                this.addActivity('error', 'Error del sistema', message.data.message);
                break;

            case 'maintenance_mode':
                this.handleMaintenanceMode(message.enabled);
                break;

            case 'alert_acknowledged':
                this.handleAlertAcknowledged(message.alertId);
                break;

            case 'error':
                console.error('❌ Error del servidor:', message.message);
                break;

            default:
                console.log('📨 Mensaje no manejado:', message.type);
        }

        this.updateLastUpdateTime();
    }

    updateMetrics(metrics) {
        this.data.metrics = metrics;

        // Actualizar métricas del sistema
        this.updateSystemMetrics(metrics.system);

        // Actualizar métricas de negocio
        if (metrics.business) {
            this.updateBusinessMetrics(metrics.business);
        }

        // Actualizar métricas de rendimiento
        if (metrics.performance) {
            this.updatePerformanceMetrics(metrics.performance);
        }

        // Actualizar información del sistema
        if (metrics.system.info) {
            this.updateSystemInfo(metrics.system.info);
        }

        // Actualizar charts
        this.updateCharts();
    }

    updateSystemMetrics(system) {
        // CPU
        if (system.cpu) {
            const cpuElement = document.getElementById('cpu-usage');
            const cpuBar = document.getElementById('cpu-bar');

            if (cpuElement && cpuBar) {
                const cpuValue = Math.round(system.cpu.currentLoad);
                cpuElement.textContent = `${cpuValue}%`;
                cpuBar.style.width = `${cpuValue}%`;

                // Cambiar color según el valor
                cpuBar.className = 'metric-fill';
                if (cpuValue > 80) cpuBar.classList.add('danger');
                else if (cpuValue > 60) cpuBar.classList.add('warning');
            }
        }

        // Memoria
        if (system.memory) {
            const memoryElement = document.getElementById('memory-usage');
            const memoryBar = document.getElementById('memory-bar');

            if (memoryElement && memoryBar) {
                const memoryValue = Math.round(system.memory.usagePercent);
                memoryElement.textContent = `${memoryValue}%`;
                memoryBar.style.width = `${memoryValue}%`;

                // Cambiar color según el valor
                memoryBar.className = 'metric-fill';
                if (memoryValue > 85) memoryBar.classList.add('danger');
                else if (memoryValue > 70) memoryBar.classList.add('warning');
            }
        }
    }

    updateBusinessMetrics(business) {
        // Pedidos hoy
        const ordersElement = document.getElementById('orders-today');
        if (ordersElement) {
            ordersElement.textContent = business.ordersToday || 0;
        }

        // Ingresos 24h
        const revenueElement = document.getElementById('revenue-today');
        if (revenueElement) {
            revenueElement.textContent = `$${Math.round(business.revenue24h || 0)}`;
        }

        // Mensajes por hora
        const messagesElement = document.getElementById('messages-hour');
        if (messagesElement) {
            messagesElement.textContent = business.messagesPerHour || 0;
        }

        // Tasa de conversión
        const conversionElement = document.getElementById('conversion-rate');
        if (conversionElement) {
            conversionElement.textContent = `${business.conversionRate || 0}%`;
        }
    }

    updatePerformanceMetrics(performance) {
        // Tiempo de respuesta promedio
        const responseTimeElement = document.getElementById('avg-response-time');
        if (responseTimeElement) {
            responseTimeElement.textContent = `${performance.avgResponseTime || 0}ms`;
        }

        // Tasa de error
        const errorRateElement = document.getElementById('error-rate');
        if (errorRateElement) {
            errorRateElement.textContent = `${(performance.errorRate * 100).toFixed(2)}%`;
        }

        // Throughput
        const throughputElement = document.getElementById('throughput');
        if (throughputElement) {
            throughputElement.textContent = `${performance.throughput.toFixed(1)} msg/s`;
        }
    }

    updateHealthStatus(health) {
        this.data.health = health;

        // Actualizar estado general del sistema
        const systemStatusCard = document.getElementById('system-health-card');
        const systemStatusValue = document.getElementById('system-status');
        const systemUptime = document.getElementById('system-uptime');

        if (systemStatusCard && systemStatusValue) {
            // Remover clases anteriores
            systemStatusCard.classList.remove('healthy', 'warning', 'critical');

            // Agregar clase según estado
            switch (health.status) {
                case 'healthy':
                    systemStatusCard.classList.add('healthy');
                    systemStatusValue.textContent = 'Saludable';
                    break;
                case 'degraded':
                    systemStatusCard.classList.add('warning');
                    systemStatusValue.textContent = 'Degradado';
                    break;
                case 'unhealthy':
                    systemStatusCard.classList.add('critical');
                    systemStatusValue.textContent = 'Crítico';
                    break;
                default:
                    systemStatusValue.textContent = 'Desconocido';
            }
        }

        if (systemUptime && this.data.metrics) {
            const uptime = this.formatUptime(this.data.metrics.uptime);
            systemUptime.textContent = `Uptime: ${uptime}`;
        }

        // Actualizar estado de servicios individuales
        this.updateServiceStatus('bot', health.checks.find(c => c.name === 'bot_connectivity'));
        this.updateServiceStatus('webhook', health.checks.find(c => c.name === 'webhook_connectivity'));
        this.updateServiceStatus('redis', health.checks.find(c => c.name === 'redis_connection'));
    }

    updateServiceStatus(service, check) {
        const card = document.getElementById(`${service}-status-card`);
        const status = document.getElementById(`${service}-status`);

        if (!card || !status || !check) return;

        // Remover clases anteriores
        card.classList.remove('healthy', 'warning', 'critical');

        // Agregar clase según estado
        switch (check.status) {
            case 'pass':
                card.classList.add('healthy');
                status.textContent = 'Conectado';
                break;
            case 'warn':
                card.classList.add('warning');
                status.textContent = 'Advertencia';
                break;
            case 'fail':
                card.classList.add('critical');
                status.textContent = 'Error';
                break;
            default:
                status.textContent = 'Desconocido';
        }

        // Actualizar detalles específicos
        if (service === 'bot' && check.details) {
            const responseTime = document.getElementById('bot-response-time');
            if (responseTime) {
                responseTime.textContent = `Respuesta: ${check.details.responseTime || 0}ms`;
            }
        }

        if (service === 'webhook' && check.details) {
            const calls = document.getElementById('webhook-calls');
            if (calls) {
                calls.textContent = `Calls 24h: ${check.details.calls24h || 0}`;
            }
        }

        if (service === 'redis' && check.details) {
            const memory = document.getElementById('redis-memory');
            if (memory) {
                memory.textContent = `Memoria: ${check.details.usedMemory || 0}MB`;
            }
        }
    }

    updateAlerts(alerts) {
        if (!Array.isArray(alerts)) return;

        this.data.alerts = alerts;

        const alertsContainer = document.getElementById('alerts-container');
        const alertCount = document.getElementById('alert-count');

        if (!alertsContainer || !alertCount) return;

        // Actualizar contador
        alertCount.textContent = alerts.length;
        alertCount.classList.toggle('zero', alerts.length === 0);

        // Limpiar contenedor
        alertsContainer.innerHTML = '';

        if (alerts.length === 0) {
            alertsContainer.innerHTML = `
                <div class="no-alerts">
                    <i class="fas fa-check-circle"></i>
                    <p>No hay alertas activas</p>
                </div>
            `;
            return;
        }

        // Mostrar alertas
        alerts.forEach(alert => {
            const alertElement = this.createAlertElement(alert);
            alertsContainer.appendChild(alertElement);
        });
    }

    createAlertElement(alert) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert-item ${alert.type || 'fail'}`;
        alertDiv.dataset.alertId = alert.id;

        const timeAgo = this.timeAgo(alert.timestamp);

        alertDiv.innerHTML = `
            <div class="alert-header">
                <div class="alert-title">${alert.source || 'Sistema'}</div>
                <div class="alert-time">${timeAgo}</div>
            </div>
            <div class="alert-message">${alert.message}</div>
            <div class="alert-actions">
                <button class="alert-btn acknowledge" onclick="monitoringClient.acknowledgeAlert('${alert.id}')">
                    Reconocer
                </button>
                <button class="alert-btn details" onclick="monitoringClient.showAlertDetails('${alert.id}')">
                    Detalles
                </button>
            </div>
        `;

        return alertDiv;
    }

    acknowledgeAlert(alertId) {
        if (this.isConnected) {
            this.send({
                type: 'acknowledge_alert',
                alertId: alertId
            });
        }
    }

    handleAlertAcknowledged(alertId) {
        const alertElement = document.querySelector(`[data-alert-id="${alertId}"]`);
        if (alertElement) {
            alertElement.style.opacity = '0.5';
            alertElement.querySelector('.acknowledge').disabled = true;
            alertElement.querySelector('.acknowledge').textContent = 'Reconocido';
        }

        // Actualizar contador de alertas
        const remainingAlerts = this.data.alerts.filter(a => a.id !== alertId);
        this.updateAlerts(remainingAlerts);
    }

    showAlertDetails(alertId) {
        const alert = this.data.alerts.find(a => a.id === alertId);
        if (alert) {
            // Crear modal con detalles (implementación simplificada)
            alert(`Detalles de Alerta:\n\nOrigen: ${alert.source}\nMensaje: ${alert.message}\nTiempo: ${alert.timestamp}\nDetalles: ${JSON.stringify(alert.details, null, 2)}`);
        }
    }

    addActivity(type, title, description) {
        if (this.activityPaused) return;

        const activityFeed = document.getElementById('activity-feed');
        if (!activityFeed) return;

        const activity = {
            id: Date.now(),
            type: type,
            title: title,
            description: description,
            timestamp: new Date().toISOString()
        };

        this.data.activities.unshift(activity);

        // Mantener solo las últimas 10 actividades para 512MB
        if (this.data.activities.length > 10) {
            this.data.activities = this.data.activities.slice(0, 10);
        }

        const activityElement = this.createActivityElement(activity);
        activityFeed.insertBefore(activityElement, activityFeed.firstChild);

        // Remover actividades antiguas del DOM (reducido para 512MB)
        const activityElements = activityFeed.querySelectorAll('.activity-item');
        if (activityElements.length > 5) {
            for (let i = 5; i < activityElements.length; i++) {
                activityElements[i].remove();
            }
        }
    }

    createActivityElement(activity) {
        const activityDiv = document.createElement('div');
        activityDiv.className = `activity-item ${activity.type} fade-in`;

        const timeAgo = this.timeAgo(activity.timestamp);

        activityDiv.innerHTML = `
            <div class="activity-icon">
                <i class="fas fa-${this.getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-time">${timeAgo}</div>
            </div>
        `;

        return activityDiv;
    }

    getActivityIcon(type) {
        const icons = {
            message: 'comment',
            order: 'shopping-cart',
            error: 'exclamation-triangle',
            system: 'cog',
            warning: 'exclamation-circle',
            info: 'info-circle'
        };
        return icons[type] || 'circle';
    }

    updateSystemInfo(info) {
        const nodeVersion = document.getElementById('node-version');
        const platform = document.getElementById('platform');
        const hostname = document.getElementById('hostname');

        if (nodeVersion) nodeVersion.textContent = info.nodeVersion || '--';
        if (platform) platform.textContent = info.platform || '--';
        if (hostname) hostname.textContent = info.hostname || '--';
    }

    initializeCharts() {
        // Chart.js configuración por defecto
        Chart.defaults.backgroundColor = 'rgba(37, 99, 235, 0.1)';
        Chart.defaults.borderColor = 'rgba(37, 99, 235, 0.8)';
        Chart.defaults.color = '#cbd5e1';

        // Inicializar gráfico del sistema
        const systemCanvas = document.getElementById('system-chart');
        if (systemCanvas) {
            this.charts.system = new Chart(systemCanvas, {
                type: 'line',
                data: {
                    labels: Array.from({length: 5}, (_, i) => i),
                    datasets: [{
                        label: 'CPU %',
                        data: Array(5).fill(0),
                        borderColor: 'rgba(37, 99, 235, 0.8)',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        tension: 0.4
                    }, {
                        label: 'Memoria %',
                        data: Array(5).fill(0),
                        borderColor: 'rgba(16, 185, 129, 0.8)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#cbd5e1'
                            }
                        }
                    },
                    scales: {
                        x: {
                            display: false
                        },
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                color: '#64748b'
                            },
                            grid: {
                                color: 'rgba(100, 116, 139, 0.2)'
                            }
                        }
                    }
                }
            });
        }

        // Inicializar gráfico de negocio
        const businessCanvas = document.getElementById('business-chart');
        if (businessCanvas) {
            this.charts.business = new Chart(businessCanvas, {
                type: 'bar',
                data: {
                    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                    datasets: [{
                        label: 'Pedidos',
                        data: [0, 0, 0, 0, 0, 0, 0],
                        backgroundColor: 'rgba(37, 99, 235, 0.8)'
                    }, {
                        label: 'Ingresos',
                        data: [0, 0, 0, 0, 0, 0, 0],
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        yAxisID: 'y1'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#cbd5e1'
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                color: '#64748b'
                            },
                            grid: {
                                color: 'rgba(100, 116, 139, 0.2)'
                            }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            ticks: {
                                color: '#64748b'
                            },
                            grid: {
                                color: 'rgba(100, 116, 139, 0.2)'
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            ticks: {
                                color: '#64748b'
                            },
                            grid: {
                                drawOnChartArea: false
                            }
                        }
                    }
                }
            });
        }

        // Inicializar gráfico de rendimiento
        const performanceCanvas = document.getElementById('performance-chart');
        if (performanceCanvas) {
            this.charts.performance = new Chart(performanceCanvas, {
                type: 'doughnut',
                data: {
                    labels: ['Exitoso', 'Error', 'Advertencia'],
                    datasets: [{
                        data: [95, 3, 2],
                        backgroundColor: [
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(239, 68, 68, 0.8)',
                            'rgba(245, 158, 11, 0.8)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#cbd5e1'
                            }
                        }
                    }
                }
            });
        }
    }

    updateCharts() {
        // Actualizar gráfico del sistema
        if (this.charts.system && this.data.metrics?.system) {
            const cpu = this.data.metrics.system.cpu?.currentLoad || 0;
            const memory = this.data.metrics.system.memory?.usagePercent || 0;

            // Agregar nuevos datos
            this.charts.system.data.datasets[0].data.push(cpu);
            this.charts.system.data.datasets[1].data.push(memory);

            // Mantener solo los últimos 5 puntos para 512MB
            if (this.charts.system.data.datasets[0].data.length > 5) {
                this.charts.system.data.datasets[0].data.shift();
                this.charts.system.data.datasets[1].data.shift();
            }

            this.charts.system.update('none');
        }

        // Actualizar gráfico de rendimiento
        if (this.charts.performance && this.data.health) {
            const totalChecks = this.data.health.summary?.totalChecks || 0;
            const passedChecks = this.data.health.summary?.passedChecks || 0;
            const failedChecks = this.data.health.summary?.failedChecks || 0;
            const warnings = this.data.health.summary?.warnings || 0;

            if (totalChecks > 0) {
                this.charts.performance.data.datasets[0].data = [
                    (passedChecks / totalChecks) * 100,
                    (failedChecks / totalChecks) * 100,
                    (warnings / totalChecks) * 100
                ];
                this.charts.performance.update('none');
            }
        }
    }

    // WebSocket methods
    send(data) {
        if (this.isConnected && this.ws) {
            this.ws.send(JSON.stringify(data));
        }
    }

    subscribe(channels) {
        this.send({
            type: 'subscribe',
            channels: channels
        });
    }

    unsubscribe(channels) {
        this.send({
            type: 'unsubscribe',
            channels: channels
        });
    }

    requestDataRefresh() {
        if (this.isConnected) {
            this.send({ type: 'request_data', dataType: 'full_metrics' });
            this.send({ type: 'request_data', dataType: 'health_report' });
            this.send({ type: 'request_data', dataType: 'alert_history' });
        }
    }

    // UI methods
    toggleAutoRefresh() {
        this.autoRefresh = !this.autoRefresh;
        const button = document.getElementById('toggle-auto-refresh');
        if (button) {
            button.innerHTML = `<i class="fas fa-sync-alt"></i> Auto-refresh: ${this.autoRefresh ? 'ON' : 'OFF'}`;
            button.classList.toggle('btn-primary', this.autoRefresh);
            button.classList.toggle('btn-secondary', !this.autoRefresh);
        }
    }

    toggleActivityFeed() {
        this.activityPaused = !this.activityPaused;
        const button = document.getElementById('pause-activity');
        if (button) {
            button.innerHTML = `<i class="fas fa-${this.activityPaused ? 'play' : 'pause'}"></i>`;
            button.title = this.activityPaused ? 'Reanudar actividad' : 'Pausar actividad';
        }
    }

    clearActivityFeed() {
        const activityFeed = document.getElementById('activity-feed');
        if (activityFeed) {
            activityFeed.innerHTML = '';
            this.data.activities = [];
        }
    }

    updateBusinessTimeframe(timeframe) {
        // Implementar cambio de timeframe para métricas de negocio
        console.log('📊 Cambiando timeframe a:', timeframe);
        // Aquí se podría solicitar datos específicos del timeframe
    }

    setupModals() {
        // Modal de mantenimiento
        const maintenanceModal = document.getElementById('maintenance-modal');
        const confirmMaintenance = document.getElementById('confirm-maintenance');
        const cancelMaintenance = document.getElementById('cancel-maintenance');
        const closeModal = document.querySelector('.modal-close');

        if (confirmMaintenance) {
            confirmMaintenance.addEventListener('click', () => {
                this.activateMaintenanceMode();
                this.hideModal(maintenanceModal);
            });
        }

        if (cancelMaintenance) {
            cancelMaintenance.addEventListener('click', () => {
                this.hideModal(maintenanceModal);
            });
        }

        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.hideModal(maintenanceModal);
            });
        }

        // Cerrar modal al hacer click fuera
        if (maintenanceModal) {
            maintenanceModal.addEventListener('click', (e) => {
                if (e.target === maintenanceModal) {
                    this.hideModal(maintenanceModal);
                }
            });
        }
    }

    showMaintenanceModal() {
        const modal = document.getElementById('maintenance-modal');
        if (modal) {
            modal.classList.add('show');
        }
    }

    hideModal(modal) {
        if (modal) {
            modal.classList.remove('show');
        }
    }

    activateMaintenanceMode() {
        // Enviar comando al bot para activar modo mantenimiento
        if (this.isConnected) {
            this.send({
                type: 'activate_maintenance',
                timestamp: new Date().toISOString()
            });
        }

        this.addActivity('system', 'Modo mantenimiento activado', 'El bot ha sido puesto en modo mantenimiento');
    }

    handleMaintenanceMode(enabled) {
        const statusText = enabled ? 'ACTIVADO' : 'DESACTIVADO';
        this.addActivity('system', `Modo mantenimiento ${statusText}`,
            enabled ? 'El bot no procesará nuevos pedidos' : 'El bot ha vuelto a funcionar normalmente');
    }

    // Utility methods
    updateConnectionStatus(status, text) {
        const indicator = document.getElementById('connection-status');
        const wsStatusIcon = document.getElementById('ws-status-icon');
        const wsStatusText = document.getElementById('ws-status-text');

        if (indicator) {
            indicator.className = `status-indicator ${status}`;
            indicator.innerHTML = `<i class="fas fa-circle"></i> ${text}`;
        }

        if (wsStatusIcon) {
            wsStatusIcon.className = `fas fa-circle ${status}`;
        }

        if (wsStatusText) {
            wsStatusText.textContent = text;
        }
    }

    updateLastUpdateTime() {
        const lastUpdate = document.getElementById('last-update-time');
        if (lastUpdate) {
            lastUpdate.textContent = new Date().toLocaleTimeString('es-MX');
        }

        const lastUpdateInfo = document.getElementById('last-update');
        if (lastUpdateInfo) {
            lastUpdateInfo.textContent = new Date().toLocaleString('es-MX');
        }
    }

    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectInterval * this.reconnectAttempts;

            this.updateConnectionStatus('connecting', `Reconectando en ${delay/1000}s...`);

            setTimeout(() => {
                console.log(`🔄 Intento de reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
                this.connectWebSocket();
            }, delay);
        } else {
            this.updateConnectionStatus('disconnected', 'Reconexión fallida');
            console.error('❌ Máximo número de intentos de reconexión alcanzado');
        }
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    timeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) {
            return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
        } else if (diffHours > 0) {
            return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        } else if (diffMinutes > 0) {
            return `hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
        } else {
            return 'hace unos segundos';
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
        }
    }
}

// Inicializar cliente cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.monitoringClient = new MonitoringClient();
});

// Hacer disponible globalmente para callbacks
window.MonitoringClient = MonitoringClient;