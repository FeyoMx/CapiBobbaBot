// chatbot.js
require('dotenv').config(); // Carga las variables de entorno desde el archivo .env

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { BUSINESS_CONTEXT } = require('./business_data'); // Importa el contexto del negocio

// --- CONFIGURACIÓN ---
// Lee las variables de entorno de forma segura. ¡No dejes tokens en el código!
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ADMIN_WHATSAPP_NUMBERS = process.env.ADMIN_WHATSAPP_NUMBERS; // Plural
const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v18.0';

// Validamos que las variables de entorno críticas estén definidas
if (!VERIFY_TOKEN || !WHATSAPP_TOKEN || !PHONE_NUMBER_ID || !GEMINI_API_KEY || !ADMIN_WHATSAPP_NUMBERS) {
  console.error(
    'Error: Faltan variables de entorno críticas. ' +
    'Asegúrate de que VERIFY_TOKEN, WHATSAPP_TOKEN, PHONE_NUMBER_ID, GEMINI_API_KEY y ADMIN_WHATSAPP_NUMBERS ' +
    'estén en tu archivo .env (separados por coma si son varios)'
  );
  process.exit(1); // Detiene la aplicación si falta configuración
}

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

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
          processMessage(message);
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

// --- LÓGICA DEL BOT ---

// --- GESTIÓN DE ESTADO PERSISTENTE ---
// Esto guarda el estado de la conversación en un archivo para que no se pierda si el servidor se reinicia.
// En un entorno de producción en la nube, no se debe usar el sistema de archivos local porque es efímero.
// El estado se mantendrá en memoria. Si se necesita persistencia, se debe usar una base de datos como Redis o PostgreSQL.

let userStates = new Map();

function saveUserState() {
  // No hacemos nada aquí para evitar escribir en el sistema de archivos efímero.
  // En un futuro, aquí iría la lógica para guardar en una base de datos externa.
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
 * Procesa el mensaje entrante y lo dirige al manejador correcto.
 * @param {object} message El objeto de mensaje de la API de WhatsApp.
 */
function processMessage(message) {
  const from = message.from; // Número de teléfono del remitente

  // Primero, revisamos si el usuario está en medio de un flujo de conversación (como un pedido).
  const userState = userStates.get(from);
  if (userState) {
    if (userState.step === 'awaiting_address' && message.type === 'text') {
      handleAddressResponse(from, message.text.body);
      return; // Detenemos el procesamiento para no interpretar la dirección como un comando.
    }
    if (userState.step === 'awaiting_access_code_info' && message.type === 'interactive' && message.interactive.type === 'button_reply') {
      handleAccessCodeResponse(from, message.interactive.button_reply.id);
      return; // Detenemos el procesamiento.
    }
    if (userState.step === 'awaiting_payment_method' && message.type === 'interactive' && message.interactive.type === 'button_reply') {
      handlePaymentMethodResponse(from, message.interactive.button_reply.id);
      return; // Detenemos el procesamiento.
    }
    if (userState.step === 'awaiting_cash_denomination' && message.type === 'text') {
      handleCashDenominationResponse(from, message.text.body);
      return; // Detenemos el procesamiento.
    }
    if (userState.step === 'awaiting_payment_proof') {
      if (message.type === 'image') {
        handlePaymentProofImage(from, message.image);
      } else {
        sendTextMessage(from, 'Por favor, para confirmar tu pedido, envía únicamente la imagen de tu comprobante de pago.');
      }
      return; // Detenemos el procesamiento.
    }
  }

  if (message.type === 'text') {
    const messageBody = message.text.body; // Mantenemos el texto original para el pedido
    const lowerCaseMessage = messageBody.toLowerCase().trim();

    // Busca un manejador para el comando de texto
    const handler = textCommandHandlers[lowerCaseMessage] || findTextCommandHandler(lowerCaseMessage);
    if (handler) {
      // Pasamos el texto original del mensaje por si el manejador lo necesita (ej. para un pedido)
      handler(from, messageBody);
    } else {
      // Si no es un comando conocido, se lo pasamos a Gemini
      handleFreeformQuery(from, messageBody);
    }
  } else if (message.type === 'interactive' && message.interactive.type === 'button_reply') {
    const buttonId = message.interactive.button_reply.id;
    // Busca un manejador para el ID del botón y lo llama. Si no lo encuentra, usa el manejador por defecto.
    const handler = buttonCommandHandlers[buttonId] || defaultHandler;
    handler(from);
  }
}

// --- MANEJADORES DE COMANDOS ---

// Manejadores para comandos de texto exactos. Aquí "entrenas" al bot.
const textCommandHandlers = {
  // Los saludos ahora se manejan de forma más flexible en findTextCommandHandler
  'ayuda': sendMainMenu,
  'menu': handleShowMenu,
  'promociones': handleShowPromotions,
  'horario': handleShowHours,
  'ubicacion': handleShowLocation
};

// Manejadores para respuestas de botones.
const buttonCommandHandlers = {
  'ver_menu': handleShowMenu,
  'ver_promociones': handleShowPromotions,
  'contactar_agente': handleContactAgent
};

/**
 * Comprueba si un texto es un saludo común.
 * @param {string} text El texto a comprobar en minúsculas.
 * @returns {boolean}
 */
function isGreeting(text) {
  const greetings = ['hola', 'buenas', 'buenos dias', 'buen dia', 'hey', 'que tal'];
  return greetings.some(greeting => text.startsWith(greeting));
}

/**
 * Busca un manejador de comandos que coincida parcialmente (ej. "quiero ver el menu").
 * @param {string} text El texto del mensaje del usuario.
 * @returns {Function|null} La función manejadora o null si no se encuentra.
 */
function findTextCommandHandler(text) {
    // Damos prioridad a la detección de pedidos del menú web
    if (text.includes('total a pagar:') && text.includes('subtotal:')) {
        return handleNewOrderFromMenu;
    }

    // NUEVO: Detecta la intención de hacer un pedido, incluso si no está completo.
    const orderIntentKeywords = ['pedido', 'ordenar', 'quisiera pedir', 'me gustaría pedir', 'me gustaría hacer el siguiente pedido'];
    if (orderIntentKeywords.some(keyword => text.includes(keyword))) {
        return handleInitiateOrder;
    }

    // Damos prioridad a los saludos para mostrar el menú principal
    if (isGreeting(text)) {
      return sendMainMenu;
    }

    // Lógica para otros comandos
    if (text.includes('menu')) return handleShowMenu;
    if (text.includes('promo')) return handleShowPromotions;
    if (text.includes('hora') || text.includes('atienden')) return handleShowHours;
    if (text.includes('ubicacion') || text.includes('donde estan')) return handleShowLocation;
    // Si ninguna de las palabras clave coincide, no devolvemos nada para que lo maneje Gemini.
    return null;
}

// --- ACCIONES DEL BOT (Las respuestas de tu negocio) ---

/**
 * Envía el menú principal con botones.
 * @param {string} to Número del destinatario.
 */
function sendMainMenu(to, text) {
  // Notificamos al administrador que un cliente ha iniciado una conversación.
  // Esto ayuda al personal a estar atento a un posible pedido.
  notifyAdmin(`🔔 ¡Atención! El cliente ${formatDisplayNumber(to)} ha iniciado una conversación y está viendo el menú principal.`);

  const payload = {
    type: 'interactive',
    interactive: {
      type: 'button',
      header: { type: 'text', text: '🧋CapiBobba🧋' },
      body: {
        text: '¡Hola! Soy el asistente virtual de CapiBobba. ¿Cómo puedo ayudarte hoy?'
      },
      footer: {
        text: 'Selecciona una opción'
      },
      action: {
        buttons: [
          { type: 'reply', reply: { id: 'ver_menu', title: 'Ver Menú 📜' } },
          { type: 'reply', reply: { id: 'ver_promociones', title: 'Promociones ✨' } },
          { type: 'reply', reply: { id: 'contactar_agente', title: 'Hablar con alguien 🧑‍' } }
        ]
      }
    }
  };
  sendMessage(to, payload);
}

/**
 * Maneja la solicitud para ver el menú.
 * @param {string} to Número del destinatario.
 */
function handleShowMenu(to, text) {
  sendTextMessage(to, `¡Claro! Aquí está nuestro delicioso menú: https://menu-capibobba.web.app/`);
}

/**
 * Maneja la solicitud para ver las promociones.
 * @param {string} to Número del destinatario.
 */
function handleShowPromotions(to, text) {
  const promoText = `¡Nuestras promos de hoy! ✨\n\n- *Combo dia Lluvioso:* 2 bebidas calientes del mismo sabor x $110.\n- *Combo Amigos:* 2 Frappe base agua del mismo sabor por $130.`;
  sendTextMessage(to, promoText);
}

/**
 * Maneja la solicitud de horario.
 * @param {string} to Número del destinatario.
 */
function handleShowHours(to, text) {
  const hoursText = `Nuestro horario de atención es:\nLunes a Viernes: 6:00 PM - 10:00 PM\nSábados y Domingos: 12:00 PM - 10:00 PM`;
  sendTextMessage(to, hoursText);
}

/**
 * Maneja la solicitud de ubicación.
 * @param {string} to Número del destinatario.
 */
function handleShowLocation(to, text) {
  const locationText = `Tenemos servicio a domicilio GRATIS en los fraccionamientos aledaños a Viñedos!`;
  sendTextMessage(to, locationText);
}

/**
 * Maneja la solicitud para contactar a un agente.
 * @param {string} to Número del destinatario.
 */
function handleContactAgent(to, text) {
  sendTextMessage(to, 'Entendido. Un agente se pondrá en contacto contigo en breve.');
  notifyAdmin(`🔔 ¡Atención! El cliente ${formatDisplayNumber(to)} solicita hablar con un agente.`);
}

/**
 * Maneja la intención de iniciar un pedido.
 * Si el pedido ya está en el mensaje, lo procesa.
 * Si no, guía al usuario para que lo genere.
 * @param {string} to Número del destinatario.
 * @param {string} text El texto completo del mensaje del usuario.
 */
function handleInitiateOrder(to, text) {
  // Comprueba si el texto del mensaje ya contiene un pedido formateado.
  if (text.includes('total a pagar:') && text.includes('subtotal:')) {
    handleNewOrderFromMenu(to, text);
  } else {
    // Si solo es la intención, guía al usuario.
    const guideText = '¡Genial! Para tomar tu pedido de la forma más rápida y sin errores, por favor, créalo en nuestro menú interactivo y cuando termines, copia y pega el resumen de tu orden aquí.\n\nAquí tienes el enlace: https://menu-capibobba.web.app/';
    sendTextMessage(to, guideText);
  }
}
/**
 * Maneja la recepción de un nuevo pedido desde el menú web.
 * @param {string} to Número del destinatario.
 * @param {string} orderText El texto completo del pedido del cliente.
 */
async function handleNewOrderFromMenu(to, orderText) {
  const totalMatch = orderText.match(/Total a pagar: \$(\d+\.\d{2})/);
  const total = totalMatch ? totalMatch[1] : null;

  // Notificar a los administradores que se ha iniciado un nuevo pedido.
  const orderSummary = orderText.split('\n').slice(1, -2).join('\n'); // Extraer solo los items
  const initialAdminNotification = `🔔 ¡Nuevo pedido iniciado!\n\n*Cliente:* ${formatDisplayNumber(to)}\n\n*Pedido:*\n${orderSummary}\n\n*Total:* ${total ? '$' + total : 'No especificado'}\n\n*Nota:* Esperando dirección y método de pago.`;
  notifyAdmin(initialAdminNotification);

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
  userStates.set(to, { step: 'awaiting_address', orderText: orderText });
  saveUserState();
}

/**
 * Maneja la respuesta del usuario cuando se le pide la dirección.
 * @param {string} from El número del remitente.
 * @param {string} address El texto de la dirección proporcionada.
 */
async function handleAddressResponse(from, address) {
  console.log(`Dirección recibida de ${from}: ${address}`);

  // Mejora: Si el usuario vuelve a enviar el pedido en lugar de la dirección, se lo volvemos a pedir.
  if (address.includes('total a pagar:') && address.includes('subtotal:')) {
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
  const currentState = userStates.get(from) || {};
  userStates.set(from, { ...currentState, step: 'awaiting_access_code_info', address: address });
  saveUserState();
}

/**
 * Maneja la respuesta del usuario sobre el código de acceso.
 * @param {string} from El número del remitente.
 * @param {string} buttonId El ID del botón presionado ('access_code_yes' o 'access_code_no').
 */
async function handleAccessCodeResponse(from, buttonId) {
  const userState = userStates.get(from);
  
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
  userStates.set(from, { ...userState, step: 'awaiting_payment_method' });
  saveUserState();
}

/**
 * Maneja la respuesta del usuario sobre el método de pago.
 * @param {string} from El número del remitente.
 * @param {string} buttonId El ID del botón presionado ('payment_cash' o 'payment_transfer').
 */
async function handlePaymentMethodResponse(from, buttonId) {
  const userState = userStates.get(from);
  if (!userState) return; // Chequeo de seguridad

  if (buttonId === 'payment_transfer') {
    const bankDetails = `Para transferencias, puedes usar la siguiente cuenta:\n- Banco: MERCADO PAGO W\n- Número de Cuenta: 722969010305501833\n- A nombre de: Maria Elena Martinez Flores\n\nPor favor, envía tu comprobante de pago a este mismo chat para confirmar tu pedido.`;
    await sendTextMessage(from, bankDetails);
    await sendTextMessage(from, 'Por favor, envía una imagen de tu comprobante de pago a este mismo chat para confirmar tu pedido.');

    // Notificar al administrador
    const orderSummary = userState.orderText.split('\n').slice(1, -2).join('\n'); // Extraer solo los items
    const totalMatch = userState.orderText.match(/Total a pagar: (\$\d+\.\d{2})/);
    const total = totalMatch ? totalMatch[1] : 'N/A';
    const accessCodeMessage = userState.accessCodeInfo === 'access_code_yes'
        ? '⚠️ Se necesita código de acceso.'
        : '✅ No se necesita código de acceso.';
    const adminNotification = `⏳ Pedido por Transferencia en espera\n\n*Cliente:* ${formatDisplayNumber(from)}\n*Dirección:* ${userState.address}\n*Acceso:* ${accessCodeMessage}\n\n*Pedido:*\n${orderSummary}\n\n*Total:* ${total}\n\n*Nota:* Esperando comprobante de pago.`;
    notifyAdmin(adminNotification);

    // Actualizamos el estado para esperar la imagen del comprobante
    userStates.set(from, { ...userState, step: 'awaiting_payment_proof' });
    saveUserState();
  } else { // 'payment_cash'
    await sendTextMessage(from, 'Has elegido pagar en efectivo. ¿Con qué billete pagarás? (ej. $200, $500) para que podamos llevar tu cambio exacto.');
    const userState = userStates.get(from);
    userStates.set(from, { ...userState, step: 'awaiting_cash_denomination' });
    saveUserState();
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

  const userState = userStates.get(from);
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
  const orderSummary = userState.orderText.split('\n').slice(1, -2).join('\n');
  const totalMatch = userState.orderText.match(/Total a pagar: (\$\d+\.\d{2})/);
  const total = totalMatch ? totalMatch[1] : 'N/A';
  const accessCodeMessage = userState.accessCodeInfo === 'access_code_yes'
    ? '⚠️ Se necesita código de acceso.'
    : '✅ No se necesita código de acceso.';
  const adminNotification = `🎉 ¡Nuevo pedido en Efectivo!\n\n*Cliente:* ${formatDisplayNumber(from)}\n*Dirección:* ${address}\n*Acceso:* ${accessCodeMessage}\n\n*Pedido:*\n${orderSummary}\n\n*Total:* ${total}\n*Paga con:* ${denomination}`;
  notifyAdmin(adminNotification);

  console.log(`Pedido finalizado para ${from}. Dirección: ${address}. Pago: Efectivo (${sanitizedDenomination}).`);
  userStates.delete(from);
  saveUserState();
}

/**
 * Maneja la recepción de una imagen como comprobante de pago.
 * @param {string} from El número del remitente.
 * @param {object} imageObject El objeto de imagen del mensaje, que contiene el ID.
 */
async function handlePaymentProofImage(from, imageObject) {
  const userState = userStates.get(from);
  if (!userState) return;

  console.log(`Recibido comprobante de pago (imagen) de ${from}`);
  
  // 1. Agradecer al cliente y confirmar el pedido
  await sendTextMessage(from, '¡Gracias! Hemos recibido tu comprobante. Tu pedido ha sido confirmado y se preparará en breve. 🛵');

  // 2. Preparar la notificación para los administradores
  const orderSummary = userState.orderText.split('\n').slice(1, -2).join('\n');
  const totalMatch = userState.orderText.match(/Total a pagar: (\$\d+\.\d{2})/);
  const total = totalMatch ? totalMatch[1] : 'N/A';
  
  const accessCodeMessage = userState.accessCodeInfo === 'access_code_yes'
    ? '⚠️ Se necesita código de acceso.'
    : '✅ No se necesita código de acceso.';
  const adminCaption = `✅ Comprobante Recibido\n\n*Cliente:* ${formatDisplayNumber(from)}\n*Dirección:* ${userState.address}\n*Acceso:* ${accessCodeMessage}\n\n*Pedido:*\n${orderSummary}\n\n*Total:* ${total}`;

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

  console.log(`Pedido finalizado y comprobante reenviado para ${from}.`);
  
  // 5. Limpiar el estado del usuario
  userStates.delete(from);
  saveUserState();
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
function defaultHandler(to) {
  sendTextMessage(to, `No entendí tu mensaje. Escribe "hola" o "ayuda" para ver las opciones disponibles.`);
}

/**
 * Envía un mensaje de texto simple.
 * @param {string} to El número de teléfono del destinatario.
 * @param {string} text El texto a enviar.
 */
function sendTextMessage(to, text) {
  const payload = { type: 'text', text: { body: text } };
  sendMessage(to, payload);
}

/**
 * Envía una notificación a todos los números de WhatsApp de los administradores.
 * @param {string} text El mensaje de notificación.
 */
function notifyAdmin(text) {
  if (!ADMIN_WHATSAPP_NUMBERS) {
    console.log('No se han configurado números de administrador para notificaciones.');
    return;
  }

  // Separa la cadena de números en un array y elimina espacios en blanco
  const adminNumbers = ADMIN_WHATSAPP_NUMBERS.split(',').map(num => num.trim());

  console.log(`Enviando notificación a los administradores: ${adminNumbers.join(', ')}`);

  // Envía el mensaje a cada número del array
  for (const number of adminNumbers) {
    if (number) { // Asegura no procesar strings vacíos si hay comas extra
      sendTextMessage(number, text);
    }
  }
}

/**
 * Envía un mensaje a través de la API de WhatsApp.
 * @param {string} to El número de teléfono del destinatario.
 * @param {object} payload El objeto de mensaje a enviar (puede ser texto, interactivo, etc.).
 */
async function sendMessage(to, payload) {
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
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
