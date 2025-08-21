import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Switch, FormControlLabel, Alert } from '@mui/material';
import axios from 'axios';

function MaintenanceMode() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('/api/maintenance')
      .then(response => {
        if (response.data && typeof response.data.maintenanceMode === 'boolean') {
          setMaintenanceMode(response.data.maintenanceMode);
        } else {
          setError('Respuesta inesperada del servidor.');
        }
      })
      .catch(error => {
        console.error('Error fetching maintenance status:', error);
        setError('No se pudo obtener el estado de mantenimiento.');
      });
  }, []);

  const handleMaintenanceModeChange = (event) => {
    const newStatus = event.target.checked;
    setError(null);
    axios.post('/api/maintenance', { maintenanceMode: newStatus })
      .then(response => {
        setMaintenanceMode(response.data.maintenanceMode);
      })
      .catch(error => {
        console.error('Error updating maintenance status:', error);
        setError('No se pudo actualizar el estado de mantenimiento.');
      });
  };

  return (
    <Card style={{ marginBottom: '2rem' }}>
      <CardContent>
        <Typography variant="h5">Modo Fuera de Servicio</Typography>
        {error && <Alert severity="error" style={{ marginTop: '1rem' }}>{error}</Alert>}
        <FormControlLabel
          control={<Switch checked={maintenanceMode} onChange={handleMaintenanceModeChange} />}
          label="Activar para suspender la toma de pedidos del bot."
        />
      </CardContent>
    </Card>
  );
}

export default MaintenanceMode;
