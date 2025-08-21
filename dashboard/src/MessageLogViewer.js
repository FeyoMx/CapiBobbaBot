import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Accordion, AccordionSummary, AccordionDetails, CircularProgress, List, ListItem, ListItemText, Box, Alert } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';

function MessageLogViewer() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('/api/message-log')
      .then(response => {
        setMessages(response.data.reverse()); // Reverse to show newest first
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching message log:', err);
        setError('No se pudo cargar el log de mensajes.');
        setLoading(false);
      });
  }, []);

  const renderMessageContent = (message) => {
    if (message.type === 'incoming') {
      const msg = message.message;
      let content = `De: ${msg.from} (${new Date(msg.timestamp * 1000).toLocaleString()})\n`;
      if (msg.type === 'text') {
        content += `Tipo: Texto\nContenido: ${msg.text.body}`; 
      } else if (msg.type === 'interactive') {
        content += `Tipo: Interactivo\nID: ${msg.interactive.button_reply?.id || msg.interactive.list_reply?.id}\nTítulo: ${msg.interactive.button_reply?.title || msg.interactive.list_reply?.title}`; 
      } else {
        content += `Tipo: ${msg.type}`; 
      }
      return content;
    } else if (message.type === 'outgoing') {
      const payload = message.payload;
      let content = `Para: ${message.to} (${new Date(message.timestamp).toLocaleString()})\n`;
      if (payload.type === 'text') {
        content += `Tipo: Texto\nContenido: ${payload.text.body}`; 
      } else if (payload.type === 'interactive') {
        content += `Tipo: Interactivo\nHeader: ${payload.interactive.header?.text}\nBody: ${payload.interactive.body?.text}`; 
      } else {
        content += `Tipo: ${payload.type}`; 
      }
      return content;
    }
    return JSON.stringify(message, null, 2);
  };

  return (
    <Card style={{ marginTop: '2rem' }}>
      <CardContent>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="message-log-content"
            id="message-log-header"
          >
            <Typography variant="h5">Log de Mensajes (Entrada/Salida)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {loading && <Box display="flex" justifyContent="center"><CircularProgress /></Box>}
            {error && <Alert severity="error">{error}</Alert>}
            {!loading && !error && messages.length === 0 && (
              <Typography>No hay mensajes en el log.</Typography>
            )}
            {!loading && !error && messages.length > 0 && (
              <List>
                {messages.map((msg, index) => (
                  <ListItem key={index} divider>
                    <ListItemText
                      primary={msg.type === 'incoming' ? 'Mensaje Entrante' : 'Mensaje Saliente'}
                      secondary={
                        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                          {renderMessageContent(msg)}
                        </pre>
                      }
                    />
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

export default MessageLogViewer;
