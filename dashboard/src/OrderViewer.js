import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Accordion, AccordionSummary, AccordionDetails, CircularProgress, List, ListItem, ListItemText, Box, Alert } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';

function OrderViewer() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('/api/orders')
      .then(response => {
        // La API devuelve {success: true, data: {orders: [...], total, page, ...}}
        if (response.data.success && response.data.data && response.data.data.orders) {
          // Invertir para mostrar los más recientes primero
          setOrders(response.data.data.orders.reverse());
        } else {
          // Fallback para formato antiguo si existe
          setOrders(Array.isArray(response.data) ? response.data.reverse() : []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching order log:', err);
        setError('No se pudo cargar el log de pedidos.');
        setLoading(false);
      });
  }, []);

  const renderOrderContent = (order) => {
    let content = `Cliente: ${order.from}\n`;
    content += `Tipo: ${order.type}\n`;
    content += `Fecha: ${new Date(order.timestamp * 1000).toLocaleString()}\n`;
    content += `Total: ${order.order?.total || 'N/A'}\n`;
    content += `Resumen: ${order.order?.summary || 'N/A'}\n`;
    content += `Dirección: ${order.delivery?.address || 'N/A'}\n`;
    content += `Método de Pago: ${order.payment?.method || 'N/A'}\n`;
    if (order.payment?.method === 'Efectivo') {
      content += `Paga con: ${order.payment?.cashDenomination || 'N/A'}\n`;
    }
    if (order.payment?.method === 'Transferencia') {
      content += `ID Comprobante: ${order.payment?.proofImageId || 'N/A'}\n`;
    }
    return content;
  };

  return (
    <Card style={{ marginTop: '2rem' }}>
      <CardContent>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="order-log-content"
            id="order-log-header"
          >
            <Typography variant="h5">Log de Pedidos</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {loading && <Box display="flex" justifyContent="center"><CircularProgress /></Box>}
            {error && <Alert severity="error">{error}</Alert>}
            {!loading && !error && orders.length === 0 && (
              <Typography>No hay pedidos en el log.</Typography>
            )}
            {!loading && !error && orders.length > 0 && (
              <List>
                {orders.map((order, index) => (
                  <ListItem key={index} divider>
                    <ListItemText
                      primary={`Pedido de ${order.from}`}
                      secondary={
                        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                          {renderOrderContent(order)}
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

export default OrderViewer;
