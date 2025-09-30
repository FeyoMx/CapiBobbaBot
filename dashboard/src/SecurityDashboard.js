import React, { useState, useEffect } from 'react';

function SecurityDashboard() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Función para cargar estadísticas de seguridad
  const loadSecurityStats = async () => {
    try {
      const response = await fetch('/api/security/stats');
      if (!response.ok) throw new Error('Error al cargar estadísticas');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    }
  };

  // Función para cargar alertas activas
  const loadAlerts = async () => {
    try {
      const response = await fetch('/api/security/alerts');
      if (!response.ok) throw new Error('Error al cargar alertas');
      const data = await response.json();
      setAlerts(Array.isArray(data) ? data : (data.alerts || []));
    } catch (err) {
      console.error('Error:', err);
      setAlerts([]);
    }
  };

  // Función para cargar usuarios bloqueados
  const loadBlockedUsers = async () => {
    try {
      const response = await fetch('/api/security/blocked-users');
      if (!response.ok) throw new Error('Error al cargar usuarios bloqueados');
      const data = await response.json();
      setBlockedUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error:', err);
      setBlockedUsers([]);
    }
  };

  // Función para cargar eventos recientes
  const loadEvents = async () => {
    try {
      const response = await fetch('/api/security/events?limit=20');
      if (!response.ok) throw new Error('Error al cargar eventos');
      const data = await response.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error:', err);
      setEvents([]);
    }
  };

  // Cargar todos los datos
  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadSecurityStats(),
      loadAlerts(),
      loadBlockedUsers(),
      loadEvents()
    ]);
    setLoading(false);
  };

  // Efecto para cargar datos iniciales
  useEffect(() => {
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Efecto para auto-actualización
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadAllData();
    }, 10000); // Actualizar cada 10 segundos

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh]);

  // Función para desbloquear usuario
  const handleUnblockUser = async (userId) => {
    try {
      const response = await fetch(`/api/security/unblock/${userId}`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Error al desbloquear usuario');
      await loadBlockedUsers();
      alert(`Usuario ${userId} desbloqueado exitosamente`);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Función para obtener color de severidad
  const getSeverityColor = (severity) => {
    const colors = {
      critical: '#dc3545',
      high: '#fd7e14',
      medium: '#ffc107',
      low: '#6c757d'
    };
    return colors[severity] || '#6c757d';
  };

  // Función para formatear fecha
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading && !stats) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '2em', color: '#007bff' }}></i>
        <p>Cargando estadísticas de seguridad...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#dc3545' }}>
        <i className="fas fa-exclamation-triangle" style={{ fontSize: '2em' }}></i>
        <p>Error: {error}</p>
        <button onClick={loadAllData} className="btn btn-primary">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="security-dashboard">
      {/* Header con controles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>
          <i className="fas fa-shield-alt"></i> Panel de Seguridad
        </h2>
        <div>
          <label style={{ marginRight: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ marginRight: '5px' }}
            />
            Auto-actualizar
          </label>
          <button onClick={loadAllData} className="btn btn-secondary">
            <i className="fas fa-sync-alt"></i> Actualizar
          </button>
        </div>
      </div>

      {/* Estadísticas generales */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
          <div className="stat-card" style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '2em', color: '#007bff', marginBottom: '10px' }}>
              <i className="fas fa-bell"></i>
            </div>
            <h3 style={{ margin: 0, fontSize: '2em' }}>{stats.alerts.total}</h3>
            <p style={{ margin: '5px 0 0', color: '#6c757d' }}>Alertas Totales</p>
          </div>

          <div className="stat-card" style={{ background: '#fff3cd', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '2em', color: '#dc3545', marginBottom: '10px' }}>
              <i className="fas fa-exclamation-circle"></i>
            </div>
            <h3 style={{ margin: 0, fontSize: '2em' }}>{stats.alerts.critical}</h3>
            <p style={{ margin: '5px 0 0', color: '#856404' }}>Alertas Críticas</p>
          </div>

          <div className="stat-card" style={{ background: '#f8d7da', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '2em', color: '#fd7e14', marginBottom: '10px' }}>
              <i className="fas fa-ban"></i>
            </div>
            <h3 style={{ margin: 0, fontSize: '2em' }}>{stats.blockedUsers}</h3>
            <p style={{ margin: '5px 0 0', color: '#721c24' }}>Usuarios Bloqueados</p>
          </div>

          <div className="stat-card" style={{ background: '#d1ecf1', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '2em', color: '#0c5460', marginBottom: '10px' }}>
              <i className="fas fa-shield-alt"></i>
            </div>
            <h3 style={{ margin: 0, fontSize: '2em' }}>{Object.values(stats.events).reduce((a, b) => a + b, 0)}</h3>
            <p style={{ margin: '5px 0 0', color: '#0c5460' }}>Eventos Totales</p>
          </div>
        </div>
      )}

      {/* Alertas activas */}
      <div style={{ marginBottom: '30px' }}>
        <h3><i className="fas fa-exclamation-triangle"></i> Alertas Activas ({alerts.length})</h3>
        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '8px', background: '#fff' }}>
          {alerts.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#28a745' }}>
              <i className="fas fa-check-circle" style={{ fontSize: '2em', marginBottom: '10px' }}></i>
              <p>No hay alertas activas</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0 }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Severidad</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Tipo</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Detalles</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        background: getSeverityColor(alert.severity),
                        color: '#fff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.85em',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>
                        {alert.severity}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{alert.type}</td>
                    <td style={{ padding: '12px', fontSize: '0.9em' }}>
                      {JSON.stringify(alert.data).substring(0, 50)}...
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.85em', color: '#6c757d' }}>
                      {formatDate(alert.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Usuarios bloqueados */}
      <div style={{ marginBottom: '30px' }}>
        <h3><i className="fas fa-user-lock"></i> Usuarios Bloqueados ({blockedUsers.length})</h3>
        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '8px', background: '#fff' }}>
          {blockedUsers.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
              <i className="fas fa-user-check" style={{ fontSize: '2em', marginBottom: '10px' }}></i>
              <p>No hay usuarios bloqueados</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0 }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Usuario</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Razón</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Bloqueado en</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Expira en</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {blockedUsers.map((user, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{user.userId}</td>
                    <td style={{ padding: '12px', fontSize: '0.9em' }}>{user.reason}</td>
                    <td style={{ padding: '12px', fontSize: '0.85em', color: '#6c757d' }}>
                      {formatDate(user.blockedAt)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.85em', color: '#6c757d' }}>
                      {formatDate(user.expiresAt)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => handleUnblockUser(user.userId)}
                        className="btn btn-sm btn-warning"
                        style={{ fontSize: '0.85em' }}
                      >
                        <i className="fas fa-unlock"></i> Desbloquear
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Eventos recientes */}
      <div>
        <h3><i className="fas fa-list"></i> Eventos Recientes ({events.length})</h3>
        <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '8px', background: '#fff' }}>
          {events.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
              <i className="fas fa-inbox" style={{ fontSize: '2em', marginBottom: '10px' }}></i>
              <p>No hay eventos recientes</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0 }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Tipo</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Severidad</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Detalles</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px' }}>{event.type}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        background: getSeverityColor(event.severity),
                        color: '#fff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.85em',
                        fontWeight: 'bold'
                      }}>
                        {event.severity}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.9em' }}>
                      {JSON.stringify(event.data).substring(0, 60)}...
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.85em', color: '#6c757d' }}>
                      {formatDate(event.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Contadores de eventos por tipo */}
      {stats && stats.events && (
        <div style={{ marginTop: '30px' }}>
          <h3><i className="fas fa-chart-pie"></i> Eventos por Tipo</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            {Object.entries(stats.events).map(([type, count]) => (
              <div key={type} style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '1.5em' }}>{count}</h4>
                <p style={{ margin: '5px 0 0', color: '#6c757d', fontSize: '0.9em' }}>
                  {type.replace(/_/g, ' ').toUpperCase()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SecurityDashboard;
