const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy para todas las rutas /api/* hacia el servidor principal
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8080',
      changeOrigin: true,
      logLevel: 'debug',
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({
          success: false,
          error: 'Error al conectar con el servidor principal'
        });
      }
    })
  );

  // Proxy para WebSocket del sistema de monitoreo
  app.use(
    '/socket.io',
    createProxyMiddleware({
      target: 'http://localhost:8080',
      changeOrigin: true,
      ws: true,
      logLevel: 'debug'
    })
  );
};
