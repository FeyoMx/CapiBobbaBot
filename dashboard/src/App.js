import React, { Suspense, lazy } from 'react';
import MaintenanceMode from './MaintenanceMode';
import BusinessDataEditor from './BusinessDataEditor';
import MessageLogViewer from './MessageLogViewer';
import OrderViewer from './OrderViewer';
import ChatInterface from './ChatInterface';
import RedisStateViewer from './RedisStateViewer';

// Lazy load heavy components for better performance
const SurveyResultsDashboard = lazy(() => import('./SurveyResultsDashboard'));
const SecurityDashboard = lazy(() => import('./SecurityDashboard'));

function App() {
  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <h1><i className="fas fa-robot"></i> CapiBobba Dashboard</h1>
            <div className="connection-status">
              <span className="status-indicator connected">
                <i className="fas fa-circle"></i> Sistema Activo
              </span>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary">
              <i className="fas fa-sync-alt"></i> Actualizar
            </button>
            <button className="btn btn-primary">
              <i className="fas fa-cog"></i> Configuración
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Column: Main Components */}
        <div className="components-column">
          <div className="component-card">
            <div className="card-header">
              <h3><i className="fas fa-tools"></i> Modo Mantenimiento</h3>
            </div>
            <div className="card-content">
              <MaintenanceMode />
            </div>
          </div>

          <div className="component-card">
            <div className="card-header">
              <h3><i className="fas fa-edit"></i> Editor de Datos de Negocio</h3>
            </div>
            <div className="card-content">
              <BusinessDataEditor />
            </div>
          </div>

          <div className="component-card">
            <div className="card-header">
              <h3><i className="fas fa-shopping-cart"></i> Visualizador de Pedidos</h3>
            </div>
            <div className="card-content">
              <OrderViewer />
            </div>
          </div>

          <div className="component-card">
            <div className="card-header">
              <h3><i className="fas fa-chart-bar"></i> Dashboard de Encuestas</h3>
            </div>
            <div className="card-content">
              <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}><i className="fas fa-spinner fa-spin"></i> Cargando encuestas...</div>}>
                <SurveyResultsDashboard />
              </Suspense>
            </div>
          </div>

          <div className="component-card">
            <div className="card-header">
              <h3><i className="fas fa-shield-alt"></i> Dashboard de Seguridad</h3>
            </div>
            <div className="card-content">
              <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}><i className="fas fa-spinner fa-spin"></i> Cargando seguridad...</div>}>
                <SecurityDashboard />
              </Suspense>
            </div>
          </div>

          <div className="component-card">
            <div className="card-header">
              <h3><i className="fas fa-comments"></i> Interfaz de Chat</h3>
            </div>
            <div className="card-content">
              <ChatInterface />
            </div>
          </div>

          <div className="component-card">
            <div className="card-header">
              <h3><i className="fas fa-list"></i> Registro de Mensajes</h3>
            </div>
            <div className="card-content">
              <MessageLogViewer />
            </div>
          </div>

          <div className="component-card">
            <div className="card-header">
              <h3><i className="fas fa-database"></i> Estado de Redis</h3>
            </div>
            <div className="card-content">
              <RedisStateViewer />
            </div>
          </div>
        </div>

        {/* Right Column: Empty for better layout */}
        <div className="activity-column">
        </div>
      </div>
    </div>
  );
}

export default App;
