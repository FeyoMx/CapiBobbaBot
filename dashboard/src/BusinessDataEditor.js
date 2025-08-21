import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Button, TextareaAutosize, Accordion, AccordionSummary, AccordionDetails, Alert } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';

function BusinessDataEditor() {
  const [editedData, setEditedData] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    axios.get('/api/business-data')
      .then(response => {
        setEditedData(JSON.stringify(response.data, null, 2));
      })
      .catch(error => {
        console.error('Error fetching business data:', error);
        setError('No se pudieron cargar los datos del negocio.');
      });
  }, []);

  const handleDataChange = (event) => {
    setEditedData(event.target.value);
  };

  const handleSave = () => {
    setError(null);
    setSuccess(null);
    try {
      const parsedData = JSON.parse(editedData);
      axios.post('/api/business-data', parsedData)
        .then(response => {
          setSuccess('¡Datos guardados correctamente!');
        })
        .catch(error => {
          console.error('Error saving business data:', error);
          setError('Error al guardar los datos. Revisa la consola para más detalles.');
        });
    } catch (error) {
      setError(`Error en el formato JSON: ${error.message}`);
    }
  };

  return (
    <Card>
      <CardContent>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography variant="h5">Editor de Información del Negocio</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {error && <Alert severity="error" style={{ marginBottom: '1rem' }}>{error}</Alert>}
            {success && <Alert severity="success" style={{ marginBottom: '1rem' }}>{success}</Alert>}
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Edita la información del negocio en formato JSON. Ten cuidado de mantener la estructura correcta.
            </Typography>
            <TextareaAutosize
              minRows={20}
              style={{ width: '100%', marginTop: '1rem', fontFamily: 'monospace' }}
              value={editedData}
              onChange={handleDataChange}
            />
            <Button variant="contained" color="primary" onClick={handleSave} style={{ marginTop: '1rem' }}>
              Guardar Cambios
            </Button>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
}

export default BusinessDataEditor;
