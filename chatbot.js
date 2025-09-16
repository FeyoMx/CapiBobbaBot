// chatbot.js
require('dotenv').config(); // Carga las variables de entorno desde el archivo .env

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const redis = require('redis');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { BUSINESS_CONTEXT } = require('./business_data'); // Importa el contexto del negocio
const path = require('path');

// === SISTEMA DE MONITOREO ===
const MetricsCollector = require('./monitoring/metrics');
const HealthChecker = require('./monitoring/health-checker');
const MonitoringWebSocketServer = require('./monitoring/websocket-server');
const cron = require('node-cron');

// --- CONFIGURACIÓN ---
// Lee las variables de entorno de forma segura. ¡No dejes tokens en el código!
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ADMIN_WHATSAPP_NUMBERS = process.env.ADMIN_WHATSAPP_NUMBERS; // Plural
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const REDIS_URL = process.env.REDIS_URL;
const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v18.0';
const MAINTENANCE_MODE_KEY = 'maintenance_mode_status'; // Clave para Redis

// Validamos que las variables de entorno críticas estén definidas
if (!VERIFY_TOKEN || !WHATSAPP_TOKEN || !PHONE_NUMBER_ID || !GEMINI_API_KEY || !ADMIN_WHATSAPP_NUMBERS || !N8N_WEBHOOK_URL || !REDIS_URL) {
  console.error(
    'Error: Faltan variables de entorno críticas. ' +
    'Asegúrate de que VERIFY_TOKEN, WHATSAPP_TOKEN, PHONE_NUMBER_ID, GEMINI_API_KEY, ADMIN_WHATSAPP_NUMBERS, N8N_WEBHOOK_URL y REDIS_URL '
    +
    'estén en tu archivo .env'
  );
  process.exit(1); // Detiene la aplicación si falta configuración
}

const app = express();
app.use(bodyParser.json());

// Servir la aplicación de React
app.use('/dashboard', express.static(path.join(__dirname, 'dashboard/build')));
// Servir archivos estáticos del dashboard de monitoreo
app.use('/css', express.static(path.join(__dirname, 'dashboard/css')));
app.use('/js', express.static(path.join(__dirname, 'dashboard/js')));

// === VARIABLES GLOBALES PARA MONITOREO ===
let metricsCollector = null;
let healthChecker = null;
let wsServer = null;



// --- CONEXIÓN A REDIS ---
// Helper para pausas
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const redisClient = redis.createClient({
  url: REDIS_URL
});

redisClient.on('error', err => console.error('Error en el cliente de Redis', err));
redisClient.on('connect', () => console.log('Conectado exitosamente a Redis.'));
redisClient.connect(); // <-- CRÍTICO: Es necesario para iniciar la conexión con Redis.

const PORT = process.env.PORT || 3000;

// === INICIO DEL BLOQUE PARA UPTIMEROBOT ===
// Endpoint raíz para que los monitores de salud (como UptimeRobot) sepan que el bot está vivo.
app.get('/', (req, res) => {
  res.status(200).send('CapiBobbaBot está en línea y funcionando. ¡Listo para recibir mensajes!');
});

// --- ENDPOINTS ---

// Endpoint para la verificación del Webhook (solo se usa una vez por Meta)
app.get('/webhook', (req, res) => {
  console.log("GET /webhook - Verificando webhook...");

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Valida que el modo y el token sean correctos
  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      // Si no coinciden, responde con '403 Forbidden'
      console.log('Verification failed. Tokens do not match.');
      res.sendStatus(403);
    }
  } else {
      res.sendStatus(400);
  }
});

// 5. MODIFICACIÓN DEL ENDPOINT DE WEBHOOK EXISTENTE
// REEMPLAZA tu función actual de manejo de webhook con esta versión mejorada:

app.post('/webhook', async (req, res) => {
    console.log('📨 Webhook recibido. Headers:', req.headers);
    console.log('📦 Cuerpo completo del webhook:', JSON.stringify(req.body, null, 2));

    const body = req.body;

    // Validar que llegó información
    if (!body || Object.keys(body).length === 0) {
        console.log('❌ Webhook vacío recibido');
        return res.status(400).send('Webhook body is empty');
    }

    try {
        // Verificar si es un mensaje de WhatsApp
        if (body.object === 'whatsapp_business_account' && body.entry && body.entry[0] && body.entry[0].changes) {
            const changes = body.entry[0].changes[0];
            
            if (changes.field === 'messages' && changes.value && changes.value.messages) {
                const messages = changes.value.messages;
                
                for (const message of messages) {
                    console.log('📱 Procesando mensaje de WhatsApp:', JSON.stringify(message, null, 2));
                    
                    // Enviar mensaje a n8n con el formato esperado por el workflow
                    const n8nPayload = {
                        rawMessage: message,
                        from: message.from,
                        timestamp: message.timestamp,
                        type: message.type
                    };

                    // Agregar contenido específico según el tipo de mensaje
                    if (message.type === 'text' && message.text) {
                        n8nPayload.text = message.text.body;
                    } else if (message.type === 'interactive' && message.interactive) {
                        n8nPayload.interactive = message.interactive;
                    }

                    // Enviar a n8n primero
                    await sendToN8n(message);
                    
                    // Verificar modo de mantenimiento
                    const maintenanceMode = await redisClient.get(MAINTENANCE_MODE_KEY);
                    if (maintenanceMode === 'true' && !checkIfAdminForWorkflow(message.from)) {
                        await sendTextMessage(
                            message.from,
                            '🔧 Estamos en mantenimiento. El servicio estará disponible pronto. Gracias por tu paciencia.'
                        );
                        continue;
                    }

                    // Procesar el mensaje normalmente
                    await processIncomingMessage(message);
                }
            }
        }
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('❌ Error procesando webhook:', error);
        res.status(500).send('Error interno del servidor');
    }
});


// --- API PARA EL DASHBOARD ---

// Endpoint para obtener el estado del modo de mantenimiento
app.get('/api/maintenance', async (req, res) => {
  try {
    const isMaintenanceMode = await redisClient.get(MAINTENANCE_MODE_KEY) === 'true';
    res.json({ maintenanceMode: isMaintenanceMode });
  } catch (error) {
    console.error('Error al obtener el estado de mantenimiento:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Endpoint para actualizar el estado del modo de mantenimiento
app.post('/api/maintenance', async (req, res) => {
  const { maintenanceMode } = req.body;
  if (typeof maintenanceMode !== 'boolean') {
    return res.status(400).json({ error: 'El estado de mantenimiento debe ser un booleano' });
  }

  try {
    if (maintenanceMode) {
      await redisClient.set(MAINTENANCE_MODE_KEY, 'true');
      await notifyAdmin(`⚠️ Un administrador ha ACTIVADO el modo "Fuera de Servicio" desde el dashboard.`);
    } else {
      await redisClient.del(MAINTENANCE_MODE_KEY);
      await notifyAdmin(`🟢 Un administrador ha DESACTIVADO el modo "Fuera de Servicio" desde el dashboard.`);
    }
    res.json({ success: true, maintenanceMode });
  } catch (error) {
    console.error('Error al actualizar el estado de mantenimiento:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Endpoint para obtener los datos del negocio
app.get('/api/business-data', (req, res) => {
  fs.readFile(path.join(__dirname, 'business_data.json'), 'utf8', (err, data) => {
    if (err) {
      console.error('Error al leer business_data.json:', err);
      return res.status(500).json({ error: 'Error al leer los datos del negocio.' });
    }
    try {
      res.json(JSON.parse(data));
    } catch (parseError) {
      console.error('Error al parsear business_data.json:', parseError);
      res.status(500).json({ error: 'El formato del archivo de datos es inválido.' });
    }
  });
});

// Endpoint para actualizar los datos del negocio
app.post('/api/business-data', (req, res) => {
    const newBusinessData = req.body;
    const jsonContent = JSON.stringify(newBusinessData, null, 4); // 4 espacios para indentación

    fs.writeFile(path.join(__dirname, 'business_data.json'), jsonContent, 'utf8', async (err) => {
        if (err) {
            console.error('Error al escribir en business_data.json:', err);
            return res.status(500).json({ error: 'No se pudo guardar la configuración.' });
        }
        console.log('business_data.json actualizado correctamente.');
        await notifyAdmin('✅ La información del negocio (menú, promos, etc.) ha sido actualizada desde el dashboard.');
        res.json({ success: true });
    });
});

// --- LÓGICA DEL BOT ---

// --- GESTIÓN DE ESTADO CON REDIS ---
// Las siguientes funciones reemplazan el `Map` en memoria para guardar y recuperar el estado de la conversación de forma persistente.

/**
 * Obtiene el estado de la conversación de un usuario desde Redis.
 * @param {string} from El número de WhatsApp del usuario.
 * @returns {Promise<object|null>} El objeto de estado o null si no existe.
 */
async function getUserState(from) {
  const stateJSON = await redisClient.get(from);
  return stateJSON ? JSON.parse(stateJSON) : null;
}

/**
 * Guarda el estado de la conversación de un usuario en Redis.
 * El estado expira en 24 horas para limpiar conversaciones inactivas.
 * @param {string} from El número de WhatsApp del usuario.
 * @param {object} state El objeto de estado a guardar.
 */
async function setUserState(from, state) {
  // Guardamos el estado como un string JSON y le ponemos una expiración de 24 horas (86400 segundos).
  await redisClient.set(from, JSON.stringify(state), { EX: 86400 });
}

/**
 * Elimina el estado de la conversación de un usuario de Redis.
 * @param {string} from El número de WhatsApp del usuario.
 */
async function deleteUserState(from) {
  await redisClient.del(from);
}

/**
 * Verifica si un número de teléfono corresponde a un administrador.
 * @param {string} from El número de WhatsApp a verificar.
 * @returns {boolean} True si el número es de un administrador, false en caso contrario.
 */
function isAdmin(from) {
    if (!ADMIN_WHATSAPP_NUMBERS) {
        return false;
    }
    const adminNumbers = ADMIN_WHATSAPP_NUMBERS.split(',').map(num => num.trim());
    return adminNumbers.includes(from);
}
/**
 * Formatea un número de WhatsApp para mostrarlo de forma más legible.
 * Ej: Convierte "5217712416450" a "7712416450".
 * @param {string} fullNumber El número completo con código de país.
 * @returns {string} El número formateado.
 */
function formatDisplayNumber(fullNumber) {
  if (typeof fullNumber !== 'string') return fullNumber;

  if (fullNumber.startsWith('521')) {
    return fullNumber.substring(3);
  }
  // Para números que no tienen el '1' extra después del código de país.
  if (fullNumber.startsWith('52')) {
    return fullNumber.substring(2);
  }
  return fullNumber; // Devuelve el número original si no coincide con los patrones de México.
}

/**
 * Envía datos del mensaje recibido a un webhook de n8n.
 * @param {object} message El objeto de mensaje de la API de WhatsApp.
 * @param {object} [extraData={}] Datos adicionales para incluir en el payload.
 */
async function sendToN8n(message, extraData = {}) {
  // 1. Construcción del payload base y fusión con datos extra.
  const payload = {
    from: message.from,
    type: message.type,
    timestamp: message.timestamp, // El mensaje ya trae un timestamp UNIX
    rawMessage: message,
    ...extraData // Fusiona cualquier dato extra como 'address'.
  };

  // 2. Añadir detalles específicos del mensaje de forma segura.
  switch (message.type) {
    case 'text':
      payload.text = message.text?.body;
      break;
    case 'interactive':
      if (message.interactive?.type === 'button_reply') {
        payload.interactive = {
          type: 'button_reply',
          id: message.interactive.button_reply?.id,
          title: message.interactive.button_reply?.title
        };
      }
      // Se puede añadir 'list_reply' aquí en el futuro.
      break;
    case 'image':
      payload.interactive = {
        id: message.image?.id,
        mime_type: message.image?.mime_type
      };
      break;
    case 'audio':
      payload.audio = {
        id: message.audio?.id,
        mime_type: message.audio?.mime_type
      };
      break;
    case 'document':
      payload.document = {
        id: message.document?.id,
        mime_type: message.document?.mime_type,
        filename: message.document?.filename
      };
      break;
    case 'location':
      payload.location = {
        latitude: message.location?.latitude,
        longitude: message.location?.longitude
      };
      break;
    // Añadir más casos según sea necesario.
  }

  // 3. Envío asíncrono con manejo de errores mejorado.
  try {
    console.log('Enviando payload a n8n:', JSON.stringify(payload, null, 2));
    const response = await axios.post(N8N_WEBHOOK_URL, payload, { timeout: 5000 }); // Timeout de 5 segundos
    console.log('Respuesta de n8n recibida:', response.data);
  } catch (error) {
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.error('Error enviando a n8n (el servidor respondió con un error):', { status: error.response.status, data: error.response.data });
    } else if (error.request) {
      // La petición se hizo pero no se recibió respuesta
      console.error('Error enviando a n8n (sin respuesta): Asegúrate de que n8n esté corriendo y el webhook esté activo y sea de tipo POST.');
    } else if (error.code === 'ECONNABORTED') {
      console.error('Error enviando a n8n: La petición tardó demasiado (timeout).');
    } else {
      // Algo pasó al configurar la petición que lanzó un Error
      console.error('Error enviando a n8n (error de configuración de Axios):', error.message);
    }
  }
}

// 1. FUNCIÓN MEJORADA PARA REGISTRAR RESPUESTAS DEL BOT
/**
 * Registra la respuesta del bot en el webhook de n8n con el formato esperado por el workflow.
 * @param {string} to El número de WhatsApp del destinatario.
 * @param {object} messagePayload El payload del mensaje que se envía.
 */
function registerBotResponseToN8n(to, messagePayload) {
    const payload = {
        source: 'bot',
        recipient: to,
        timestamp: Math.floor(Date.now() / 1000),
        messagePayload: messagePayload
    };

    console.log('Registrando respuesta del bot en n8n:', JSON.stringify(payload, null, 2));

    axios.post(N8N_WEBHOOK_URL, payload)
        .then(response => {
            console.log('Respuesta del bot registrada en n8n:', response.data);
        })
        .catch(error => {
            console.error('Error registrando respuesta del bot en n8n:', error.message);
        });
}

// 2. FUNCIÓN MEJORADA PARA ENVÍO DE PEDIDOS COMPLETADOS
/**
 * Envía los detalles de un pedido completado a n8n con el formato exacto esperado.
 * @param {string} from El número del cliente.
 * @param {object} orderDetails Los detalles del pedido.
 */
function sendOrderCompletionToN8nEnhanced(from, orderDetails) {
    const payload = {
        from: from,
        type: 'order_completed',
        timestamp: Math.floor(Date.now() / 1000),
        order: {
            summary: orderDetails.summary || '',
            total: orderDetails.total || 0,
            fullText: orderDetails.fullText || ''
        },
        delivery: {
            address: orderDetails.address || '',
            accessCodeRequired: orderDetails.accessCodeRequired || false
        },
        payment: {
            method: orderDetails.paymentMethod || '',
            // Añade detalles específicos del pago según el método
            ...(orderDetails.paymentMethod === 'Efectivo' && { 
                cashDenomination: orderDetails.cashDenomination 
            }),
            ...(orderDetails.paymentMethod === 'Transferencia' && { 
                proofImageId: orderDetails.proofImageId 
            })
        }
    };

    console.log('Enviando pedido completo a n8n (enhanced):', JSON.stringify(payload, null, 2));

    axios.post(N8N_WEBHOOK_URL, payload)
        .then(response => {
            console.log('Respuesta de n8n (pedido completo enhanced):', response.data);
        })
        .catch(error => {
            console.error('Error enviando pedido completo a n8n (enhanced):', error.message);
        });
}

// 3. FUNCIÓN PARA ENVÍO DE ACTUALIZACIONES DE DIRECCIÓN
/**
 * Envía una actualización de dirección al workflow de n8n.
 * @param {string} from El número del cliente.
 * @param {string} address La nueva dirección.
 */
function sendAddressUpdateToN8n(from, address) {
    const payload = {
        from: from,
        type: 'address_update',
        timestamp: Math.floor(Date.now() / 1000),
        address: address
    };

    console.log('Enviando actualización de dirección a n8n:', JSON.stringify(payload, null, 2));

    axios.post(N8N_WEBHOOK_URL, payload)
        .then(response => {
            console.log('Actualización de dirección enviada a n8n:', response.data);
        })
        .catch(error => {
            console.error('Error enviando actualización de dirección a n8n:', error.message);
        });
}

// 4. FUNCIÓN AUXILIAR PARA VERIFICAR ADMINISTRADORES (debe coincidir con el workflow)
/**
 * Función auxiliar que debe coincidir con checkIfAdmin del workflow
 * @param {string} phoneNumber Número de teléfono a verificar
 * @returns {boolean} True si es admin
 */
function checkIfAdminForWorkflow(phoneNumber) {
    if (!phoneNumber || !ADMIN_WHATSAPP_NUMBERS) {
        return false;
    }
    const adminNumbers = ADMIN_WHATSAPP_NUMBERS.split(',').map(num => num.trim());
    return adminNumbers.includes(phoneNumber);
}


// 6. FUNCIÓN MODIFICADA PARA PROCESAR MENSAJES ENTRANTES
/**
 * Procesa mensajes entrantes con integración completa al workflow
 */
async function processIncomingMessage(message) {
    const from = message.from;
    const messageType = message.type;
    
    console.log(`🔄 Procesando mensaje de ${from}, tipo: ${messageType}`);

    try {
        // Obtener estado del usuario desde Redis
        let userState = await getUserState(from);

        switch (messageType) {
            case 'text':
                const text = message.text.body;
                
                // Verificar si es un pedido completado (del menú web)
                if (text.includes('Total del pedido:') || text.includes('Total a pagar:')) {
                    console.log('🛒 Pedido completado detectado');
                    await handleOrderCompletion(from, text, userState);
                } else {
                    // Procesar como mensaje de texto normal
                    await handleTextMessage(from, text, userState);
                }
                break;

            case 'interactive':
                await handleInteractiveMessage(from, message.interactive, userState);
                break;

            case 'image':
                await handleImageMessage(from, message.image, userState);
                break;

            case 'location':
                await handleLocationMessage(from, message.location, userState);
                break;

            default:
                console.log(`⚠️ Tipo de mensaje no manejado: ${messageType}`);
                break;
        }
    } catch (error) {
        console.error('❌ Error procesando mensaje:', error);
        await sendTextMessage(
            from,
            'Lo siento, hubo un error procesando tu mensaje. Por favor intenta de nuevo.'
        );
    }
}

// 7. FUNCIÓN PARA MANEJAR FINALIZACIÓN DE PEDIDOS
/**
 * Maneja la finalización de pedidos desde el menú web
 */
async function handleOrderCompletion(from, orderText, userState) {
    console.log('🍹 Procesando finalización de pedido para:', from);

    // Actualizar estado del usuario
    userState.orderText = orderText;
    userState.currentStep = 'awaiting_address';
    userState.orderTimestamp = Math.floor(Date.now() / 1000);
    
    await setUserState(from, userState);

    // Extraer información del pedido
    const orderInfo = extractOrderInfo(orderText);
    
    // Enviar a n8n como pedido completado
    await sendOrderCompletionToN8nEnhanced(from, {
        summary: orderInfo.summary,
        total: orderInfo.total,
        fullText: orderText
    });

    // Solicitar dirección de entrega
    const addressMessage = {
        type: 'interactive',
        interactive: {
            type: 'button',
            body: {
                text: `¡Perfecto! Tu pedido ha sido recibido 🎉

${orderInfo.summary}

*Total: $${orderInfo.total}*

Para continuar, necesito tu dirección de entrega:`
            },
            action: {
                buttons: [
                    {
                        type: 'reply',
                        reply: {
                            id: 'send_location',
                            title: '📍 Enviar ubicación'
                        }
                    },
                    {
                        type: 'reply',
                        reply: {
                            id: 'type_address',
                            title: '✏️ Escribir dirección'
                        }
                    }
                ]
            }
        }
    };

    await sendMessage(from, addressMessage);
    
    // Registrar respuesta del bot en n8n
    registerBotResponseToN8n(from, addressMessage);
}

// 8. FUNCIÓN AUXILIAR PARA EXTRAER INFORMACIÓN DEL PEDIDO
/**
 * Maneja los mensajes de texto procesando comandos, estados del usuario y consultas libres.
 * @param {string} from El número del remitente.
 * @param {string} text El texto del mensaje.
 * @param {object} userState El estado actual del usuario.
 */
async function handleTextMessage(from, text, userState) {
    console.log(`💬 Procesando mensaje de texto de ${from}: "${text}"`);
    
    // 1. Verificar si es un administrador
    if (isAdmin(from)) {
        await handleAdminMessage({ from, type: 'text', text: { body: text } });
        return;
    }

    // 2. Manejar estados específicos del usuario
    if (userState && userState.step) {
        switch (userState.step) {
            case 'awaiting_address':
                await handleAddressResponse(from, text);
                return;
            
            case 'awaiting_cash_denomination':
                await handleCashDenominationResponse(from, text);
                return;
            
            case 'in_conversation_with_admin':
                // El usuario está en chat con un admin, reenviar el mensaje
                const adminNumber = userState.admin;
                await sendTextMessage(adminNumber, `👤 Cliente ${formatDisplayNumber(from)}: ${text}`);
                return;
                
            default:
                // Estado no reconocido, continuar con el procesamiento normal
                break;
        }
    }

    // 3. Normalizar el texto para búsqueda de comandos
    const normalizedText = text.toLowerCase().trim();
    
    // 4. Buscar manejador de comandos
    const commandHandler = findCommandHandler(normalizedText);
    if (commandHandler) {
        await commandHandler(from, normalizedText);
        return;
    }
    
    // 5. Si no se encontró comando, usar Gemini para responder
    await handleFreeformQuery(from, text);
}

/**
 * Maneja los mensajes interactivos (botones, listas).
 * @param {string} from El número del remitente.
 * @param {object} interactive El objeto interactive del mensaje.
 * @param {object} userState El estado actual del usuario.
 */
async function handleInteractiveMessage(from, interactive, userState) {
    console.log(`🎯 Procesando mensaje interactivo de ${from}:`, interactive);
    
    if (interactive.type === 'button_reply') {
        const buttonId = interactive.button_reply?.id;
        const buttonTitle = interactive.button_reply?.title;
        
        console.log(`Botón presionado: ${buttonId} - ${buttonTitle}`);
        
        // Verificar si hay un manejador específico para este botón
        if (buttonCommandHandlers[buttonId]) {
            await buttonCommandHandlers[buttonId](from);
            return;
        }
        
        // Manejar botones específicos del flujo de pedidos
        if (userState && userState.step) {
            switch (userState.step) {
                case 'awaiting_access_code_info':
                    if (buttonId === 'access_code_yes' || buttonId === 'access_code_no') {
                        await handleAccessCodeResponse(from, buttonId);
                        return;
                    }
                    break;
                    
                case 'awaiting_payment_method':
                    if (buttonId === 'payment_cash' || buttonId === 'payment_transfer') {
                        await handlePaymentMethodResponse(from, buttonId);
                        return;
                    }
                    break;
                    
                case 'awaiting_address':
                    if (buttonId === 'send_location') {
                        await sendTextMessage(from, '📍 Por favor, envía tu ubicación usando el botón de WhatsApp para compartir ubicación.');
                        return;
                    } else if (buttonId === 'type_address') {
                        await sendTextMessage(from, '✏️ Por favor, escribe tu dirección completa (calle, número, colonia, referencias).');
                        return;
                    }
                    break;
            }
        }
        
        // Si no se maneja específicamente, responder de forma general
        await sendTextMessage(from, 'He recibido tu selección. ¿En qué más puedo ayudarte?');
    }
}

/**
 * Maneja los mensajes de imagen.
 * @param {string} from El número del remitente.
 * @param {object} image El objeto image del mensaje.
 * @param {object} userState El estado actual del usuario.
 */
async function handleImageMessage(from, image, userState) {
    console.log(`📷 Procesando imagen de ${from}:`, image);
    
    // Verificar si el usuario está esperando un comprobante de pago
    if (userState && userState.step === 'awaiting_payment_proof') {
        await handlePaymentProofImage(from, image);
        return;
    }
    
    // Para otras imágenes, responder de forma general
    await sendTextMessage(from, 'He recibido tu imagen. Si es un comprobante de pago, por favor asegúrate de que esté en el proceso de pedido correcto.');
}

/**
 * Maneja los mensajes de ubicación.
 * @param {string} from El número del remitente.
 * @param {object} location El objeto location del mensaje.
 * @param {object} userState El estado actual del usuario.
 */
async function handleLocationMessage(from, location, userState) {
    console.log(`📍 Procesando ubicación de ${from}:`, location);
    
    // Verificar si el usuario está en el proceso de proporcionar su dirección
    if (userState && userState.step === 'awaiting_address') {
        const address = `Ubicación: Lat ${location.latitude}, Lng ${location.longitude}`;
        await handleAddressResponse(from, address);
        return;
    }
    
    // Para ubicaciones fuera del flujo de pedidos
    await sendTextMessage(from, 'He recibido tu ubicación. Si necesitas hacer un pedido, por favor usa el menú principal.');
}

/**
 * Extrae información relevante del texto del pedido
 */
function extractOrderInfo(orderText) {
    // Buscar el total
    const totalMatch = orderText.match(/Total (?:del pedido|a pagar):\s*\$?(\d+(?:\.\d{2})?)/i);
    const total = totalMatch ? parseFloat(totalMatch[1]) : 0;

    // Extraer resumen de items (líneas entre el inicio y el total)
    const lines = orderText.split('\n').map(line => line.trim()).filter(Boolean);
    const totalLineIndex = lines.findIndex(line => 
        line.toLowerCase().includes('total del pedido:') || 
        line.toLowerCase().includes('total a pagar:')
    );

    let summary = '';
    if (totalLineIndex > 0) {
        // Buscar líneas que parecen items
        const itemLines = lines.slice(1, totalLineIndex).filter(line => 
            line.includes('x ') || line.includes('$') || /\d+. *\w+/ .test(line)
        );
        summary = itemLines.join('\n');
    }

    return {
        total: total,
        summary: summary || 'Pedido personalizado',
        fullText: orderText
    };
}

/**
 * Maneja los mensajes provenientes de un número de administrador.
 * @param {object} message El objeto de mensaje de la API de WhatsApp.
 */
async function handleAdminMessage(message) {
    const from = message.from;
    const messageBody = message.type === 'text' ? message.text.body.trim() : '';
    const lowerCaseMessage = messageBody.toLowerCase();

    // --- Comandos de Modo Fuera de Servicio ---
    if (lowerCaseMessage === 'activar fuera de servicio') {
        await redisClient.set(MAINTENANCE_MODE_KEY, 'true');
        await sendTextMessage(from, '✅ Modo "Fuera de Servicio" ACTIVADO. El bot informará a los clientes que no hay servicio.');
        await notifyAdmin(`⚠️ El administrador ${formatDisplayNumber(from)} ha ACTIVADO el modo "Fuera de Servicio".`);
        return;
    }

    if (lowerCaseMessage === 'desactivar fuera de servicio') {
        await redisClient.del(MAINTENANCE_MODE_KEY);
        await sendTextMessage(from, '✅ Modo "Fuera de Servicio" DESACTIVADO. El bot vuelve a operar normalmente.');
        await notifyAdmin(`🟢 El administrador ${formatDisplayNumber(from)} ha DESACTIVADO el modo "Fuera de Servicio".`);
        return;
    }

    const adminState = await getUserState(from);

    // --- Comandos de Chat Directo ---

    // Comando para terminar una conversación
    if (lowerCaseMessage === 'terminar chat' || lowerCaseMessage === 'salir') {
        if (adminState && adminState.mode === 'chatting') {
            const clientNumber = adminState.targetUser;
            // Limpiamos los estados de ambos
            await deleteUserState(from);
            await deleteUserState(clientNumber);

            await sendTextMessage(from, `✅ Chat con ${formatDisplayNumber(clientNumber)} finalizado. Has vuelto al modo normal.`);
            await sendTextMessage(clientNumber, `La conversación con nuestro agente ha terminado. Si necesitas algo más, escribe "hola" para ver el menú. 👋`);
        } else {
            await sendTextMessage(from, `No estás en un chat activo. Para iniciar uno, usa el comando: "hablar con <numero>"`);
        }
        return;
    }

    // Comando para iniciar una conversación
    if (lowerCaseMessage.startsWith('hablar con ')) {
        const targetUser = lowerCaseMessage.replace('hablar con ', '').trim();
        // Validación simple para asegurar que es un número
        if (/^\d+$/.test(targetUser)) {
            // Establecemos el estado para el admin y para el cliente
            await setUserState(from, { mode: 'chatting', targetUser: targetUser });
            await setUserState(targetUser, { mode: 'in_conversation_with_admin', admin: from });

            await sendTextMessage(from, `📞 Has iniciado un chat directo con ${formatDisplayNumber(targetUser)}. Todo lo que escribas ahora se le enviará directamente.

Para terminar, escribe "terminar chat".`);
            await sendTextMessage(targetUser, `🧑‍ Un agente se ha unido a la conversación para ayudarte personalmente.`);
        } else {
            await sendTextMessage(from, `El número proporcionado no es válido. Asegúrate de que sea solo el número de WhatsApp (ej. 521771...).`);
        }
        return;
    }

    // Si el admin ya está en modo chat, reenviamos su mensaje al cliente
    if (adminState && adminState.mode === 'chatting') {
        const clientNumber = adminState.targetUser;
        if (message.type === 'text') {
            await sendTextMessage(clientNumber, `🧑‍ Agente: ${message.text.body}`);
        } else {
            // En el futuro se podría implementar el reenvío de imágenes, audios, etc.
            await sendTextMessage(from, "Por ahora, solo puedo reenviar mensajes de texto en el chat directo.");
        }
        return;
    }

    // --- Otros Comandos de Admin ---

    console.log(`Mensaje recibido del administrador ${from}: "${messageBody}"`);

    switch (lowerCaseMessage) {
        case '/test_webhook':
            const testPayload = {
                from: from,
                type: 'test_message',
                timestamp: Math.floor(Date.now() / 1000),
                test: true,
                message: 'Mensaje de prueba del webhook'
            };
            
            await axios.post(N8N_WEBHOOK_URL, testPayload);
            await sendTextMessage(from, '✅ Mensaje de prueba enviado al webhook de n8n');
            break;

        case '/test_order':
            // Crear el pedido de prueba
            const testOrderText = `🍹 Tu pedido de CapiBobba

1x Frappé de Chocolate - $45.00
2x Bubble Tea de Taro - $90.00
1x Smoothie de Mango - $38.00

Total del pedido: $173.00

¡Gracias por tu preferencia!`;

            // ENVIAR EL PEDIDO COMO order_completed a n8n
            const orderCompletedPayload = {
                from: from,
                type: 'order_completed',
                timestamp: Math.floor(Date.now() / 1000),
                order: {
                    summary: "1x Frappé de Chocolate - $45.00\n2x Bubble Tea de Taro - $90.00\n1x Smoothie de Mango - $38.00",
                    total: 173.00,
                    fullText: testOrderText
                },
                delivery: {
                    address: "Calle de Prueba #123, Colonia Test, Pachuca",
                    accessCodeRequired: false
                },
                payment: {
                    method: "Efectivo",
                    cashDenomination: "200"
                }
            };

            try {
                // Enviar a n8n como pedido completado
                await axios.post(N8N_WEBHOOK_URL, orderCompletedPayload);
                console.log('✅ Pedido de prueba enviado a n8n:', orderCompletedPayload);
                
                await sendTextMessage(from, '✅ Pedido de prueba enviado al workflow de n8n. Deberías recibir notificaciones en Telegram.');
            } catch (error) {
                console.error('❌ Error enviando pedido de prueba:', error.message);
                await sendTextMessage(from, `❌ Error enviando pedido de prueba: ${error.message}`);
            }
            break;

        case '/test_order_user':
            // Simular mensaje de usuario con pedido
            const userOrderPayload = {
                from: from,
                type: 'text',
                timestamp: Math.floor(Date.now() / 1000).toString(),
                rawMessage: {
                    from: from,
                    id: `test_msg_${Date.now()}`,
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    text: {
                        body: `¡Hola! Me gustaría hacer un pedido con los siguientes productos:

1. Blueberry x 1 ($75.00 c/u) - Subtotal: $75.00

Total del pedido: $75.00

¡Espero su confirmación! Gracias. 😊`
                    },
                    type: 'text'
                },
                text: `¡Hola! Me gustaría hacer un pedido con los siguientes productos:

1. Blueberry x 1 ($75.00 c/u) - Subtotal: $75.00

Total del pedido: $75.00

¡Espero su confirmación! Gracias. 😊`
            };

            try {
                await axios.post(N8N_WEBHOOK_URL, userOrderPayload);
                console.log('✅ Mensaje de pedido de usuario simulado enviado a n8n');
                
                await sendTextMessage(from, '✅ Mensaje de pedido de usuario simulado enviado. Deberías ver el flujo completo en Telegram.');
            } catch (error) {
                console.error('❌ Error enviando mensaje simulado:', error.message);
                await sendTextMessage(from, `❌ Error: ${error.message}`);
            }
            break;

        case '/debug_payload':
            // Mostrar cómo se está enviando actualmente
            const debugPayload = {
                from: from,
                type: 'text',
                timestamp: Math.floor(Date.now() / 1000).toString(),
                rawMessage: {
                    from: from,
                    text: { body: '/test_order' },
                    type: 'text'
                },
                text: '/test_order'
            };
            
            await sendTextMessage(from, `🔍 Payload actual que se envía:\n\`\`\`json\n${JSON.stringify(debugPayload, null, 2)}\n\`\`\``);
            break;

        case '/webhook_status':
            try {
                const response = await axios.get(N8N_WEBHOOK_URL.replace('/webhook/', '/health'), { timeout: 5000 });
                await sendTextMessage(from, '✅ Webhook de n8n está funcionando correctamente');
            } catch (error) {
                await sendTextMessage(from, `❌ Error conectando con webhook: ${error.message}`);
            }
            break;

        case 'hola admin':
            await sendTextMessage(from, `🤖 Saludos, administrador. Estoy a tu disposición. Puedes usar "hablar con <numero>" para chatear con un cliente.`);
            break;
    }
}

/**
 * Maneja la respuesta numérica de una encuesta de satisfacción.
 * @param {string} from El número del remitente.
 * @param {number} rating La calificación dada por el usuario (0-5).
 */
async function handleSurveyResponse(from, rating) {
  console.log(`Respuesta de encuesta recibida de ${from}: Calificación ${rating}`);
  logSurveyResponseToFile({ from: from, rating: rating }); // Log the survey response

  let responseText;

  // Personalizamos el mensaje de agradecimiento según la calificación.
  if (rating <= 2) {
    responseText = `Lamentamos mucho que tu experiencia no haya sido la mejor. Agradecemos tus comentarios y los tomaremos en cuenta para mejorar. Un agente podría contactarte para entender mejor qué pasó.`;
    // Notificamos a un admin sobre la mala calificación para un seguimiento.
    notifyAdmin(`⚠️ ¡Alerta de Calificación Baja! ⚠️\n\nEl cliente ${formatDisplayNumber(from)} ha calificado el servicio con un: *${rating}*.\n\nSería bueno contactarlo para entender qué podemos mejorar.`);
  } else if (rating >= 4) {
    responseText = `¡Nos alegra mucho que hayas tenido una buena experiencia! Gracias por tu calificación. ¡Esperamos verte pronto! 🎉`;
  } else { // Para calificaciones de 3
    responseText = `¡Muchas gracias por tus comentarios! Tu opinión es muy importante para nosotros y nos ayuda a mejorar. 😊`;
  }

  await sendTextMessage(from, responseText);

  // Opcional: Si usaras un estado como 'awaiting_survey', aquí lo limpiarías.
  // await deleteUserState(from);
}
// --- MANEJADORES DE COMANDOS ---

/**
 * Comprueba si un texto es un saludo común.
 * @param {string} text El texto a comprobar en minúsculas.
 * @returns {boolean}
 */
function isGreeting(text) {
  const greetings = ['hola', 'buenas', 'buenos dias', 'buen dia', 'hey', 'que tal', 'buenas tardes','buenas noches'];
  return greetings.some(greeting => text.startsWith(greeting));
}

/**
 * Define los manejadores para los botones interactivos.
 * La clave es el ID del botón y el valor es la función manejadora.
 */
const buttonCommandHandlers = {
  'ver_menu': handleShowMenu,
  'ver_promociones': handleShowPromotions,
  'contactar_agente': handleContactAgent
};

/**
 * Define la lista de comandos de texto, su prioridad y cómo detectarlos.
 * El array se procesa en orden, por lo que los comandos más específicos deben ir primero.
 */
const commandHandlers = [
  // Prioridad 1: Pedido completo desde el menú web. Es el más específico.
  {
    name: 'Handle Web Menu Order',
    match: (text) => text.includes('total del pedido:') || text.includes('total a pagar:'),
    handler: handleNewOrderFromMenu
  },
  // Prioridad 2: Intención de hacer un pedido.
  {
    name: 'Initiate Order',
    keywords: ['pedido', 'ordenar', 'quisiera pedir', 'me gustaría pedir', 'me gustaría hacer el siguiente pedido', 'quiero pedir', 'me gustaría ordenar'],
    handler: handleInitiateOrder
  },
  // Prioridad 3: Saludos comunes.
  {
    name: 'Greeting',
    match: isGreeting,
    handler: sendMainMenu
  },
  // NUEVO: Prioridad 3.5: Preguntas sobre el estado del servicio.
  {
    name: 'Check Service Status',
    keywords: ['servicio', 'abierto', 'trabajando', 'atienden', 'atendiendo', 'laborando'],
    handler: handleServiceStatusCheck
  },
  // Prioridad 4: Comandos generales por palabra clave.
  { name: 'Show Menu', keywords: ['menu'], handler: handleShowMenu },
  { name: 'Show Promotions', keywords: ['promo'], handler: handleShowPromotions },
  { name: 'Show Hours', keywords: ['hora', 'horario'], handler: handleShowHours },
  { name: 'Show Location', keywords: ['ubicacion', 'donde estan', 'domicilio'], handler: handleShowLocation },
  { name: 'Help', keywords: ['ayuda'], handler: sendMainMenu } // 'ayuda' ahora usa el mismo sistema
];

/**
 * Busca y devuelve el manejador de comandos apropiado para un mensaje de texto.
 * Itera a través de la lista `commandHandlers` y devuelve el primer manejador que coincida.
 * @param {string} text El mensaje del usuario en minúsculas y sin espacios extra.
 * @returns {Function|null} La función manejadora o null si no se encuentra.
 */
function findCommandHandler(text) {
  for (const command of commandHandlers) {
    // Estrategia 1: Función de match personalizada (la más flexible)
    if (command.match && command.match(text)) {
      return command.handler;
    }
    // Estrategia 2: Coincidencia por palabras clave
    if (command.keywords && command.keywords.some(keyword => text.includes(keyword))) {
      return command.handler;
    }
  }
  // Si ninguna de las palabras clave coincide, no devolvemos nada para que lo maneje Gemini.
  return null;
}

// --- ACCIONES DEL BOT (Las respuestas de tu negocio) ---

/**
 * Envía el menú principal con botones.
 * @param {string} to Número del destinatario.
 */
async function sendMainMenu(to, text) {
  // Verificamos el modo "fuera de servicio"
  const isMaintenanceMode = await redisClient.get(MAINTENANCE_MODE_KEY) === 'true';
  let bodyText = '¡Hola! Soy CapiBot, el asistente virtual de CapiBobba. ¿Cómo puedo ayudarte hoy?';
  let adminNotification = `🔔 ¡Atención! El cliente ${formatDisplayNumber(to)} ha iniciado una conversación y está viendo el menú principal.`;

  if (isMaintenanceMode) {
    bodyText = `⚠️ *AVISO: En este momento no estamos tomando pedidos.*

¡Hola! Soy CapiBot. Aunque no hay servicio de pedidos, puedo darte información sobre nuestro menú o promociones. ¿En qué te ayudo?`;
    adminNotification += '\n(Modo "Fuera de Servicio" está ACTIVO)';
  }

  // Notificamos al administrador
  notifyAdmin(adminNotification);

  const payload = {
    type: 'interactive',
    interactive: {
      type: 'button',
      header: { type: 'text', text: '🧋CapiBobba🧋' },
      body: { text: bodyText },
      footer: { text: 'Selecciona una opción' },
      action: {
        buttons: [
          { type: 'reply', reply: { id: 'ver_menu', title: 'Ver Menú 📜' } },
          { type: 'reply', reply: { id: 'ver_promociones', title: 'Promociones ✨' } },
          { type: 'reply', reply: { id: 'contactar_agente', title: 'Hablar con alguien 🧑‍' } }
        ]
      }
    }
  };
  await sendMessage(to, payload);
}

/**
 * Maneja la solicitud para ver el menú.
 * @param {string} to Número del destinatario.
 */
async function handleShowMenu(to, text) {
  await sendTextMessage(to, `¡Claro! Aquí está nuestro delicioso menú: https://feyomx.github.io/menucapibobba/`);
}

/**
 * Maneja la solicitud para ver las promociones.
 * @param {string} to Número del destinatario.
 */
async function handleShowPromotions(to, text) {
  const promoText = `¡Nuestras promos de hoy! ✨\n\n- *Combo dia Lluvioso:* 2 bebidas calientes del mismo sabor x $110.\n- *Combo Amigos:* 2 Frappe base agua del mismo sabor por $130.`;
  await sendTextMessage(to, promoText);
}

/**
 * Maneja la solicitud de horario.
 * @param {string} to Número del destinatario.
 */
async function handleShowHours(to, text) {
  const hoursText = `Nuestro horario de atención es:\nLunes a Viernes: 6:00 PM - 10:00 PM\nSábados y Domingos: 12:00 PM - 10:00 PM`;
  await sendTextMessage(to, hoursText);
}

/**
 * Maneja la solicitud de ubicación.
 * @param {string} to Número del destinatario.
 */
async function handleShowLocation(to, text) {
  const locationText = `Tenemos servicio a domicilio GRATIS en los fraccionamientos aledaños a Viñedos!`;
  await sendTextMessage(to, locationText);
}

/**
 * Maneja la solicitud para contactar a un agente.
 * @param {string} to Número del destinatario.
 */
async function handleContactAgent(to, text) {
  await sendTextMessage(to, 'Entendido. Un agente se pondrá en contacto contigo en breve.');
  await notifyAdmin(`🔔 ¡Atención! El cliente ${formatDisplayNumber(to)} solicita hablar con un agente.`);
}

/**
 * NUEVO: Verifica si hay servicio y responde adecuadamente.
 * Si el modo "fuera de servicio" está activo, lo informa.
 * Si no, delega la pregunta a Gemini para una respuesta más natural.
 * @param {string} to Número del destinatario.
 * @param {string} text El texto de la pregunta del usuario.
 */
async function handleServiceStatusCheck(to, text) {
  const isMaintenanceMode = await redisClient.get(MAINTENANCE_MODE_KEY) === 'true';

  if (isMaintenanceMode) {
    // Si el modo está activo, siempre informa que no hay servicio.
    await sendTextMessage(to, 'Hola. En este momento no estamos tomando pedidos. ¡Agradecemos tu comprensión y esperamos verte pronto! 👋');
  } else {
    // Si el servicio está activo, la pregunta es general ("¿están abiertos?").
    // Dejamos que Gemini la responda usando el contexto del negocio (horarios).
    await handleFreeformQuery(to, text);
  }
}
/**
 * Maneja la intención de iniciar un pedido.
 * Si el pedido ya está en el mensaje, lo procesa.
 * Si no, guía al usuario para que lo genere.
 * @param {string} to Número del destinatario.
 * @param {string} text El texto completo del mensaje del usuario.
 */
async function handleInitiateOrder(to, text) {
  // NUEVO: Verificación del modo "fuera de servicio"
  const isMaintenanceMode = await redisClient.get(MAINTENANCE_MODE_KEY) === 'true';
  if (isMaintenanceMode) {
    await sendTextMessage(to, '¡Hola! En este momento no estamos tomando pedidos, pero con gusto puedo darte información sobre nuestro menú o promociones. ¿En qué te puedo ayudar? 😊');
    return;
  }

  // Comprueba si el texto del mensaje ya contiene un pedido formateado con el texto correcto.
  if (text.toLowerCase().includes('total del pedido:')) {
    await handleNewOrderFromMenu(to, text);
  } else {
    // Si solo es la intención, guía al usuario.
    const guideText = `¡Genial! Para tomar tu pedido de la forma más rápida y sin errores, por favor, créalo en nuestro menú interactivo y cuando termines, copia y pega el resumen de tu orden aquí.

Aquí tienes el enlace: https://feyomx.github.io/menucapibobba/`;
    await sendTextMessage(to, guideText);
  }
}

/**
 * Extrae solo los artículos de un texto de pedido completo.
 * @param {string} orderText El texto completo del pedido.
 * @returns {string} Una cadena con solo los artículos del pedido, uno por línea.
 */
function extractOrderItems(orderText) {
  const lines = orderText.split('\n');
  const totalLineIndex = lines.findIndex(line => line.toLowerCase().startsWith('total del pedido:'));

  // Si no se encuentra la línea de total, es probable que el formato no sea el esperado.
  // Usamos un fallback, pero lo ideal es que el formato siempre sea consistente.
  if (totalLineIndex === -1) {
    return orderText.split('\n').slice(1, -2).join('\n');
  }

  // Buscamos el inicio de los artículos. Asumimos que es después de la primera línea vacía.
  const firstEmptyLineIndex = lines.findIndex(line => line.trim() === '');
  const startIndex = firstEmptyLineIndex > -1 ? firstEmptyLineIndex + 1 : 1;

  // Filtramos las líneas entre el inicio y la línea de total para quedarnos solo con los artículos.
  const items = lines.slice(startIndex, totalLineIndex).filter(line => line.trim() !== '');
  
  return items.join('\n');
}

/**
 * Construye un mensaje de notificación estandarizado para los administradores.
 * @param {string} title El título de la notificación (ej. "🎉 ¡Nuevo pedido en Efectivo!").
 * @param {object} userState El estado completo del usuario.
 * @param {string} from El número de WhatsApp del cliente.
 * @param {object} [extraDetails={}] Un objeto con detalles adicionales a incluir (ej. { 'Paga con': '$500' }).
 * @returns {string} El mensaje de notificación formateado.
 */
function buildAdminNotification(title, userState, from, extraDetails = {}) {
  // 1. Desestructuración segura con valores por defecto para evitar errores.
  const { address = 'No especificada', orderText = '', accessCodeInfo } = userState || {};

  // 2. Extracción de datos.
  const orderSummary = extractOrderItems(orderText);
  // Regex mejorada: busca el total, permitiendo opcionalmente un espacio y decimales.
  const totalMatch = orderText.match(/Total del pedido:\s*(\$?\d+(\.\d{1,2})?)/i);
  const total = totalMatch ? totalMatch[1] : 'N/A';
  
  // 3. Mensajes claros con emojis consistentes.
  const accessCodeMessage = accessCodeInfo === 'access_code_yes'
    ? '🔐 Sí, se necesita código'
    : '🔓 No, acceso libre';

  // 4. Construcción del mensaje usando un array para mayor legibilidad y mantenimiento.
  const notificationParts = [
    title,
    '──────────────────',
    `🧍 *Cliente:* ${formatDisplayNumber(from)}`,
    `🏠 *Dirección:* ${address}`,
    `🔑 *Acceso:* ${accessCodeMessage}`,
    '', // Espacio antes del pedido
    '🧾 *Pedido:*',
    orderSummary,
    '', // Espacio después del pedido
    `💰 *Total:* ${total}`
  ];

  // Añadir detalles extra si se proporcionan
  Object.entries(extraDetails).forEach(([key, value]) => {
    notificationParts.push(`📌 *${key}:* ${value}`);
  });

  return notificationParts.join('\n');
}
/**
 * Maneja la recepción de un nuevo pedido desde el menú web.
 * @param {string} to Número del destinatario.
 * @param {string} orderText El texto completo del pedido del cliente.
 */
async function handleNewOrderFromMenu(to, orderText) {
  // NUEVO: Verificación del modo "fuera de servicio"
  const isMaintenanceMode = await redisClient.get(MAINTENANCE_MODE_KEY) === 'true';
  if (isMaintenanceMode) {
    await sendTextMessage(to, '¡Hola! En este momento no estamos tomando pedidos, pero con gusto puedo darte información sobre nuestro menú o promociones. ¿En qué te puedo ayudar? 😊');
    return;
  }

  const totalMatch = orderText.match(/Total del pedido: $(\d+\.\d{2})/i);
  const total = totalMatch ? totalMatch[1] : null;

  // Notificar a los administradores que se ha iniciado un nuevo pedido.
  const orderSummary = extractOrderItems(orderText);
  const initialAdminNotification = `🔔 ¡Nuevo pedido iniciado!\n\n*Cliente:* ${formatDisplayNumber(to)}\n\n*Pedido:*
${orderSummary}\n\n*Total:* ${total ? '$' + total : 'No especificado'}\n\n*Nota:* Esperando dirección y método de pago.`;
  await notifyAdmin(initialAdminNotification);

  let confirmationText = `¡Gracias por tu pedido! ✨\n\nHemos recibido tu orden y ya está en proceso de confirmación.`;

  if (total) {
    confirmationText += `\n\nConfirmamos un total de *$${total}*. En un momento te enviaremos los detalles para el pago.`;
  }

  // 1. Envía el mensaje de confirmación inicial.
  await sendTextMessage(to, confirmationText);

  // 2. Envía la pregunta de seguimiento para la dirección.
  const addressRequestText = `Para continuar, por favor, indícanos tu dirección completa (calle, número, colonia y alguna referencia). 🏠`;
  await sendTextMessage(to, addressRequestText);

  // 3. Pone al usuario en el estado de "esperando dirección".
  await setUserState(to, { step: 'awaiting_address', orderText: orderText });
}

/**
 * Maneja la respuesta del usuario cuando se le pide la dirección.
 * @param {string} from El número del remitente.
 * @param {string} address El texto de la dirección proporcionada.
 */
async function handleAddressResponse(from, address) {
  console.log(`Dirección recibida de ${from}: ${address}`);

  // Mejora: Si el usuario vuelve a enviar el pedido en lugar de la dirección, se lo volvemos a pedir.
  if (address.toLowerCase().includes('total del pedido:')) {
    await sendTextMessage(from, 'Parece que me enviaste el pedido de nuevo. ¡No te preocupes! Ya lo tengo registrado. 👍\n\nAhora solo necesito que me escribas tu dirección completa para continuar.');
    return; // Detenemos la ejecución para esperar la dirección correcta.
  }

  // Pregunta si se necesita código de acceso con botones.
  const payload = {
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: '¡Perfecto! Gracias por tu dirección.\n\n¿Tu domicilio está en una privada y se necesita código de acceso para entrar?' },
      action: {
        buttons: [
          { type: 'reply', reply: { id: 'access_code_yes', title: 'Sí, se necesita' } },
          { type: 'reply', reply: { id: 'access_code_no', title: 'No, no se necesita' } }
        ]
      }
    }
  };
  await sendMessage(from, payload);

  // Actualiza el estado del usuario preservando el estado anterior (como orderText).
  const currentState = await getUserState(from) || {};
  await setUserState(from, { ...currentState, step: 'awaiting_access_code_info', address: address });

  // Notifica a n8n que la dirección fue actualizada.
  // Se crea un payload personalizado para este evento específico,
  // ya que no corresponde a un mensaje directo del usuario.
  sendToN8n({ from: from, type: 'address_update', timestamp: Math.floor(Date.now() / 1000) }, { address });
  console.log(`Dirección enviada a n8n: ${address}`);
}

/**
 * Maneja la respuesta del usuario sobre el código de acceso.
 * @param {string} from El número del remitente.
 * @param {string} buttonId El ID del botón presionado ('access_code_yes' o 'access_code_no').
 */
async function handleAccessCodeResponse(from, buttonId) {
  const userState = await getUserState(from);
  
  // Guardamos la información del código de acceso en el estado
  userState.accessCodeInfo = buttonId;

  // Ahora, en lugar de finalizar, preguntamos por el método de pago
  const payload = {
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: '¡Excelente! Por último, ¿cómo prefieres realizar tu pago?' },
      action: {
        buttons: [
          { type: 'reply', reply: { id: 'payment_cash', title: 'Efectivo 💵' } },
          { type: 'reply', reply: { id: 'payment_transfer', title: 'Transferencia 💳' } }
        ]
      }
    }
  };
  await sendMessage(from, payload);

  // Actualiza el estado del usuario para esperar la respuesta del método de pago.
  await setUserState(from, { ...userState, step: 'awaiting_payment_method' });
}

/**
 * Maneja la respuesta del usuario sobre el método de pago.
 * @param {string} from El número del remitente.
 * @param {string} buttonId El ID del botón presionado ('payment_cash' o 'payment_transfer').
 */
async function handlePaymentMethodResponse(from, buttonId) {
  const userState = await getUserState(from);
  if (!userState) return; // Chequeo de seguridad

  if (buttonId === 'payment_transfer') {
    const bankDetails = `Para transferencias, puedes usar la siguiente cuenta:\n- Banco: MERCADO PAGO W\n- Número de Cuenta: 722969010305501833\n- A nombre de: Maria Elena Martinez Flores\n\nPor favor, envía tu comprobante de pago a este mismo chat para confirmar tu pedido.`;
    await sendTextMessage(from, bankDetails);
    await sendTextMessage(from, 'Por favor, envía una imagen de tu comprobante de pago a este mismo chat para confirmar tu pedido.');

    // Notificar al administrador
    const adminNotification = buildAdminNotification(
      '⏳ Pedido por Transferencia en espera',
      userState,
      from,
      { 'Nota': 'Esperando comprobante de pago.' }
    );
    await notifyAdmin(adminNotification);

    // Actualizamos el estado para esperar la imagen del comprobante
    await setUserState(from, { ...userState, step: 'awaiting_payment_proof', paymentMethod: 'Transferencia' });
  } else { // 'payment_cash'
    await sendTextMessage(from, 'Has elegido pagar en efectivo. ¿Con qué billete pagarás? (ej. $200, $500) para que podamos llevar tu cambio exacto.');
    // Guardamos el método de pago en el estado
    await setUserState(from, { ...userState, step: 'awaiting_cash_denomination', paymentMethod: 'Efectivo' });
  }
}

/**
 * Maneja la respuesta del usuario sobre la denominación del billete.
 * @param {string} from El número del remitente.
 * @param {string} denomination El texto con la denominación del billete.
 */
async function handleCashDenominationResponse(from, denomination) {
  // Mejora: Validar la entrada del usuario para asegurar que sea un número.
  const sanitizedDenomination = denomination.trim().replace('$', '');
  if (isNaN(sanitizedDenomination) || parseFloat(sanitizedDenomination) <= 0) {
    await sendTextMessage(from, 'Por favor, ingresa un monto válido para el pago en efectivo (ej. 200, 500).');
    return; // No continuamos si la entrada no es válida.
  }

  const userState = await getUserState(from);
  const address = userState.address;
  let finalMessage = `¡Pedido completo y confirmado! 🛵\n\nTu orden será enviada a:\n*${address}*.\n\n`;

  if (userState.accessCodeInfo === 'access_code_yes') {
    finalMessage += `Un agente te contactará para el código de acceso cuando el repartidor esté en camino.\n\n`;
  } else {
    finalMessage += `Hemos registrado que no se necesita código de acceso.`;
  }
  
  finalMessage += `\nLlevaremos cambio para tu pago de *${denomination}*.\n\n¡Gracias por tu preferencia!`;

  await sendTextMessage(from, finalMessage);

  // Notificar al administrador
  const adminNotification = buildAdminNotification(
    '🎉 ¡Nuevo pedido en Efectivo!',
    userState,
    from,
    { 'Paga con': denomination }
  );
  await notifyAdmin(adminNotification);

  // Guardamos la denominación y enviamos el pedido completo a n8n
  const finalState = { ...userState, cashDenomination: sanitizedDenomination };
  sendOrderCompletionToN8n(from, finalState);
  logOrderToFile(finalState); // Log the completed order

  console.log(`Pedido finalizado para ${from}. Dirección: ${address}. Pago: Efectivo (${sanitizedDenomination}).`);
  await deleteUserState(from);
}

/**
 * Maneja la recepción de una imagen como comprobante de pago.
 * @param {string} from El número del remitente.
 * @param {object} imageObject El objeto de imagen del mensaje, que contiene el ID.
 */
async function handlePaymentProofImage(from, imageObject) {
  const userState = await getUserState(from); // <-- CORRECCIÓN: Usar la función async de Redis.
  if (!userState) return;

  console.log(`Recibido comprobante de pago (imagen) de ${from}`);
  
  // 1. Agradecer al cliente y confirmar el pedido
  await sendTextMessage(from, '¡Gracias! Hemos recibido tu comprobante. Tu pedido ha sido confirmado y se preparará en breve. 🛵');

  // 2. Preparar la notificación para los administradores
  const adminCaption = buildAdminNotification(
    '✅ Comprobante Recibido',
    userState,
    from
  );

  // 3. Construir el payload para reenviar la imagen con el caption
  const imagePayload = {
    type: 'image',
    image: {
      id: imageObject.id, // Usamos el ID de la imagen recibida para reenviarla
      caption: adminCaption
    }
  };

  // 4. Enviar a todos los administradores
  const adminNumbers = ADMIN_WHATSAPP_NUMBERS.split(',').map(num => num.trim());
  for (const number of adminNumbers) {
    if (number) {
      await sendMessage(number, imagePayload);
    }
  }

  // Guardamos el ID de la imagen y enviamos el pedido completo a n8n
  const finalState = { ...userState, proofImageId: imageObject.id };
  sendOrderCompletionToN8n(from, finalState);
  logOrderToFile(finalState); // Log the completed order

  console.log(`Pedido finalizado y comprobante reenviado para ${from}.`);
  
  // 5. Limpiar el estado del usuario
  await deleteUserState(from); // <-- CORRECCIÓN: Usar la función async de Redis.
}
/**
 * Maneja preguntas de formato libre usando la API de Gemini.
 * @param {string} to Número del destinatario.
 * @param {string} userQuery La pregunta del usuario.
 */
async function handleFreeformQuery(to, userQuery) {
  try {
    // Inicializa el modelo de IA Generativa 
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    // ¡Importante! Aquí le das contexto al bot para que sepa cómo comportarse.
    const prompt = `
    Eres "Capi", un asistente virtual experto y amigable de la bubble tea shop "CapiBoba".
    Tu ÚNICA fuente de información es el siguiente contexto del negocio. No debes inventar productos, precios o promociones que no estén en esta lista.
    Si te preguntan por una bebida, recomienda únicamente las que están en el menú.

    --- CONTEXTO DEL NEGOCIO ---
    ${BUSINESS_CONTEXT}
    --- FIN DEL CONTEXTO ---

    Basándote ESTRICTAMENTE en la información del contexto, responde la siguiente pregunta del cliente de forma breve y servicial.
    Si la pregunta no se puede responder con la información proporcionada, responde amablemente que no tienes esa información y sugiere que pregunten por el menú o las promociones.

    Pregunta del cliente: "${userQuery}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const geminiText = response.text();

    sendTextMessage(to, geminiText);
  } catch (error) {
    console.error('Error al contactar la API de Gemini:', error);
    // En caso de error con Gemini, envía una respuesta por defecto.
    defaultHandler(to);
  }
}

/**
 * Maneja los mensajes no reconocidos.
 * @param {string} to Número del destinatario.
 */
async function defaultHandler(to) {
  await sendTextMessage(to, `No entendí tu mensaje. Escribe "hola" o "ayuda" para ver las opciones disponibles.`);
}

/**
 * Envía un mensaje de texto simple.
 * @param {string} to El número de teléfono del destinatario.
 * @param {string} text El texto a enviar.
 */
async function sendTextMessage(to, text) {
  const payload = { type: 'text', text: { body: text } };
  await sendMessage(to, payload);
}

/**
 * Envía una notificación a todos los números de WhatsApp de los administradores.
 * @param {string} text El mensaje de notificación.
 */
async function notifyAdmin(text) {
  if (!ADMIN_WHATSAPP_NUMBERS) {
    console.log('No se han configurado números de administrador para notificaciones.');
    return;
  }

  // Separa la cadena de números en un array, elimina espacios y filtra vacíos.
  const adminNumbers = ADMIN_WHATSAPP_NUMBERS.split(',').map(num => num.trim()).filter(Boolean);

  if (adminNumbers.length === 0) {
    return;
  }

  console.log(`Enviando notificación a los administradores: ${adminNumbers.join(', ')}`);

  // Crea una promesa para cada envío de mensaje
  const promises = adminNumbers.map(number => sendTextMessage(number, text));

  // Espera a que todas las notificaciones se envíen en paralelo para mayor eficiencia
  await Promise.all(promises);
}

/**
 * Envía el indicador de "escribiendo..." al usuario para mejorar la UX.
 * Esta es una acción de "disparar y olvidar", no bloquea el flujo principal.
 * @param {string} to El número de teléfono del destinatario.
 */
async function sendTypingOn(to) {
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${PHONE_NUMBER_ID}/messages`;
  const data = {
    messaging_product: 'whatsapp',
    to: to,
    action: 'typing_on',
  };
  const headers = {
    'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
    'Content-Type': 'application/json',
  };

  try {
    // No usamos await en la llamada a esta función, pero la función es async por axios.
    // No logueamos el éxito para no saturar la consola.
    await axios.post(url, data, { headers });
  } catch (error) {
    // Es una función de UX, si falla no es crítico. No logueamos el error para evitar ruido.
    // console.error('Error al enviar el indicador de typing_on:', error.response ? error.response.data : error.message);
  }
}


/**
 * Envía un mensaje a través de la API de WhatsApp.
 * @param {string} to El número de teléfono del destinatario.
 * @param {object} payload El objeto de mensaje a enviar (puede ser texto, interactivo, etc.).
 */
async function sendMessage(to, payload) {
  logMessageToFile({ type: 'outgoing', to: to, payload: payload }); // Log outgoing message
  // NUEVO: Registramos la respuesta del bot en n8n antes de enviarla.
  // Es una acción de "disparar y olvidar" para no retrasar la respuesta al usuario.
  // Esto nos permite tener un log de todas las comunicaciones salientes.
  registerBotResponseToN8n(to, payload);

  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${PHONE_NUMBER_ID}/messages`;
  const data = {
    messaging_product: 'whatsapp',
    to: to,
    ...payload, // El payload contiene el tipo de mensaje y su contenido
  };
  const headers = {
    'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
    'Content-Type': 'application/json',
  };

  try {
    console.log(`Enviando mensaje a ${to}:`, JSON.stringify(payload, null, 2));
    await axios.post(url, data, { headers });
    console.log('Mensaje enviado exitosamente.');
  } catch (error) {
    console.error('Error al enviar el mensaje:', error.response ? error.response.data : error.message);
  }
}


// --- Funciones de Logging ---

/**
 * Registra una entrada de log en un archivo .jsonl.
 * @param {string} fileName El nombre del archivo (ej. 'message_log.jsonl').
 * @param {object} logEntry El objeto a registrar.
 */
function logToFile(fileName, logEntry) {
  const logFilePath = path.join(__dirname, fileName);
  const timestampedEntry = { timestamp: new Date().toISOString(), ...logEntry };
  fs.appendFile(logFilePath, JSON.stringify(timestampedEntry) + '\n', (err) => {
    if (err) {
      console.error(`Error al escribir en el archivo de log ${fileName}:`, err);
    }
  });
}

// Funciones específicas de log que usan el logger genérico
const logMessageToFile = (logEntry) => logToFile('message_log.jsonl', logEntry);
const logOrderToFile = (orderData) => logToFile('order_log.jsonl', orderData);
const logSurveyResponseToFile = (surveyData) => logToFile('survey_log.jsonl', surveyData);

/**
 * Lee un archivo de log en formato JSONL y envía el contenido como respuesta JSON.
 * @param {string} logFileName El nombre del archivo de log (ej. 'message_log.jsonl').
 * @param {object} res El objeto de respuesta de Express.
 * @param {string} errorContext Un string para el mensaje de error (ej. 'mensajes').
 */
function sendJsonlLogResponse(logFileName, res, errorContext) {
  const logFilePath = path.join(__dirname, logFileName);
  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.json([]); // Si el archivo no existe, devuelve un array vacío.
      }
      console.error(`Error al leer el archivo de log de ${errorContext}:`, err);
      return res.status(500).json({ error: `Error al leer el log de ${errorContext}.` });
    }
    const items = data.split('\n').filter(Boolean).map(line => {
      try {
        return JSON.parse(line);
      } catch (parseError) {
        console.error(`Error al parsear línea del log de ${errorContext}:`, parseError);
        return null; // Ignora líneas mal formadas
      }
    }).filter(Boolean); // Filtra los nulos
    res.json(items);
  });
}

// Endpoint para obtener el log de mensajes
app.get('/api/message-log', (req, res) => {
  sendJsonlLogResponse('message_log.jsonl', res, 'mensajes');
});

// Endpoint para obtener el log de pedidos
app.get('/api/orders', (req, res) => {
  sendJsonlLogResponse('order_log.jsonl', res, 'pedidos');
});

// Endpoint para obtener el log de encuestas
app.get('/api/surveys', (req, res) => {
  sendJsonlLogResponse('survey_log.jsonl', res, 'encuestas');
});


/**
 * Endpoint para enviar mensajes a un usuario de WhatsApp desde el dashboard.
 * Requiere 'to' (número de WhatsApp) y 'text' (contenido del mensaje) en el body.
 */
app.post('/api/send-message', async (req, res) => {
  const { to, text } = req.body;

  if (!to || !text) {
    return res.status(400).json({ error: "Faltan parámetros: 'to' y 'text' son requeridos." });
  }

  try {
    await sendTextMessage(to, text);
    res.json({ success: true, message: 'Mensaje enviado exitosamente.' });
  } catch (error) {
    console.error('Error al enviar mensaje desde el dashboard:', error);
    res.status(500).json({ error: 'Error al enviar el mensaje.' });
  }
});

// Endpoint para obtener todos los estados de Redis
app.get('/api/redis-states', async (req, res) => {
  try {
    // Obtener todas las claves de Redis. CUIDADO: KEYS * puede ser lento en bases de datos grandes.
    const keys = await redisClient.keys('*');
    const states = [];

    for (const key of keys) {
      // Excluir la clave de modo de mantenimiento y otras claves internas si es necesario
      if (key === MAINTENANCE_MODE_KEY) continue;
      
      const value = await redisClient.get(key);
      try {
        states.push({ key: key, state: JSON.parse(value) });
      } catch (parseError) {
        // Si no es JSON, lo devolvemos como texto plano
        states.push({ key: key, state: value });
      }
    }
    res.json(states);
  } catch (error) {
    console.error('Error al obtener estados de Redis:', error);
    res.status(500).json({ error: 'Error al obtener estados de Redis.' });
  }
});

// Endpoint para eliminar un estado de Redis por clave
app.delete('/api/redis-states/:key', async (req, res) => {
  const { key } = req.params;
  try {
    const result = await redisClient.del(key);
    if (result === 1) {
      res.json({ success: true, message: `Estado para la clave ${key} eliminado.` });
    } else {
      res.status(404).json({ error: `Clave ${key} no encontrada.` });
    }
  } catch (error) {
    console.error(`Error al eliminar estado para la clave ${key}:`, error);
    res.status(500).json({ error: 'Error al eliminar estado de Redis.' });
  }
});

// === SISTEMA DE MONITOREO ===

// Inicialización del sistema de monitoreo
async function initializeMonitoring() {
    try {
        console.log('🚀 Inicializando sistema de monitoreo...');

        // Inicializar MetricsCollector
        metricsCollector = new MetricsCollector(redisClient, {
            webhookUrl: N8N_WEBHOOK_URL,
            whatsappToken: WHATSAPP_TOKEN,
            phoneNumberId: PHONE_NUMBER_ID,
            whatsappApiVersion: WHATSAPP_API_VERSION,
            maintenanceModeKey: MAINTENANCE_MODE_KEY
        });

        // Inicializar HealthChecker
        healthChecker = new HealthChecker(metricsCollector, {
            checkInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
            cpuThreshold: parseInt(process.env.CPU_THRESHOLD) || 80,
            memoryThreshold: parseInt(process.env.MEMORY_THRESHOLD) || 85,
            responseTimeThreshold: parseInt(process.env.RESPONSE_TIME_THRESHOLD) || 5000,
            errorRateThreshold: parseFloat(process.env.ERROR_RATE_THRESHOLD) || 0.05,
            telegramToken: process.env.TELEGRAM_BOT_TOKEN,
            telegramChatId: process.env.TELEGRAM_CHAT_ID
        });

        // Inicializar WebSocket Server
        const wsPort = parseInt(process.env.WEBSOCKET_PORT) || 3001;
        wsServer = new MonitoringWebSocketServer(metricsCollector, healthChecker, wsPort);

        console.log('✅ Sistema de monitoreo inicializado exitosamente');

        // Programar tareas de mantenimiento
        scheduleMaintenanceTasks();

    } catch (error) {
        console.error('❌ Error inicializando sistema de monitoreo:', error);
    }
}

// Tareas de mantenimiento programadas
function scheduleMaintenanceTasks() {
    // Backup diario a las 3 AM
    cron.schedule(process.env.BACKUP_SCHEDULE || '0 3 * * *', async () => {
        try {
            console.log('🔄 Ejecutando backup diario...');
            await createSystemBackup();
        } catch (error) {
            console.error('❌ Error en backup diario:', error);
            if (metricsCollector) {
                metricsCollector.recordError('backup');
            }
        }
    });

    // Limpieza semanal los domingos a las 2 AM
    cron.schedule(process.env.CLEANUP_SCHEDULE || '0 2 * * 0', async () => {
        try {
            console.log('🧹 Ejecutando limpieza semanal...');
            await cleanupOldData();
        } catch (error) {
            console.error('❌ Error en limpieza:', error);
        }
    });
}

// Crear backup del sistema
async function createSystemBackup() {
    try {
        const backupData = {
            timestamp: new Date().toISOString(),
            version: require('./package.json').version,

            // Estados de usuarios activos
            userStates: await getAllUserStates(),

            // Configuración del bot
            configuration: {
                adminNumbers: ADMIN_WHATSAPP_NUMBERS.split(','),
                maintenanceMode: await redisClient.get(MAINTENANCE_MODE_KEY),
                phoneNumberId: PHONE_NUMBER_ID
            },

            // Métricas del sistema
            systemMetrics: metricsCollector ? await metricsCollector.getSystemMetrics() : null,

            // Estado de salud
            healthStatus: healthChecker ? await healthChecker.performHealthCheck() : null
        };

        // Guardar en Redis como backup
        await redisClient.setEx('system:backup:latest', 604800, JSON.stringify(backupData)); // 7 días

        console.log('✅ Backup del sistema creado exitosamente');
        return backupData;

    } catch (error) {
        console.error('❌ Error creando backup:', error);
        throw error;
    }
}

// Obtener todos los estados de usuario
async function getAllUserStates() {
    try {
        const keys = await redisClient.keys('*');
        const userStates = {};

        for (const key of keys) {
            if (key.match(/^\d+$/)) { // Solo claves que son números (estados de usuario)
                const state = await redisClient.get(key);
                if (state) {
                    userStates[key] = JSON.parse(state);
                }
            }
        }

        return userStates;
    } catch (error) {
        console.error('Error obteniendo estados de usuario:', error);
        return {};
    }
}

// Limpiar datos antiguos
async function cleanupOldData() {
    try {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const keys = await redisClient.keys('metrics:*');
        let cleanedCount = 0;

        for (const key of keys) {
            const ttl = await redisClient.ttl(key);
            if (ttl < 0) {
                const keyData = await redisClient.get(key);
                if (keyData) {
                    const data = JSON.parse(keyData);
                    if (data.timestamp && new Date(data.timestamp).getTime() < thirtyDaysAgo) {
                        await redisClient.del(key);
                        cleanedCount++;
                    }
                }
            }
        }

        console.log(`🧹 Limpieza completada: ${cleanedCount} métricas antiguas eliminadas`);

    } catch (error) {
        console.error('❌ Error en limpieza:', error);
    }
}

// === ENDPOINTS DE MONITOREO ===

// Endpoint para métricas
app.get('/api/metrics', async (req, res) => {
    try {
        if (!metricsCollector) {
            return res.status(503).json({ error: 'Sistema de monitoreo no disponible' });
        }
        const metrics = await metricsCollector.getSystemMetrics();
        res.json(metrics);
    } catch (error) {
        console.error('Error obteniendo métricas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para estado de salud
app.get('/api/health', async (req, res) => {
    try {
        if (!healthChecker) {
            return res.status(503).json({ error: 'Health checker no disponible' });
        }
        const health = await healthChecker.performHealthCheck();
        res.json(health);
    } catch (error) {
        console.error('Error obteniendo estado de salud:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para dashboard de monitoreo
app.get('/monitoring', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard', 'monitoring.html'));
});

// Endpoint para backup manual
app.post('/api/backup', async (req, res) => {
    try {
        const backup = await createSystemBackup();
        res.json({
            success: true,
            message: 'Backup creado exitosamente',
            timestamp: backup.timestamp
        });
    } catch (error) {
        console.error('Error creando backup:', error);
        res.status(500).json({ error: 'Error creando backup' });
    }
});

// Inicializar monitoreo cuando Redis esté listo
redisClient.on('ready', async () => {
    try {
        await initializeMonitoring();
        console.log('🎯 Sistema completo inicializado');
    } catch (error) {
        console.error('❌ Error en inicialización de monitoreo:', error);
    }
});

// Manejo de cierre limpio
process.on('SIGINT', async () => {
    console.log('\n🔄 Cerrando sistema...');

    try {
        if (metricsCollector) {
            await createSystemBackup();
        }

        if (wsServer) {
            wsServer.close();
        }

        console.log('✅ Sistema cerrado limpiamente');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error en cierre:', error);
        process.exit(1);
    }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});