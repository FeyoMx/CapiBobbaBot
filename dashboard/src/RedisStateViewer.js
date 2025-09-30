import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Accordion, AccordionSummary, AccordionDetails, CircularProgress, List, ListItem, ListItemText, Box, Alert, Button } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';

function RedisStateViewer() {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [responseMessage, setResponseMessage] = useState(null);

  const fetchRedisStates = async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await axios.get('/api/redis-states');
      setStates(response.data);
    } catch (err) {
      console.error('Error fetching Redis states:', err);
      setError('No se pudieron cargar los estados de Redis.');
    } finally {
      if (showLoadingIndicator) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchRedisStates(true); // Primera carga con loading indicator
    const interval = setInterval(() => {
      fetchRedisStates(false); // Actualizaciones silenciosas sin loading
    }, 30000); // Refresh cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const handleDeleteState = async (key) => {
    setResponseMessage(null);
    try {
      const response = await axios.delete(`/api/redis-states/${key}`);
      if (response.data.success) {
        setResponseMessage({ severity: 'success', message: response.data.message });
        fetchRedisStates(); // Refresh the list
      } else {
        setResponseMessage({ severity: 'error', message: 'Error al eliminar el estado.' });
      }
    } catch (error) {
      console.error('Error deleting Redis state:', error);
      setResponseMessage({ severity: 'error', message: 'Error al eliminar el estado. Revisa la consola.' });
    }
  };

  return (
    <Card style={{ marginTop: '2rem' }}>
      <CardContent>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="redis-state-content"
            id="redis-state-header"
          >
            <Typography variant="h5">Visor/Limpiador de Estado de Redis</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" justifyContent="flex-end" marginBottom="1rem">
              <Button
                variant="contained"
                color="primary"
                onClick={() => fetchRedisStates(true)}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Actualizando...' : 'Actualizar Estados'}
              </Button>
            </Box>
            {responseMessage && (
              <Alert severity={responseMessage.severity} style={{ marginBottom: '1rem' }}>
                {responseMessage.message}
              </Alert>
            )}
            {loading && <Box display="flex" justifyContent="center"><CircularProgress /></Box>}
            {error && <Alert severity="error">{error}</Alert>}
            {!loading && !error && states.length === 0 && (
              <Typography>No hay estados de usuario en Redis (excluyendo el modo de mantenimiento).</Typography>
            )}
            {!loading && !error && states.length > 0 && (
              <List>
                {states.map((item, index) => (
                  <ListItem key={index} divider>
                    <ListItemText
                      primary={`Clave: ${item.key}`}
                      secondary={
                        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                          {JSON.stringify(item.state, null, 2)}
                        </pre>
                      }
                    />
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => handleDeleteState(item.key)}
                      style={{ marginLeft: '1rem' }}
                    >
                      Eliminar Estado
                    </Button>
                  </ListItem>
                ))}
              </List>
            )}
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
}

export default RedisStateViewer;
