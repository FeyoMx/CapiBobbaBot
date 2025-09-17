// monitoring/websocket-server.js
const WebSocket = require('ws');
const http = require('http');

class MonitoringWebSocketServer {
    constructor(metricsCollector, healthChecker, serverOrPort = 3001) {
        this.metrics = metricsCollector;
        this.health = healthChecker;

        // Determinar si se pasó un servidor HTTP o un puerto
        if (typeof serverOrPort === 'number') {
            this.port = serverOrPort;
            this.server = null;
            this.useExistingServer = false;
        } else {
            this.server = serverOrPort;
            this.port = null;
            this.useExistingServer = true;
        }

        this.clients = new Set();
        this.wss = null;

        // Configuración de broadcast
        this.broadcastInterval = 5000; // 5 segundos
        this.lastBroadcast = 0;

        // Estadísticas del servidor WebSocket
        this.stats = {
            totalConnections: 0,
            currentConnections: 0,
            messagesTransmitted: 0,
            startTime: Date.now()
        };

        this.initializeWebSocketServer();
    }

    initializeWebSocketServer() {
        try {
            if (this.useExistingServer) {
                // Usar servidor HTTP existente
                console.log('🌐 Configurando WebSocket en servidor HTTP existente');

                // Crear servidor WebSocket usando el servidor existente
                this.wss = new WebSocket.Server({
                    server: this.server,
                    clientTracking: true,
                    perMessageDeflate: true
                });

            } else {
                // Crear servidor HTTP nuevo para WebSocket (modo desarrollo)
                this.server = http.createServer((req, res) => {
                    // Health check endpoint
                    if (req.url === '/health') {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            status: 'healthy',
                            stats: this.stats,
                            uptime: Date.now() - this.stats.startTime
                        }));
                        return;
                    }

                    // Endpoint de estadísticas del WebSocket
                    if (req.url === '/ws-stats') {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            ...this.stats,
                            uptime: Date.now() - this.stats.startTime,
                            connectedClients: Array.from(this.clients).map(client => ({
                                id: client.id,
                                connectedAt: client.connectedAt,
                                lastPing: client.lastPing,
                                subscriptions: client.subscriptions
                            }))
                        }));
                        return;
                    }

                    res.writeHead(404);
                    res.end('Not Found');
                });

                // Crear servidor WebSocket
                this.wss = new WebSocket.Server({
                    server: this.server,
                    clientTracking: true,
                    perMessageDeflate: true
                });

                // Iniciar servidor solo si no estamos usando uno existente
                this.server.listen(this.port, () => {
                    console.log(`🌐 WebSocket server iniciado en puerto ${this.port}`);
                    console.log(`📊 Health check disponible en http://localhost:${this.port}/health`);
                    console.log(`📈 WebSocket stats en http://localhost:${this.port}/ws-stats`);
                });
            }

            this.setupWebSocketHandlers();

            // Iniciar broadcast de métricas
            this.startMetricsBroadcast();

            if (this.useExistingServer) {
                console.log('✅ WebSocket configurado en servidor HTTP principal');
            }

        } catch (error) {
            console.error('❌ Error iniciando WebSocket server:', error);
            throw error;
        }
    }

    setupWebSocketHandlers() {
        this.wss.on('connection', (ws, req) => {
            const clientId = this.generateClientId();
            const clientIP = req.socket.remoteAddress;

            // Configurar cliente
            ws.id = clientId;
            ws.connectedAt = new Date().toISOString();
            ws.lastPing = Date.now();
            ws.subscriptions = new Set(['metrics', 'health', 'alerts']); // Suscripciones por defecto
            ws.isAlive = true;

            // Agregar a la lista de clientes
            this.clients.add(ws);
            this.stats.totalConnections++;
            this.stats.currentConnections++;

            console.log(`🔗 Cliente conectado: ${clientId} desde ${clientIP}`);

            // Enviar mensaje de bienvenida
            this.sendToClient(ws, {
                type: 'welcome',
                clientId: clientId,
                serverTime: new Date().toISOString(),
                availableSubscriptions: ['metrics', 'health', 'alerts', 'logs', 'business'],
                broadcastInterval: this.broadcastInterval
            });

            // Enviar estado inicial
            this.sendInitialData(ws);

            // Configurar handlers del cliente
            ws.on('message', (message) => {
                this.handleClientMessage(ws, message);
            });

            ws.on('pong', () => {
                ws.lastPing = Date.now();
                ws.isAlive = true;
            });

            ws.on('close', (code, reason) => {
                this.clients.delete(ws);
                this.stats.currentConnections--;
                console.log(`🔌 Cliente desconectado: ${clientId} (${code}: ${reason})`);
            });

            ws.on('error', (error) => {
                console.error(`❌ Error en WebSocket ${clientId}:`, error);
                this.clients.delete(ws);
                this.stats.currentConnections--;
            });
        });

        this.wss.on('error', (error) => {
            console.error('❌ Error en WebSocket Server:', error);
        });

        // Heartbeat para detectar conexiones muertas
        this.startHeartbeat();
    }

    handleClientMessage(ws, rawMessage) {
        try {
            const message = JSON.parse(rawMessage);

            switch (message.type) {
                case 'subscribe':
                    this.handleSubscription(ws, message.channels);
                    break;

                case 'unsubscribe':
                    this.handleUnsubscription(ws, message.channels);
                    break;

                case 'ping':
                    this.sendToClient(ws, { type: 'pong', timestamp: Date.now() });
                    break;

                case 'request_data':
                    this.handleDataRequest(ws, message.dataType);
                    break;

                case 'acknowledge_alert':
                    this.handleAlertAcknowledgment(ws, message.alertId);
                    break;

                default:
                    this.sendToClient(ws, {
                        type: 'error',
                        message: `Tipo de mensaje desconocido: ${message.type}`
                    });
            }
        } catch (error) {
            console.error('Error procesando mensaje del cliente:', error);
            this.sendToClient(ws, {
                type: 'error',
                message: 'Error procesando mensaje: formato inválido'
            });
        }
    }

    handleSubscription(ws, channels) {
        if (!Array.isArray(channels)) {
            channels = [channels];
        }

        channels.forEach(channel => {
            ws.subscriptions.add(channel);
        });

        this.sendToClient(ws, {
            type: 'subscription_updated',
            subscriptions: Array.from(ws.subscriptions),
            message: `Suscrito a: ${channels.join(', ')}`
        });

        console.log(`📺 Cliente ${ws.id} suscrito a: ${channels.join(', ')}`);
    }

    handleUnsubscription(ws, channels) {
        if (!Array.isArray(channels)) {
            channels = [channels];
        }

        channels.forEach(channel => {
            ws.subscriptions.delete(channel);
        });

        this.sendToClient(ws, {
            type: 'subscription_updated',
            subscriptions: Array.from(ws.subscriptions),
            message: `Desuscrito de: ${channels.join(', ')}`
        });

        console.log(`📺 Cliente ${ws.id} desuscrito de: ${channels.join(', ')}`);
    }

    async handleDataRequest(ws, dataType) {
        try {
            let data = null;

            switch (dataType) {
                case 'full_metrics':
                    data = await this.metrics.getSystemMetrics();
                    break;

                case 'health_report':
                    data = await this.health.performHealthCheck();
                    break;

                case 'alert_history':
                    data = this.health.getAlertHistory();
                    break;

                case 'system_info':
                    data = await this.metrics.getSystemInfo();
                    break;

                default:
                    this.sendToClient(ws, {
                        type: 'error',
                        message: `Tipo de datos desconocido: ${dataType}`
                    });
                    return;
            }

            this.sendToClient(ws, {
                type: 'data_response',
                dataType: dataType,
                data: data,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this.sendToClient(ws, {
                type: 'error',
                message: `Error obteniendo ${dataType}: ${error.message}`
            });
        }
    }

    async handleAlertAcknowledgment(ws, alertId) {
        try {
            const success = await this.health.acknowledgeAlert(alertId);

            this.sendToClient(ws, {
                type: 'alert_acknowledged',
                alertId: alertId,
                success: success,
                acknowledgedBy: ws.id,
                timestamp: new Date().toISOString()
            });

            // Broadcast a todos los clientes
            if (success) {
                this.broadcastToSubscribed('alerts', {
                    type: 'alert_acknowledged',
                    alertId: alertId,
                    acknowledgedBy: ws.id,
                    timestamp: new Date().toISOString()
                });
            }

        } catch (error) {
            this.sendToClient(ws, {
                type: 'error',
                message: `Error acknowledging alert: ${error.message}`
            });
        }
    }

    async sendInitialData(ws) {
        try {
            // Enviar métricas iniciales
            if (ws.subscriptions.has('metrics')) {
                const metrics = await this.metrics.getSystemMetrics();
                this.sendToClient(ws, {
                    type: 'initial_metrics',
                    data: metrics,
                    timestamp: new Date().toISOString()
                });
            }

            // Enviar estado de salud inicial
            if (ws.subscriptions.has('health')) {
                const health = await this.health.performHealthCheck();
                this.sendToClient(ws, {
                    type: 'initial_health',
                    data: health,
                    timestamp: new Date().toISOString()
                });
            }

            // Enviar alertas activas
            if (ws.subscriptions.has('alerts')) {
                const alerts = this.health.getAlertHistory();
                const activeAlerts = alerts.filter(alert => !alert.acknowledged);

                this.sendToClient(ws, {
                    type: 'initial_alerts',
                    data: activeAlerts,
                    timestamp: new Date().toISOString()
                });
            }

        } catch (error) {
            console.error('Error enviando datos iniciales:', error);
        }
    }

    startMetricsBroadcast() {
        setInterval(async () => {
            try {
                const now = Date.now();

                // Evitar broadcasts muy frecuentes
                if (now - this.lastBroadcast < this.broadcastInterval) {
                    return;
                }

                this.lastBroadcast = now;

                // Obtener datos frescos
                const [metrics, health] = await Promise.all([
                    this.metrics.getSystemMetrics(),
                    this.health.performHealthCheck()
                ]);

                // Broadcast métricas
                this.broadcastToSubscribed('metrics', {
                    type: 'metrics_update',
                    data: metrics,
                    timestamp: new Date().toISOString()
                });

                // Broadcast salud del sistema
                this.broadcastToSubscribed('health', {
                    type: 'health_update',
                    data: health,
                    timestamp: new Date().toISOString()
                });

                // Broadcast nuevas alertas
                const recentAlerts = health.checks.filter(check =>
                    check.status !== 'pass' && !check.acknowledged
                );

                if (recentAlerts.length > 0) {
                    this.broadcastToSubscribed('alerts', {
                        type: 'new_alerts',
                        data: recentAlerts,
                        timestamp: new Date().toISOString()
                    });
                }

            } catch (error) {
                console.error('Error en broadcast de métricas:', error);
            }
        }, 2000); // Verificar cada 2 segundos, pero respetar broadcastInterval
    }

    startHeartbeat() {
        setInterval(() => {
            this.clients.forEach(ws => {
                if (!ws.isAlive) {
                    console.log(`💔 Cliente ${ws.id} no responde, terminando conexión`);
                    ws.terminate();
                    this.clients.delete(ws);
                    this.stats.currentConnections--;
                    return;
                }

                ws.isAlive = false;
                ws.ping();
            });
        }, 30000); // Cada 30 segundos
    }

    sendToClient(ws, data) {
        try {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(data));
                this.stats.messagesTransmitted++;
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Error enviando mensaje a cliente ${ws.id}:`, error);
            return false;
        }
    }

    broadcastToSubscribed(channel, data) {
        let sentCount = 0;

        this.clients.forEach(ws => {
            if (ws.subscriptions.has(channel)) {
                if (this.sendToClient(ws, data)) {
                    sentCount++;
                }
            }
        });

        if (sentCount > 0) {
            console.log(`📡 Broadcast ${channel}: ${sentCount} clientes`);
        }

        return sentCount;
    }

    broadcastToAll(data) {
        let sentCount = 0;

        this.clients.forEach(ws => {
            if (this.sendToClient(ws, data)) {
                sentCount++;
            }
        });

        console.log(`📡 Broadcast global: ${sentCount} clientes`);
        return sentCount;
    }

    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    // Métodos públicos para el bot

    notifyNewOrder(orderData) {
        this.broadcastToSubscribed('business', {
            type: 'new_order',
            data: orderData,
            timestamp: new Date().toISOString()
        });
    }

    notifyError(errorData) {
        this.broadcastToSubscribed('alerts', {
            type: 'system_error',
            data: errorData,
            timestamp: new Date().toISOString()
        });
    }

    notifyMaintenanceMode(enabled) {
        this.broadcastToAll({
            type: 'maintenance_mode',
            enabled: enabled,
            timestamp: new Date().toISOString()
        });
    }

    notifyNewMessage(messageData) {
        this.broadcastToSubscribed('business', {
            type: 'new_message',
            data: messageData,
            timestamp: new Date().toISOString()
        });
    }

    getServerStats() {
        return {
            ...this.stats,
            uptime: Date.now() - this.stats.startTime,
            connectedClients: this.stats.currentConnections,
            port: this.port
        };
    }

    close() {
        console.log('🔌 Cerrando WebSocket server...');

        // Notificar a todos los clientes
        this.broadcastToAll({
            type: 'server_shutdown',
            message: 'El servidor se está cerrando',
            timestamp: new Date().toISOString()
        });

        // Cerrar todas las conexiones
        this.clients.forEach(ws => {
            ws.close(1001, 'Server shutdown');
        });

        // Cerrar servidor
        if (this.wss) {
            this.wss.close();
        }

        if (this.server) {
            this.server.close();
        }

        console.log('✅ WebSocket server cerrado');
    }
}

module.exports = MonitoringWebSocketServer;