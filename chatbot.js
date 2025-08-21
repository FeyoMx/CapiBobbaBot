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
    'Asegúrate de que VERIFY_TOKEN, WHATSAPP_TOKEN, PHONE_NUMBER_ID, GEMINI_API_KEY, ADMIN_WHATSAPP_NUMBERS, N8N_WEBHOOK_URL y REDIS_URL ' +
    'estén en tu archivo .env'
  );
  process.exit(1); // Detiene la aplicación si falta configuración
}

const app = express();
app.use(bodyParser.json());

// Servir la aplicación de React
app.use('/dashboard', express.static(path.join(__dirname, 'dashboard/build')));



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

// Endpoint para recibir mensajes de WhatsApp
app.post('/webhook', (req, res) => {
  const body = req.body;
  console.log('POST /webhook - Mensaje recibido:');
  console.log(JSON.stringify(body, null, 2));

  try {
    // Aseguramos que el objeto y la entrada existan
    if (body.object === 'whatsapp_business_account' && body.entry) {
      const change = body.entry[0]?.changes?.[0];
      if (change?.value) {
        if (change.value.messages) {
          // Es un mensaje nuevo de un usuario, lo procesamos para responder.
          const message = change.value.messages[0];
          processMessage(message); // La función ahora es async, pero no necesitamos esperar su finalización aquí.
        } else if (change.value.statuses) {
          // Es una actualización de estado (sent, delivered, read).
          // Por ahora, solo lo registramos en consola y no hacemos nada más.
          const status = change.value.statuses[0];
          console.log(`Estado del mensaje ${status.id} actualizado a: ${status.status}`);
        }
      }
    }

    // Responde a Meta para confirmar la recepción
    res.sendStatus(200);
  } catch (error) {
    console.error('Error al procesar el webhook:', error);
    // Informa a Meta que hubo un error en el servidor
    res.sendStatus(500);
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
  try {
    // Leemos el archivo en cada petición para obtener los datos más actuales
    const businessDataRaw = fs.readFileSync(path.join(__dirname, 'business_data.js'), 'utf8');
    // Extraemos el objeto 'businessData' del archivo. Esto es frágil y podría mejorarse.
    const match = businessDataRaw.match(/const businessData = (\{[\s\S]*?\});/);
    if (match && match[1]) {
      // Usamos eval de forma controlada para convertir el string del objeto en un objeto real.
      // ¡CUIDADO! Esto es generalmente inseguro, pero aquí lo usamos en nuestro propio código de confianza.
      // Una mejor solución sería exportar el objeto y usar require, pero eso cachea el módulo.
      const businessDataObject = eval('(' + match[1] + ')');
      res.json(businessDataObject);
    } else {
      res.status(500).json({ error: 'No se pudo parsear el archivo business_data.js' });
    }
  } catch (error) {
    console.error('Error al leer business_data.js:', error);
    res.status(500).json({ error: 'Error al leer los datos del negocio' });
  }
});

// Endpoint para actualizar los datos del negocio
app.post('/api/business-data', (req, res) => {
    const newBusinessData = req.body;

    // Convertimos el objeto JSON a un string con formato
    const dataAsString = `const businessData = ${JSON.stringify(newBusinessData, null, 4)};`;

    // Leemos el contenido actual del archivo
    fs.readFile(path.join(__dirname, 'business_data.js'), 'utf8', (err, data) => {
        if (err) {
            console.error('Error al leer business_data.js para actualizar:', err);
            return res.status(500).json({ error: 'No se pudo leer el archivo de datos.' });
        }

        // Reemplazamos solo el objeto businessData
        const updatedContent = data.replace(/const businessData = \{[\s\S]*?\};/, dataAsString);

        // Escribimos el contenido actualizado de vuelta al archivo
        fs.writeFile(path.join(__dirname, 'business_data.js'), updatedContent, 'utf8', async (err) => {
            if (err) {
                console.error('Error al escribir en business_data.js:', err);
                return res.status(500).json({ error: 'No se pudo guardar la configuración.' });
            }
            console.log('business_data.js actualizado correctamente.');
            await notifyAdmin('✅ La información del negocio (menú, promos, etc.) ha sido actualizada desde el dashboard.');
            res.json({ success: true });
        });
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

/**
 * Envía los detalles de un pedido completado a n8n.
 * @param {string} from El número del cliente.
 * @param {object} state El estado completo del usuario con los detalles del pedido.
 */
function sendOrderCompletionToN8n(from, state) {
    const totalMatch = state.orderText.match(/Total del pedido: \$(\d+\.\d{2})/i);
    const total = totalMatch ? parseFloat(totalMatch[1]) : null;

    const payload = {
        from: from,
        type: 'order_completed',
        timestamp: Math.floor(Date.now() / 1000),
        order: {
            summary: extractOrderItems(state.orderText),
            total: total,
            fullText: state.orderText
        },
        delivery: {
            address: state.address,
            accessCodeRequired: state.accessCodeInfo === 'access_code_yes'
        },
        payment: {
            method: state.paymentMethod,
            // Añade detalles específicos del pago
            ...(state.paymentMethod === 'Efectivo' && { cashDenomination: state.cashDenomination }),
            ...(state.paymentMethod === 'Transferencia' && { proofImageId: state.proofImageId })
        }
    };

    console.log('Enviando pedido completo a n8n:', JSON.stringify(payload, null, 2));

    axios.post(N8N_WEBHOOK_URL, payload)
        .then(response => console.log('Respuesta de n8n (pedido completo):', response.data))
        .catch(error => {
            console.error('Error enviando pedido completo a n8n:', error.message);
        });
}

/**
 * Registra la respuesta del bot en un webhook de n8n.
 * @param {string} to El número de WhatsApp del destinatario.
 * @param {object} payload El payload del mensaje que se envía.
 */
async function logBotResponseToN8n(to, payload) {
  // Construimos un payload específico para las respuestas del bot
  const n8nPayload = {
    recipient: to, // A quién se le envía
    source: 'bot', // Para identificar que el origen es el bot
    type: 'bot_response', // Un tipo de evento claro
    timestamp: Math.floor(Date.now() / 1000),
    messagePayload: payload, // El contenido real del mensaje
  };

  // Reutilizamos la lógica de envío y manejo de errores
  try {
    console.log('Registrando respuesta del bot en n8n:', JSON.stringify(n8nPayload, null, 2));
    // Usamos un timeout para no bloquear el bot si n8n no responde rápido
    await axios.post(N8N_WEBHOOK_URL, n8nPayload, { timeout: 5000 });
    console.log('Respuesta del bot registrada exitosamente en n8n.');
  } catch (error) {
    if (error.response) {
      console.error('Error registrando respuesta del bot en n8n (el servidor respondió con un error):', { status: error.response.status, data: error.response.data });
    } else if (error.request) {
      console.error('Error registrando respuesta del bot en n8n (sin respuesta): Asegúrate de que n8n esté corriendo y el webhook esté activo y sea de tipo POST.');
    } else if (error.code === 'ECONNABORTED') {
      console.error('Error registrando respuesta del bot en n8n: La petición tardó demasiado (timeout).');
    } else {
      console.error('Error registrando respuesta del bot en n8n (error de configuración de Axios):', error.message);
    }
  }
}

/**
 * Procesa el mensaje entrante y lo dirige al manejador correcto.
 * @param {object} message El objeto de mensaje de la API de WhatsApp.
 */
async function processMessage(message) {
  logMessageToFile({ type: 'incoming', message: message }); // Log incoming message
  sendToN8n(message); // Envía cada mensaje a n8n
  const from = message.from; // Número de teléfono del remitente
  
  // Los mensajes de administradores se manejan por separado y no se ven afectados por el modo de servicio.
  if (isAdmin(from)) {
    await handleAdminMessage(message);
    return; // Detenemos el procesamiento para que no se ejecute la lógica de cliente.
  }

  // Mostramos el indicador de "escribiendo..." para mejorar la experiencia del usuario.
  sendTypingOn(from);

  // AÑADIMOS UN PEQUEÑO RETRASO ARTIFICIAL
  // Esto da tiempo a que el indicador "escribiendo..." aparezca en el dispositivo del usuario,
  // especialmente para respuestas rápidas que de otro modo serían instantáneas.
  // Un valor entre 1000ms y 2000ms (1-2 segundos) suele ser efectivo.
  await sleep(1500);

  // Revisamos si el usuario está en medio de un flujo de conversación (pedido o chat con admin).
  const userState = await getUserState(from);
  const isMaintenanceMode = await redisClient.get(MAINTENANCE_MODE_KEY) === 'true';

  // NUEVO: Si el modo "fuera de servicio" está activo y el usuario está en medio de un pedido,
  // se le notifica y se cancela su estado para evitar que quede atascado.
  if (isMaintenanceMode && userState && userState.step && userState.step.startsWith('awaiting_')) {
    await sendTextMessage(from, 'Hola, te informamos que hemos suspendido temporalmente la toma de pedidos. Tu orden actual ha sido cancelada. ¡Disculpa las molestias!');
    await deleteUserState(from);
    return;
  }


  // NUEVO: Si el cliente está en modo chat con un admin, reenviamos su mensaje al admin.
  if (userState && userState.mode === 'in_conversation_with_admin') {
    const adminNumber = userState.admin;
    if (message.type === 'text') {
      await sendTextMessage(adminNumber, `💬 *Cliente* (${formatDisplayNumber(from)}):\n${message.text.body}`);
    } else {
      // Por ahora, solo notificamos al admin que se envió un mensaje que no es de texto.
      await sendTextMessage(adminNumber, `💬 *Cliente* (${formatDisplayNumber(from)}) ha enviado un mensaje que no es de texto (ej. imagen, audio). Por ahora no se puede reenviar.`);
    }
    return; // Detenemos el procesamiento normal.
  }

  if (userState) {
    if (userState.step === 'awaiting_address' && message.type === 'text') {
      await handleAddressResponse(from, message.text.body);
      return; // Detenemos el procesamiento para no interpretar la dirección como un comando.
    }
    if (userState.step === 'awaiting_access_code_info' && message.type === 'interactive' && message.interactive.type === 'button_reply') {
      await handleAccessCodeResponse(from, message.interactive.button_reply.id);
      return; // Detenemos el procesamiento.
    }
    if (userState.step === 'awaiting_payment_method' && message.type === 'interactive' && message.interactive.type === 'button_reply') {
      await handlePaymentMethodResponse(from, message.interactive.button_reply.id);
      return; // Detenemos el procesamiento.
    }
    if (userState.step === 'awaiting_cash_denomination' && message.type === 'text') {
      await handleCashDenominationResponse(from, message.text.body);
      return; // Detenemos el procesamiento.
    }
    if (userState.step === 'awaiting_payment_proof') {
      if (message.type === 'image') {
        await handlePaymentProofImage(from, message.image);
      } else {
        await sendTextMessage(from, 'Por favor, para confirmar tu pedido, envía únicamente la imagen de tu comprobante de pago.');
      }
      return; // Detenemos el procesamiento.
    }
  }

  if (message.type === 'text') {
    const messageBody = message.text.body; // Mantenemos el texto original para el pedido
    const lowerCaseMessage = messageBody.toLowerCase().trim();

    // --- MANEJO DE RESPUESTA DE ENCUESTA ---
    // Verificamos si el mensaje es un número único entre 0 y 5.
    const rating = parseInt(lowerCaseMessage, 10);
    // Esta condición asegura que el mensaje sea únicamente un número en el rango esperado.
    if (String(rating) === lowerCaseMessage && rating >= 0 && rating <= 5) {
        await handleSurveyResponse(from, rating);
        return; // Importante: detenemos el procesamiento aquí para no pasarlo a Gemini.
    }

    // Busca un manejador para el comando de texto
    const handler = findCommandHandler(lowerCaseMessage);
    if (handler) {
      // Pasamos el texto original del mensaje por si el manejador lo necesita (ej. para un pedido)
      await handler(from, messageBody);
    } else {
      // Si no es un comando conocido, se lo pasamos a Gemini
      await handleFreeformQuery(from, messageBody);
    }
  } else if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
    const buttonId = message.interactive.button_reply.id;
    // Busca un manejador para el ID del botón y lo llama. Si no lo encuentra, usa el manejador por defecto.
    const handler = buttonCommandHandlers[buttonId] || defaultHandler;
    await handler(from);
  }
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

            await sendTextMessage(from, `📞 Has iniciado un chat directo con ${formatDisplayNumber(targetUser)}. Todo lo que escribas ahora se le enviará directamente.\n\nPara terminar, escribe "terminar chat".`);
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

    if (lowerCaseMessage === 'hola admin') {
        await sendTextMessage(from, `🤖 Saludos, administrador. Estoy a tu disposición. Puedes usar "hablar con <numero>" para chatear con un cliente.`);
    }
    // Si no es un comando conocido, no hacemos nada para evitar spam.
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
    responseText = "Lamentamos mucho que tu experiencia no haya sido la mejor. Agradecemos tus comentarios y los tomaremos en cuenta para mejorar. Un agente podría contactarte para entender mejor qué pasó.";
    // Notificamos a un admin sobre la mala calificación para un seguimiento.
    notifyAdmin(`⚠️ ¡Alerta de Calificación Baja! ⚠️\n\nEl cliente ${formatDisplayNumber(from)} ha calificado el servicio con un: *${rating}*.\n\nSería bueno contactarlo para entender qué podemos mejorar.`);
  } else if (rating >= 4) {
    responseText = "¡Nos alegra mucho que hayas tenido una buena experiencia! Gracias por tu calificación. ¡Esperamos verte pronto! 🎉";
  } else { // Para calificaciones de 3
    responseText = "¡Muchas gracias por tus comentarios! Tu opinión es muy importante para nosotros y nos ayuda a mejorar. 😊";
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
    bodyText = '⚠️ *AVISO: En este momento no estamos tomando pedidos.*\n\n¡Hola! Soy CapiBot. Aunque no hay servicio de pedidos, puedo darte información sobre nuestro menú o promociones. ¿En qué te ayudo?';
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
    const guideText = '¡Genial! Para tomar tu pedido de la forma más rápida y sin errores, por favor, créalo en nuestro menú interactivo y cuando termines, copia y pega el resumen de tu orden aquí.\n\nAquí tienes el enlace: https://feyomx.github.io/menucapibobba/';
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
  const totalMatch = orderText.match(/Total del pedido:\s*(\$\d+(\.\d{1,2})?)/i);
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

  const totalMatch = orderText.match(/Total del pedido: \$(\d+\.\d{2})/i);
  const total = totalMatch ? totalMatch[1] : null;

  // Notificar a los administradores que se ha iniciado un nuevo pedido.
  const orderSummary = extractOrderItems(orderText);
  const initialAdminNotification = `🔔 ¡Nuevo pedido iniciado!\n\n*Cliente:* ${formatDisplayNumber(to)}\n\n*Pedido:*\n${orderSummary}\n\n*Total:* ${total ? '$' + total : 'No especificado'}\n\n*Nota:* Esperando dirección y método de pago.`;
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
  logBotResponseToN8n(to, payload);

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

// Inicia el servidor
/**
 * Registra un evento de mensaje (entrada o salida) en un archivo de log.
 * @param {object} logEntry El objeto a registrar (ej. { type: 'incoming', message: {...} } o { type: 'outgoing', to: '...', payload: {...} }).
 */
function logMessageToFile(logEntry) {
  const logFilePath = path.join(__dirname, 'message_log.jsonl');
  const timestampedEntry = { timestamp: new Date().toISOString(), ...logEntry };
  fs.appendFile(logFilePath, JSON.stringify(timestampedEntry) + '\n', (err) => {
    if (err) {
      console.error('Error al escribir en el archivo de log de mensajes:', err);
    }
  });
}

// Endpoint para obtener el log de mensajes
app.get('/api/message-log', (req, res) => {
  const logFilePath = path.join(__dirname, 'message_log.jsonl');
  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // El archivo no existe, devuelve un array vacío
        return res.json([]);
      }
      console.error('Error al leer el archivo de log de mensajes:', err);
      return res.status(500).json({ error: 'Error al leer el log de mensajes.' });
    }
    // Divide el contenido por líneas y parsea cada línea como JSON
    const messages = data.split('\n').filter(Boolean).map(line => {
      try {
        return JSON.parse(line);
      } catch (parseError) {
        console.error('Error al parsear línea del log de mensajes:', parseError);
        return null; // Ignora líneas mal formadas
      }
    }).filter(Boolean); // Filtra los nulos
    res.json(messages);
  });
});

// Inicia el servidor
/**
 * Registra un pedido completado en un archivo de log.
 * @param {object} orderData El objeto del pedido a registrar.
 */
function logOrderToFile(orderData) {
  const logFilePath = path.join(__dirname, 'order_log.jsonl');
  const timestampedOrder = { timestamp: new Date().toISOString(), ...orderData };
  fs.appendFile(logFilePath, JSON.stringify(timestampedOrder) + '\n', (err) => {
    if (err) {
      console.error('Error al escribir en el archivo de log de pedidos:', err);
    }
  });
}

// Endpoint para obtener el log de pedidos
app.get('/api/orders', (req, res) => {
  const logFilePath = path.join(__dirname, 'order_log.jsonl');
  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // El archivo no existe, devuelve un array vacío
        return res.json([]);
      }
      console.error('Error al leer el archivo de log de pedidos:', err);
      return res.status(500).json({ error: 'Error al leer el log de pedidos.' });
    }
    // Divide el contenido por líneas y parsea cada línea como JSON
    const orders = data.split('\n').filter(Boolean).map(line => {
      try {
        return JSON.parse(line);
      } catch (parseError) {
        console.error('Error al parsear línea del log de pedidos:', parseError);
        return null; // Ignora líneas mal formadas
      }
    }).filter(Boolean); // Filtra los nulos
    res.json(orders);
  });
});

/**
 * Endpoint para enviar mensajes a un usuario de WhatsApp desde el dashboard.
 * Requiere 'to' (número de WhatsApp) y 'text' (contenido del mensaje) en el body.
 */
/**
 * Registra un evento de mensaje (entrada o salida) en un archivo de log.
 * @param {object} logEntry El objeto a registrar (ej. { type: 'incoming', message: {...} } o { type: 'outgoing', to: '...', payload: {...} }).
 */
function logMessageToFile(logEntry) {
  const logFilePath = path.join(__dirname, 'message_log.jsonl');
  const timestampedEntry = { timestamp: new Date().toISOString(), ...logEntry };
  fs.appendFile(logFilePath, JSON.stringify(timestampedEntry) + '\n', (err) => {
    if (err) {
      console.error('Error al escribir en el archivo de log de mensajes:', err);
    }
  });
}

// Endpoint para obtener el log de mensajes
app.get('/api/message-log', (req, res) => {
  const logFilePath = path.join(__dirname, 'message_log.jsonl');
  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // El archivo no existe, devuelve un array vacío
        return res.json([]);
      }
      console.error('Error al leer el archivo de log de mensajes:', err);
      return res.status(500).json({ error: 'Error al leer el log de mensajes.' });
    }
    // Divide el contenido por líneas y parsea cada línea como JSON
    const messages = data.split('\n').filter(Boolean).map(line => {
      try {
        return JSON.parse(line);
      } catch (parseError) {
        console.error('Error al parsear línea del log de mensajes:', parseError);
        return null; // Ignora líneas mal formadas
      }
    }).filter(Boolean); // Filtra los nulos
    res.json(messages);
  });
});

// Inicia el servidor
/**
 * Registra un pedido completado en un archivo de log.
 * @param {object} orderData El objeto del pedido a registrar.
 */
function logOrderToFile(orderData) {
  const logFilePath = path.join(__dirname, 'order_log.jsonl');
  const timestampedOrder = { timestamp: new Date().toISOString(), ...orderData };
  fs.appendFile(logFilePath, JSON.stringify(timestampedOrder) + '\n', (err) => {
    if (err) {
      console.error('Error al escribir en el archivo de log de pedidos:', err);
    }
  });
}

// Endpoint para obtener el log de pedidos
app.get('/api/orders', (req, res) => {
  const logFilePath = path.join(__dirname, 'order_log.jsonl');
  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // El archivo no existe, devuelve un array vacío
        return res.json([]);
      }
      console.error('Error al leer el archivo de log de pedidos:', err);
      return res.status(500).json({ error: 'Error al leer el log de pedidos.' });
    }
    // Divide el contenido por líneas y parsea cada línea como JSON
    const orders = data.split('\n').filter(Boolean).map(line => {
      try {
        return JSON.parse(line);
      } catch (parseError) {
        console.error('Error al parsear línea del log de pedidos:', parseError);
        return null; // Ignora líneas mal formadas
      }
    }).filter(Boolean); // Filtra los nulos
    res.json(orders);
  });
});

/**
 * Registra una respuesta de encuesta en un archivo de log.
 * @param {object} surveyData El objeto de la encuesta a registrar.
 */
function logSurveyResponseToFile(surveyData) {
  const logFilePath = path.join(__dirname, 'survey_log.jsonl');
  const timestampedEntry = { timestamp: new Date().toISOString(), ...surveyData };
  fs.appendFile(logFilePath, JSON.stringify(timestampedEntry) + '\n', (err) => {
    if (err) {
      console.error('Error al escribir en el archivo de log de encuestas:', err);
    }
  });
}

// Endpoint para obtener el log de encuestas
app.get('/api/surveys', (req, res) => {
  const logFilePath = path.join(__dirname, 'survey_log.jsonl');
  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // El archivo no existe, devuelve un array vacío
        return res.json([]);
      }
      console.error('Error al leer el archivo de log de encuestas:', err);
      return res.status(500).json({ error: 'Error al leer el log de encuestas.' });
    }
    // Divide el contenido por líneas y parsea cada línea como JSON
    const surveys = data.split('\n').filter(Boolean).map(line => {
      try {
        return JSON.parse(line);
      } catch (parseError) {
        console.error('Error al parsear línea del log de encuestas:', parseError);
        return null; // Ignora líneas mal formadas
      }
    }).filter(Boolean); // Filtra los nulos
    res.json(surveys);
  });
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

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});


