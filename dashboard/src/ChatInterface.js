import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, Typography, Accordion, AccordionSummary, AccordionDetails, TextField, Button, Box, Alert, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';

function ChatInterface() {
  const [targetNumber, setTargetNumber] = useState('');
  const [messageText, setMessageText] = useState('');
  const [responseMessage, setResponseMessage] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const fetchConversationHistory = useCallback(async () => {
    if (!targetNumber) return;
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const response = await axios.get('/api/message-log');
      const allMessages = response.data;
      const filteredHistory = allMessages.filter(msg => 
        (msg.type === 'incoming' && msg.message.from === targetNumber) ||
        (msg.type === 'outgoing' && msg.to === targetNumber)
      ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); // Sort by timestamp
      setConversationHistory(filteredHistory);
    } catch (err) {
      console.error('Error fetching conversation history:', err);
      setHistoryError('No se pudo cargar el historial de conversación.');
    } finally {
      setLoadingHistory(false);
    }
  }, [targetNumber]);

  useEffect(() => {
    fetchConversationHistory();
    const interval = setInterval(fetchConversationHistory, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [targetNumber, fetchConversationHistory]);

  const handleSendMessage = async () => {
    setResponseMessage(null);
    if (!targetNumber || !messageText) {
      setResponseMessage({ severity: 'error', message: 'Por favor, ingresa el número y el mensaje.' });
      return;
    }

    try {
      const response = await axios.post('/api/send-message', { to: targetNumber, text: messageText });
      if (response.data.success) {
        setResponseMessage({ severity: 'success', message: 'Mensaje enviado exitosamente.' });
        setMessageText('');
        fetchConversationHistory(); // Refresh history after sending
      } else {
        setResponseMessage({ severity: 'error', message: 'Error al enviar el mensaje.' });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setResponseMessage({ severity: 'error', message: 'Error al enviar el mensaje. Revisa la consola.' });
    }
  };

  const renderMessageContent = (msg) => {
    if (msg.type === 'incoming') {
      return `Cliente (${new Date(msg.timestamp * 1000).toLocaleTimeString()}): ${msg.message.text?.body || '[Mensaje no de texto]'}`;
    } else if (msg.type === 'outgoing') {
      return `Tú (${new Date(msg.timestamp).toLocaleTimeString()}): ${msg.payload.text?.body || '[Mensaje no de texto]'}`;
    }
    return JSON.stringify(msg);
  };

  return (
    <Card style={{ marginTop: '2rem' }}>
      <CardContent>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="chat-interface-content"
            id="chat-interface-header"
          >
            <Typography variant="h5">Chat con Cliente</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {responseMessage && (
              <Alert severity={responseMessage.severity} style={{ marginBottom: '1rem' }}>
                {responseMessage.message}
              </Alert>
            )}
            <TextField
              label="Número de WhatsApp del Cliente (ej. 521771...)"
              fullWidth
              value={targetNumber}
              onChange={(e) => setTargetNumber(e.target.value)}
              margin="normal"
            />
            <Button variant="contained" onClick={fetchConversationHistory} style={{ marginBottom: '1rem' }}>
              Cargar Historial de Conversación
            </Button>
            
            <Box border={1} borderColor="grey.300" p={2} height={300} overflow="auto" style={{ marginTop: '1rem' }}>
              {loadingHistory && <Box display="flex" justifyContent="center"><CircularProgress /></Box>}
              {historyError && <Alert severity="error">{historyError}</Alert>}
              {!loadingHistory && !historyError && conversationHistory.length === 0 && (
                <Typography>No hay historial de conversación para este número.</Typography>
              )}
              {!loadingHistory && !historyError && conversationHistory.length > 0 && (
                <List>
                  {conversationHistory.map((msg, index) => (
                    <ListItem key={index} style={{ justifyContent: msg.type === 'incoming' ? 'flex-start' : 'flex-end' }}>
                      <ListItemText
                        primary={
                          <Typography
                            variant="body2"
                            style={{
                              backgroundColor: msg.type === 'incoming' ? '#e0e0e0' : '#bbdefb',
                              borderRadius: '10px',
                              padding: '8px 12px',
                              maxWidth: '70%',
                              wordBreak: 'break-word'
                            }}
                          >
                            {renderMessageContent(msg)}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>

            <TextField
              label="Mensaje"
              fullWidth
              multiline
              rows={3}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              margin="normal"
            />
            <Button variant="contained" color="primary" onClick={handleSendMessage} style={{ marginTop: '1rem' }}>
              Enviar Mensaje
            </Button>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
}

export default ChatInterface;
