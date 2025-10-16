// Enhanced Message Normalizer - VERSIÓN CORREGIDA CRÍTICA
// ✅ CORRIGE: Detección de mensajes interactivos directos (button_reply)
// ✅ AÑADE: Manejo específico para formato directo de botones

for (const item of items) {
  try {
    const rawBody = (item && item.json && (item.json.body || item.json)) || {};
    
    const normalizedBody = {
      from: null,
      messageType: 'unknown',
      text: null,
      isOrder: false,
      source: 'unknown',
      timestamp: Math.floor(Date.now() / 1000),
      hasText: false,
      hasMedia: false,
      hasLocation: false,
      isFromAdmin: false,
      isFromBot: false,
      isFromUser: false,
      rawMessage: rawBody,
      orderData: null
    };

    console.log('🔍 Processing message from:', JSON.stringify(rawBody, null, 2).substring(0, 500));

    try {
      // ✅ DETECTAR MENSAJES INTERACTIVOS - BUSCAR EN MÚLTIPLES UBICACIONES
      // Primero intentar en body.interactive, luego en body.rawMessage.interactive
      let interactivePayload = null;

      if (rawBody.interactive) {
        interactivePayload = rawBody.interactive;
        console.log('📍 Interactive encontrado en rawBody.interactive');
      } else if (rawBody.rawMessage && rawBody.rawMessage.interactive) {
        interactivePayload = rawBody.rawMessage.interactive;
        console.log('📍 Interactive encontrado en rawBody.rawMessage.interactive');
      }

      if (rawBody && rawBody.type === 'interactive' && interactivePayload) {
        console.log('🔘 Mensaje interactivo directo detectado');
        normalizedBody.source = 'whatsapp_user';
        normalizedBody.isFromUser = true;
        normalizedBody.from = String(rawBody.from || 'unknown_interactive');
        normalizedBody.timestamp = parseInt(rawBody.timestamp) || normalizedBody.timestamp;
        
        const interactive = interactivePayload;
        
        if (interactive.type === 'button_reply' && interactive.button_reply) {
          console.log('✅ Button reply detectado');
          normalizedBody.messageType = 'interactive_button_reply';
          const buttonReply = interactive.button_reply;

          // Extraer título del botón presionado
          if (buttonReply.title) {
            normalizedBody.text = String(buttonReply.title);
            normalizedBody.hasText = true;
            console.log('✅ Título de botón extraído:', normalizedBody.text);
          } else {
            normalizedBody.text = `Botón presionado (ID: ${buttonReply.id || 'unknown'})`;
            normalizedBody.hasText = true;
          }

          // Guardar ID del botón para referencia
          if (buttonReply.id) {
            normalizedBody.buttonId = String(buttonReply.id);
            console.log('✅ Button ID guardado:', normalizedBody.buttonId);
          }

          // ✅ NUEVO: Guardar objeto interactive completo para Format Telegram Message
          normalizedBody.interactive = {
            type: 'button_reply',
            id: buttonReply.id || null,
            title: buttonReply.title || null
          };
          console.log('✅ Objeto interactive guardado para Format Telegram Message');
        }
        else if (interactive.type === 'list_reply') {
          console.log('📝 List reply detectado');
          normalizedBody.messageType = 'interactive_list_reply';

          // ✅ Manejar DOS formatos diferentes de list_reply
          let listReply;

          if (interactive.list_reply) {
            // Formato estándar con objeto anidado
            console.log('📍 Formato estándar: interactive.list_reply encontrado');
            listReply = interactive.list_reply;
          } else if (interactive.id || interactive.title) {
            // Formato aplanado donde las propiedades están directamente en interactive
            console.log('📍 Formato aplanado: propiedades en interactive directo');
            listReply = {
              id: interactive.id,
              title: interactive.title,
              description: interactive.description
            };
          } else {
            console.log('⚠️ No se pudo extraer listReply de ningún formato');
            listReply = { id: 'unknown', title: 'Unknown', description: null };
          }

          let replyText = '';
          if (listReply.title) {
            replyText = String(listReply.title);
          }

          // Opcional: añadir descripción si existe
          if (listReply.description) {
            replyText += ` (${listReply.description})`;
          }

          if (replyText) {
            normalizedBody.text = replyText.trim();
            normalizedBody.hasText = true;
            console.log('✅ Texto de lista extraído:', normalizedBody.text);
          } else {
            normalizedBody.text = `Opción de lista seleccionada (ID: ${listReply.id || 'unknown'})`;
            normalizedBody.hasText = true;
          }

          if (listReply.id) {
            normalizedBody.listId = String(listReply.id);
            console.log('✅ List ID guardado:', normalizedBody.listId);
          }

          // ✅ Guardar objeto interactive completo para Format Telegram Message
          normalizedBody.interactive = {
            type: 'list_reply',
            id: listReply.id || null,
            title: listReply.title || null,
            description: listReply.description || null
          };
          console.log('✅ Objeto interactive guardado:', normalizedBody.interactive);
        }
        else {
          console.log('❓ Tipo interactivo desconocido o payload malformado:', interactive.type);
          normalizedBody.messageType = 'interactive_unknown';
          normalizedBody.text = `Mensaje interactivo de tipo: ${interactive.type}`;
          normalizedBody.hasText = true;
        }
      }
      
      // ✅ DETECTAR MENSAJES BOT_RESPONSE con messagePayload (CASO PRINCIPAL)
      else if (rawBody && rawBody.source === 'bot' && rawBody.messagePayload) {
        console.log('🤖 Bot response detectado con messagePayload');
        normalizedBody.source = 'bot';
        normalizedBody.isFromBot = true;
        normalizedBody.messageType = 'bot_response';
        normalizedBody.from = String(rawBody.recipient || 'unknown_bot');
        normalizedBody.timestamp = parseInt(rawBody.timestamp) || normalizedBody.timestamp;
        
        const payload = rawBody.messagePayload;
        console.log('📋 MessagePayload tipo:', payload.type);
        
        // MANEJAR CONTENIDO INTERACTIVO
        if (payload.type === 'interactive' && payload.interactive) {
          const interactive = payload.interactive;
          
          if (interactive.type === 'button') {
            console.log('🔘 Mensaje con botones detectado');
            normalizedBody.messageType = 'interactive_button';
            
            // Extraer texto de todas las partes del mensaje interactivo
            let fullText = '';
            
            // Header
            if (interactive.header && interactive.header.text) {
              fullText += interactive.header.text + '\n\n';
              console.log('📑 Header encontrado:', interactive.header.text);
            }
            
            // Body (contenido principal)
            if (interactive.body && interactive.body.text) {
              fullText += interactive.body.text + '\n\n';
              console.log('📝 Body encontrado:', interactive.body.text);
            }
            
            // Footer
            if (interactive.footer && interactive.footer.text) {
              fullText += interactive.footer.text + '\n\n';
              console.log('📄 Footer encontrado:', interactive.footer.text);
            }
            
            // Botones
            if (interactive.action && interactive.action.buttons) {
              fullText += 'Opciones disponibles:\n';
              interactive.action.buttons.forEach((button, index) => {
                if (button.reply && button.reply.title) {
                  fullText += `${index + 1}. ${button.reply.title}\n`;
                }
              });
              console.log('🔘 Botones encontrados:', interactive.action.buttons.length);
            }
            
            // ✅ CRÍTICO: Asignar el texto ANTES de trim() y verificar que no esté vacío
            const extractedText = fullText.trim();
            if (extractedText.length > 0) {
              normalizedBody.text = extractedText;
              normalizedBody.hasText = true;
              console.log('✅ Texto extraído del bot response (length:', extractedText.length, '):', normalizedBody.text.substring(0, 100) + '...');
            } else {
              console.log('⚠️ El texto extraído está vacío después de trim()');
              normalizedBody.text = 'Mensaje con botones (sin texto adicional)';
              normalizedBody.hasText = true;
            }
          }
          else if (interactive.type === 'list') {
            console.log('📝 Mensaje con lista detectado');
            normalizedBody.messageType = 'interactive_list';
            
            let fullText = '';
            
            if (interactive.header && interactive.header.text) {
              fullText += interactive.header.text + '\n\n';
            }
            
            if (interactive.body && interactive.body.text) {
              fullText += interactive.body.text + '\n\n';
            }
            
            if (interactive.footer && interactive.footer.text) {
              fullText += interactive.footer.text + '\n\n';
            }
            
            if (interactive.action && interactive.action.sections) {
              fullText += 'Opciones:\n';
              interactive.action.sections.forEach(section => {
                if (section.title) {
                  fullText += `\n${section.title}\n`;
                }
                if (section.rows) {
                  section.rows.forEach((row, index) => {
                    fullText += `${index + 1}. ${row.title}\n`;
                    if (row.description) {
                      fullText += `   ${row.description}\n`;
                    }
                  });
                }
              });
            }
            
            const extractedText = fullText.trim();
            if (extractedText.length > 0) {
              normalizedBody.text = extractedText;
              normalizedBody.hasText = true;
            } else {
              normalizedBody.text = 'Mensaje con lista (sin texto adicional)';
              normalizedBody.hasText = true;
            }
          }
        }
        // MANEJAR CONTENIDO DE TEXTO SIMPLE
        else if (payload.type === 'text' && payload.text) {
          console.log('💬 Mensaje de texto del bot detectado');
          normalizedBody.messageType = 'bot_text';
          normalizedBody.text = String(payload.text.body || payload.text);
          normalizedBody.hasText = true;
        }
        // MANEJAR OTROS TIPOS DE CONTENIDO
        else {
          console.log('❓ Tipo de payload no reconocido:', payload.type);
          normalizedBody.text = `Mensaje del bot de tipo: ${payload.type}`;
          normalizedBody.hasText = true;
        }
      }
      
      // ✅ DETECTAR IMAGEN/MEDIA DIRECTO DEL CHATBOT (caso específico)
      else if (rawBody && rawBody.type === 'image' && rawBody.rawMessage && rawBody.rawMessage.image) {
        console.log('🖼️ Imagen detectada del chatbot directo');
        normalizedBody.source = 'whatsapp_user';
        normalizedBody.isFromUser = true;
        normalizedBody.messageType = 'image';
        normalizedBody.hasMedia = true;
        normalizedBody.from = String(rawBody.from || 'unknown_image');
        normalizedBody.timestamp = parseInt(rawBody.timestamp) || normalizedBody.timestamp;
        
        // Guardar ID de la imagen
        if (rawBody.rawMessage.image.id) {
          normalizedBody.mediaId = String(rawBody.rawMessage.image.id);
          console.log('✅ Image ID saved:', normalizedBody.mediaId);
        }
        
        // Buscar caption en diferentes ubicaciones
        if (rawBody.rawMessage.image.caption) {
          normalizedBody.text = String(rawBody.rawMessage.image.caption);
          normalizedBody.hasText = true;
          console.log('✅ Image caption found:', normalizedBody.text.substring(0, 100));
        } else {
          normalizedBody.text = `Imagen enviada (ID: ${normalizedBody.mediaId || 'unknown'})`;
          normalizedBody.hasText = true;
          console.log('🖼️ No caption, using default text');
        }
      }
      
      // ✅ DETECTAR OTROS TIPOS DE MEDIA DIRECTO DEL CHATBOT
      else if (rawBody && (rawBody.type === 'video' || rawBody.type === 'audio' || rawBody.type === 'document') && rawBody.rawMessage) {
        console.log(`🎬 Media ${rawBody.type} detectado del chatbot directo`);
        normalizedBody.source = 'whatsapp_user';
        normalizedBody.isFromUser = true;
        normalizedBody.messageType = rawBody.type;
        normalizedBody.hasMedia = true;
        normalizedBody.from = String(rawBody.from || 'unknown_media');
        normalizedBody.timestamp = parseInt(rawBody.timestamp) || normalizedBody.timestamp;
        
        const mediaObj = rawBody.rawMessage[rawBody.type];
        if (mediaObj) {
          if (mediaObj.id) {
            normalizedBody.mediaId = String(mediaObj.id);
          }
          if (mediaObj.caption) {
            normalizedBody.text = String(mediaObj.caption);
            normalizedBody.hasText = true;
          } else {
            normalizedBody.text = `${rawBody.type.charAt(0).toUpperCase() + rawBody.type.slice(1)} enviado (ID: ${normalizedBody.mediaId || 'unknown'})`;
            normalizedBody.hasText = true;
          }
        }
      }
      
      // ✅ DETECTAR UBICACIÓN DIRECTA DEL CHATBOT (CASO CRÍTICO)
      else if (rawBody && rawBody.type === 'location' && rawBody.location) {
        console.log('📍 Ubicación detectada del chatbot directo');
        normalizedBody.source = 'whatsapp_user';
        normalizedBody.isFromUser = true;
        normalizedBody.messageType = 'location';
        normalizedBody.hasLocation = true;
        normalizedBody.from = String(rawBody.from || 'unknown_location');
        normalizedBody.timestamp = parseInt(rawBody.timestamp) || normalizedBody.timestamp;
        
        // Guardar coordenadas
        if (typeof rawBody.location.latitude !== 'undefined' && typeof rawBody.location.longitude !== 'undefined') {
          normalizedBody.location = {
            latitude: parseFloat(rawBody.location.latitude) || 0,
            longitude: parseFloat(rawBody.location.longitude) || 0
          };
          normalizedBody.text = `📍 Ubicación: ${normalizedBody.location.latitude}, ${normalizedBody.location.longitude}`;
          normalizedBody.hasText = true;
          console.log('✅ Location coordinates saved:', normalizedBody.location);
        }
      }
      
      // Detect bot messages - CASO ALTERNATIVO (mantener por compatibilidad)
      else if (rawBody && (rawBody.source === 'bot' || rawBody.isFromBot)) {
        normalizedBody.source = 'bot';
        normalizedBody.isFromBot = true;
        normalizedBody.messageType = 'bot_response';
        normalizedBody.from = String(rawBody.recipient || rawBody.from || 'unknown_bot');
        normalizedBody.timestamp = parseInt(rawBody.timestamp) || normalizedBody.timestamp;
        
        // Manejar mensajes de texto del bot
        if (rawBody.messagePayload && rawBody.messagePayload.text && rawBody.messagePayload.text.body) {
          normalizedBody.text = String(rawBody.messagePayload.text.body);
          normalizedBody.hasText = true;
        }
      }
      
      // ✅ DETECTAR ORDER_COMPLETED
      else if (rawBody && rawBody.type === 'order_completed') {
        console.log('🛒 Order completed detectado');
        normalizedBody.source = 'order_system';
        normalizedBody.messageType = 'order_completed';
        normalizedBody.isOrder = true;
        normalizedBody.from = String(rawBody.from || 'unknown_order');
        normalizedBody.timestamp = parseInt(rawBody.timestamp) || normalizedBody.timestamp;
        
        if (rawBody.order || rawBody.orderData) {
          const orderInfo = rawBody.order || rawBody.orderData;
          normalizedBody.orderData = {
            summary: String(orderInfo.summary || ''),
            total: parseFloat(orderInfo.total) || 0,
            fullText: String(orderInfo.fullText || ''),
            items: Array.isArray(orderInfo.items) ? orderInfo.items : [],
            isValidFormat: true
          };
          
          normalizedBody.text = String(orderInfo.fullText || orderInfo.summary || '');
          normalizedBody.hasText = normalizedBody.text.length > 0;
        }
      }
      
      // Detect WhatsApp webhook format (formato estándar de webhook)
      else if (rawBody && rawBody.entry && Array.isArray(rawBody.entry) && rawBody.entry[0] && rawBody.entry[0].changes && Array.isArray(rawBody.entry[0].changes)) {
        const change = rawBody.entry[0].changes[0];
        if (change && change.value && change.value.messages && Array.isArray(change.value.messages) && change.value.messages.length > 0) {
          const message = change.value.messages[0];
          
          normalizedBody.source = 'whatsapp_user';
          normalizedBody.isFromUser = true;
          normalizedBody.from = String(message.from || 'unknown_whatsapp');
          normalizedBody.timestamp = parseInt(message.timestamp) || normalizedBody.timestamp;
          
          const messageType = message.type || 'unknown';
          
          switch (messageType) {
            case 'text':
              normalizedBody.messageType = 'text';
              if (message.text && message.text.body) {
                normalizedBody.text = String(message.text.body);
                normalizedBody.hasText = true;
              }
              break;
              
            case 'interactive':
              normalizedBody.messageType = 'interactive';
              if (message.interactive) {
                let interactiveText = '';
                if (message.interactive.button_reply && message.interactive.button_reply.title) {
                  interactiveText = String(message.interactive.button_reply.title);
                } else if (message.interactive.list_reply && message.interactive.list_reply.title) {
                  interactiveText = String(message.interactive.list_reply.title);
                }
                if (interactiveText) {
                  normalizedBody.text = interactiveText;
                  normalizedBody.hasText = true;
                }
              }
              break;
              
            case 'image':
            case 'video':
            case 'audio':
            case 'document':
              normalizedBody.messageType = messageType;
              normalizedBody.hasMedia = true;
              if (message[messageType] && message[messageType].caption) {
                normalizedBody.text = String(message[messageType].caption);
                normalizedBody.hasText = true;
              }
              if (message[messageType] && message[messageType].id) {
                normalizedBody.mediaId = String(message[messageType].id);
              }
              break;
              
            case 'location':
              normalizedBody.messageType = 'location';
              normalizedBody.hasLocation = true;
              if (message.location && typeof message.location.latitude !== 'undefined' && typeof message.location.longitude !== 'undefined') {
                normalizedBody.location = {
                  latitude: parseFloat(message.location.latitude) || 0,
                  longitude: parseFloat(message.location.longitude) || 0
                };
                normalizedBody.text = `Location: ${normalizedBody.location.latitude}, ${normalizedBody.location.longitude}`;
                normalizedBody.hasText = true;
              }
              break;
              
            default:
              normalizedBody.messageType = 'unsupported';
              console.log('Unsupported WhatsApp message type:', messageType);
          }
        }
      }
      
      // Direct message format
      else if (rawBody && rawBody.from && rawBody.text) {
        normalizedBody.source = 'direct';
        normalizedBody.isFromUser = true;
        normalizedBody.from = String(rawBody.from);
        normalizedBody.text = String(rawBody.text);
        normalizedBody.hasText = true;
        normalizedBody.messageType = 'text';
      }
      
      // Unknown format
      else {
        console.log('⚠️ Formato desconocido, usando fallback');
        normalizedBody.source = 'unknown';
        normalizedBody.messageType = 'unknown_format';
        normalizedBody.from = String(rawBody.from || 'unknown_source');
        
        if (rawBody.text) {
          normalizedBody.text = String(rawBody.text);
          normalizedBody.hasText = true;
        } else if (rawBody.message) {
          normalizedBody.text = String(rawBody.message);
          normalizedBody.hasText = true;
        } else {
          // Último recurso: buscar cualquier texto en la estructura
          normalizedBody.text = 'Mensaje sin contenido de texto identificable';
          normalizedBody.hasText = true;
        }
      }

      // Check for admin
      const adminNumbers = ['5217712416450', '5217712794633'];
      normalizedBody.isFromAdmin = adminNumbers.includes(normalizedBody.from);

      // ✅ DETECCIÓN DE PEDIDOS CON PRODUCTOS REALES DE CAPIBOBBA
      if (!normalizedBody.isOrder && normalizedBody.text && typeof normalizedBody.text === 'string' && normalizedBody.text.length > 0) {
        const text = normalizedBody.text;
        
        const strictOrderPatterns = [
          /Total del pedido:\s*\$[\d,.]+/i,
          /Total a pagar:\s*\$[\d,.]+/i
        ];
        
        const isStrictOrder = strictOrderPatterns.some(pattern => {
          try {
            return pattern.test(text);
          } catch (e) {
            return false;
          }
        });
        
        if (isStrictOrder) {
          normalizedBody.isOrder = true;
          normalizedBody.messageType = 'confirmed_order';
          
          try {
            normalizedBody.orderData = safeExtractOrder(text);
            console.log('✅ Order detected:', normalizedBody.from, 'Total:', normalizedBody.orderData.total, 'Items:', normalizedBody.orderData.itemCount);
          } catch (extractError) {
            console.log('Order extraction error:', extractError.message);
            normalizedBody.orderData = {
              summary: text,
              total: 0,
              fullText: text,
              items: [text],
              itemCount: 1,
              estimatedPreparationTime: 5,
              isValidFormat: false
            };
          }
        } else {
          const inquiryKeywords = ['pedido', 'quiero', 'ordenar', 'comprar', 'menu'];
          const isInquiry = inquiryKeywords.some(keyword => {
            try {
              return text.toLowerCase().includes(keyword);
            } catch (e) {
              return false;
            }
          });
          
          // ✅ NO CLASIFICAR MENSAJES DEL BOT COMO CUSTOMER_INQUIRY
          if (isInquiry && !normalizedBody.isFromBot) {
            normalizedBody.messageType = 'customer_inquiry';
          }
        }
      }

    } catch (processingError) {
      console.error('Processing error:', processingError.message);
      normalizedBody.messageType = 'processing_error';
      normalizedBody.text = 'Error processing message content';
      normalizedBody.hasText = true;
    }

    // ✅ VALIDACIÓN FINAL CRÍTICA - Asegurar que siempre haya texto
    if (!normalizedBody.text || normalizedBody.text === '') {
      console.log('⚠️ ALERTA: normalizedBody.text está vacío, asignando texto por defecto');
      normalizedBody.text = `Mensaje de tipo ${normalizedBody.messageType}`;
      normalizedBody.hasText = true;
    }
    
    if (!normalizedBody.from) normalizedBody.from = 'unknown';
    if (!normalizedBody.orderData) normalizedBody.orderData = null;

    // ✅ CRÍTICO: Asignar al item, NO retornar directamente
    item.json.normalizedBody = normalizedBody;
    
    console.log('✅ Normalized:', {
      from: normalizedBody.from,
      type: normalizedBody.messageType,
      source: normalizedBody.source,
      isOrder: normalizedBody.isOrder,
      hasText: normalizedBody.hasText,
      hasMedia: normalizedBody.hasMedia,
      mediaId: normalizedBody.mediaId || 'none',
      textLength: normalizedBody.text ? normalizedBody.text.length : 0,
      textPreview: normalizedBody.text ? normalizedBody.text.substring(0, 50) + '...' : 'empty',
      orderTotal: normalizedBody.orderData ? normalizedBody.orderData.total : 'N/A',
      buttonId: normalizedBody.buttonId || 'none',
      listId: normalizedBody.listId || 'none'
    });
    
  } catch (criticalError) {
    console.error('❌ Critical error in normalizer:', criticalError.message);
    
    item.json.normalizedBody = {
      from: 'error_source',
      messageType: 'critical_error',
      text: 'Critical processing error occurred',
      isOrder: false,
      source: 'error',
      timestamp: Math.floor(Date.now() / 1000),
      hasText: true,
      hasMedia: false,
      hasLocation: false,
      isFromAdmin: false,
      isFromBot: false,
      isFromUser: false,
      rawMessage: {},
      orderData: null,
      error: criticalError.message
    };
  }
}

// ✅ CRÍTICO: SIEMPRE RETORNAR EL ARRAY DE ITEMS
return items;

// ✅ EXTRACCIÓN DE PEDIDOS MEJORADA CON PRODUCTOS REALES
function safeExtractOrder(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text for order extraction');
  }
  
  const orderData = {
    summary: '',
    total: 0,
    fullText: text,
    items: [],
    itemCount: 0,
    estimatedPreparationTime: 5,
    isValidFormat: true
  };
  
  try {
    // Extract total - CORREGIDO
    const totalPatterns = [
      /Total del pedido:\s*\$([0-9,.]+)/i,
      /Total a pagar:\s*\$([0-9,.]+)/i
    ];
    
    for (const pattern of totalPatterns) {
      try {
        const match = text.match(pattern);
        if (match && match[1]) {
          const cleanTotal = String(match[1]).replace(/,/g, '');
          const parsedTotal = parseFloat(cleanTotal);
          if (!isNaN(parsedTotal)) {
            orderData.total = parsedTotal;
            console.log('💰 Total extraído:', parsedTotal);
            break;
          }
        }
      } catch (e) {
        console.log('Error matching pattern:', e.message);
      }
    }
    
    // Extract items - CORREGIDO
    const lines = text.split('\n');
    const itemLines = [];
    
    for (const line of lines) {
      try {
        const trimmedLine = String(line).trim();
        if (trimmedLine.length > 0 && 
            !trimmedLine.toLowerCase().includes('total del pedido') && 
            !trimmedLine.toLowerCase().includes('total a pagar') &&
            !trimmedLine.toLowerCase().includes('gracias') &&
            !trimmedLine.toLowerCase().includes('confirmación')) {
          itemLines.push(trimmedLine);
        }
      } catch (e) {
        // Skip problematic lines
      }
    }
    
    orderData.summary = itemLines.join('\n');
    orderData.items = itemLines;
    
    // ✅ CONTEO INTELIGENTE CON PRODUCTOS REALES
    orderData.itemCount = countItemsInOrderWithRealProducts(orderData);
    orderData.estimatedPreparationTime = estimatePreparationTimeWithRealProducts(orderData);
    
    if (orderData.total > 0 && orderData.items.length > 0) {
      orderData.isValidFormat = true;
    }
    
  } catch (error) {
    console.log('Order extraction error:', error.message);
    orderData.isValidFormat = false;
    orderData.summary = text;
    orderData.items = [text];
    orderData.itemCount = 1;
    orderData.estimatedPreparationTime = 5;
  }
  
  return orderData;
}

// ✅ CONTEO INTELIGENTE CON PRODUCTOS REALES DE CAPIBOBBA
function countItemsInOrderWithRealProducts(orderData) {
  if (!orderData) return 0;
  
  console.log('🔢 Iniciando conteo inteligente con productos reales de CapiBobba');
  
  const text = orderData.fullText || orderData.summary || '';
  if (!text) return 0;
  
  console.log('📝 Texto a analizar:', text.substring(0, 200) + '...');
  
  // ✅ PRODUCTOS REALES DE CAPIBOBBA (extraídos de business_data.json)
  const realProducts = [
    // Sabores Base Agua Frappe
    'litchi', 'blueberry', 'guanábana', 'piña colada', 'fresa', 'sandia', 'mango', 
    'maracuya', 'tamarindo', 'cereza', 'banana',
    
    // Sabores Base Leche Frappe  
    'taro', 'chai', 'cookies&cream', 'pay de limon', 'crema irlandesa', 'mazapan', 
    'mocha', 'chocolate mexicano', 'matcha', 'algodon de azucar',
    
    // Especialidades
    'chamoyada', 'yogurtada', 'fresas con crema', 'pumpkin spice',
    
    // Términos generales
    'frappe', 'frappé', 'bubble tea', 'té', 'bebida caliente', 'caliente',
    
    // Toppings
    'perlas explosivas', 'tapioca', 'jelly', 'perlas cristal',
    'frutos rojos', 'manzana verde',
    
    // Variaciones y términos comunes
    'base agua', 'base leche', 'leche deslactosada', 'leche entera'
  ];
  
  // MÉTODO 1: Buscar patrones de cantidad explícita
  let totalItems = 0;
  
  // Patrón para "x [número]" o "[número] x"
  const quantityPatterns = [
    /x\s+(\d+)/gi,                    // "x 1", "x 2"
    /(\d+)\s+x/gi,                    // "1 x", "2 x"
    /(\d+)\.\s+\w+.*x\s+(\d+)/gi      // "1. Blueberry x 1"
  ];
  
  let foundQuantities = false;
  
  for (const pattern of quantityPatterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      console.log('🎯 Patrón de cantidad encontrado:', pattern.source, 'Matches:', matches.length);
      
      for (const match of matches) {
        let quantity = 0;
        
        if (pattern.source.includes('x\\s+(\\d+)')) {
          // "x 1" pattern
          quantity = parseInt(match[1]);
        } else if (pattern.source.includes('(\\d+)\\s+x')) {
          // "1 x" pattern
          quantity = parseInt(match[1]);
        } else if (match.length > 2) {
          // "1. Product x 1" pattern
          quantity = parseInt(match[2]);
        }
        
        if (!isNaN(quantity) && quantity > 0) {
          totalItems += quantity;
          console.log('✅ Cantidad encontrada:', quantity, 'en:', match[0]);
        }
      }
      foundQuantities = true;
      break;
    }
  }
  
  // MÉTODO 2: Contar líneas numeradas (1., 2., 3.)
  if (!foundQuantities || totalItems === 0) {
    console.log('🔄 Buscando líneas numeradas');
    
    const numberedLines = text.match(/^\d+\./gm);
    if (numberedLines && numberedLines.length > 0) {
      totalItems = numberedLines.length;
      console.log('📋 Líneas numeradas encontradas:', totalItems);
      foundQuantities = true;
    }
  }
  
  // MÉTODO 3: Contar líneas con $ (precios)
  if (!foundQuantities || totalItems === 0) {
  console.log('🔄 Contando líneas con precios');
    
    const lines = text.split('\n');
    let priceLines = 0;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.includes('$') && 
          !trimmedLine.toLowerCase().includes('total') &&
          !trimmedLine.toLowerCase().includes('gracias')) {
        priceLines++;
        console.log('💰 Línea con precio:', trimmedLine);
      }
    }
    
    if (priceLines > 0) {
      totalItems = priceLines;
      foundQuantities = true;
    }
  }
  
  // ✅ MÉTODO 4: DETECCIÓN DE PRODUCTOS REALES DE CAPIBOBBA
  if (!foundQuantities || totalItems === 0) {
    console.log('🧋 Usando detección de productos reales de CapiBobba');
    
    const lowerText = text.toLowerCase();
    const foundProducts = [];
    
    // Buscar cada producto real en el texto
    for (const product of realProducts) {
      const productLower = product.toLowerCase();
      if (lowerText.includes(productLower)) {
        foundProducts.push(product);
        console.log('🎯 Producto CapiBobba detectado:', product);
      }
    }
    
    // Remover duplicados (ej. si encuentra "frappe" y "frappé")
    const uniqueProducts = [...new Set(foundProducts)];
    
    if (uniqueProducts.length > 0) {
      totalItems = uniqueProducts.length;
      console.log('🧋 Productos únicos de CapiBobba detectados:', uniqueProducts);
    } else {
      // Si no encuentra productos específicos, buscar términos generales de bebidas
      const genericBeverageTerms = [
        'bebida', 'drink', 'té', 'tea', 'frappe', 'smoothie', 'bubble'
      ];
      
      const foundGeneric = genericBeverageTerms.filter(term => 
        lowerText.includes(term.toLowerCase())
      );
      
      if (foundGeneric.length > 0) {
        totalItems = 1; // Al menos una bebida
        console.log('🥤 Términos genéricos de bebida encontrados:', foundGeneric);
      } else {
        totalItems = 1; // Mínimo 1 para pedidos válidos
      }
    }
  }
  
  console.log('✅ Total de items calculado con productos reales:', totalItems);
  return Math.max(1, totalItems);
}

// ✅ ESTIMACIÓN DE TIEMPO CON PRODUCTOS REALES DE CAPIBOBBA
function estimatePreparationTimeWithRealProducts(orderData) {
  const itemCount = orderData.itemCount || 1;
  
  if (itemCount === 0) return 5;
  
  const text = (orderData.fullText || orderData.summary || '').toLowerCase();
  
  // ✅ TIEMPOS BASADOS EN PRODUCTOS REALES DE CAPIBOBBA
  let baseTime = 3; // Tiempo base por bebida
  let complexityMultiplier = 1;
  
  // Bebidas que requieren más tiempo de preparación
  if (text.includes('frappe') || text.includes('frappé')) {
    baseTime = 4; // Frappe requiere licuado
    console.log('⏱️ Frappe detectado, tiempo base: 4 min');
  }
  
  if (text.includes('bubble tea') || text.includes('té')) {
    baseTime = 5; // Bubble tea requiere preparación de té
    console.log('⏱️ Bubble tea detectado, tiempo base: 5 min');
  }
  
  // Especialidades que requieren más tiempo
  if (text.includes('chamoyada')) {
    baseTime = 6; // Chamoyada requiere preparación especial
    console.log('⏱️ Chamoyada detectada, tiempo base: 6 min');
  }
  
  if (text.includes('yogurtada')) {
    baseTime = 5; // Yogurtada requiere mezcla especial
    console.log('⏱️ Yogurtada detectada, tiempo base: 5 min');
  }
  
  if (text.includes('fresas con crema')) {
    baseTime = 7; // Fresas con crema requiere preparación de fresas
    console.log('⏱️ Fresas con crema detectadas, tiempo base: 7 min');
  }
  
  // Bebidas calientes son más rápidas
  if (text.includes('caliente')) {
    baseTime = 3; // Las bebidas calientes son más rápidas
    console.log('⏱️ Bebida caliente detectada, tiempo base: 3 min');
  }
  
  // Sabores que requieren preparación especial
  if (text.includes('matcha')) {
    complexityMultiplier = 1.2; // Matcha requiere mezcla especial
    console.log('⏱️ Matcha detectado, multiplicador: 1.2x');
  }
  
  if (text.includes('taro')) {
    complexityMultiplier = 1.1; // Taro requiere mezcla especial
    console.log('⏱️ Taro detectado, multiplicador: 1.1x');
  }
  
  // Toppings agregan tiempo
  let toppingsTime = 0;
  const toppings = [
    'perlas explosivas', 'tapioca', 'jelly', 'perlas cristal'
  ];
  
  toppings.forEach(topping => {
    if (text.includes(topping)) {
      toppingsTime += 1; // Cada topping agrega 1 minuto
      console.log('🧋 Topping detectado:', topping, '+1 min');
    }
  });
  
  // Base leche vs base agua
  if (text.includes('base leche') || text.includes('leche')) {
    complexityMultiplier *= 1.1; // Base leche requiere un poco más de tiempo
    console.log('🥛 Base leche detectada, multiplicador adicional: 1.1x');
  }
  
  // Cálculo final
  const estimatedTime = Math.max(
    5, // Mínimo 5 minutos
    Math.min(
      30, // Máximo 30 minutos
      Math.round((itemCount * baseTime * complexityMultiplier) + toppingsTime)
    )
  );
  
  console.log('⏱️ Tiempo estimado final:', {
    items: itemCount,
    baseTime: baseTime,
    complexityMultiplier: complexityMultiplier,
    toppingsTime: toppingsTime,
    totalTime: estimatedTime + ' minutos'
  });
  
  return estimatedTime;
}