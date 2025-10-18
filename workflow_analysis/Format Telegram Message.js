console.log('🚀 Iniciando formateador de Telegram - VERSIÓN CORREGIDA');

// Función para escapar caracteres especiales de HTML
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

try {
  if (!items || items.length === 0) {
    // ✅ RETORNAR ARRAY, NO VALOR PRIMITIVO
    return [{
      json: { telegramMessage: 'Error: No hay datos para procesar' }
    }];
  }

  console.log(`📊 Procesando ${items.length} items`);
  const results = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`\n🔄 Procesando item ${i + 1}`);
    
    try {
      if (!item || !item.json) {
        console.error(`❌ Item ${i + 1}: Estructura inválida`);
        item.json = { telegramMessage: `Error: Item ${i + 1} inválido` };
        results.push(item);
        continue;
      }

      const data = item.json;
      
      // ✅ ACCEDER A DATOS DEL ENHANCED MESSAGE NORMALIZER
      let normalizedBody = null;
      
      if (data.normalizedBody) {
        normalizedBody = data.normalizedBody;
        console.log('📍 normalizedBody encontrado en data.normalizedBody');
      } else {
        console.log('🔍 normalizedBody no encontrado, buscando en referencias de nodos...');
        
        // Buscar en referencias del nodo Enhanced Message Normalizer
        try {
          const enhancedData = $('Enhanced Message Normalizer').first();
          if (enhancedData && enhancedData.json && enhancedData.json.normalizedBody) {
            normalizedBody = enhancedData.json.normalizedBody;
            console.log('📍 normalizedBody encontrado en Enhanced Message Normalizer');
          }
        } catch (nodeError) {
          console.log('⚠️ No se pudo acceder al nodo Enhanced Message Normalizer:', nodeError.message);
        }
      }
      
      if (!normalizedBody) {
        console.error('❌ No se encontró normalizedBody');
        item.json.telegramMessage = 'Error: No se pueden acceder a los datos normalizados';
        results.push(item);
        continue;
      }

      // ✅ EXTRAER DATOS CON MANEJO ESPECIAL PARA BOT_RESPONSE Y ENCUESTAS
      const fromNumber = normalizedBody.from || 'Desconocido';
      const messageType = normalizedBody.messageType || 'unknown';
      const messageText = normalizedBody.text || 'Sin contenido';
      const source = normalizedBody.source || 'unknown';
      const isOrder = normalizedBody.isOrder || false;
      const hasMedia = normalizedBody.hasMedia || false;
      const mediaId = normalizedBody.mediaId || null;
      const isFromBot = normalizedBody.isFromBot || false;

      // ✅ DETECTAR SI ES UNA RESPUESTA DE ENCUESTA
      const isSurveyResponse = messageType === 'interactive_list_reply' && normalizedBody.interactive?.id?.startsWith('rating_');
      let surveyRating = null;
      let surveyTitle = null;

      if (isSurveyResponse) {
        // Extraer la calificación del ID (ej: "rating_5" -> 5)
        const ratingMatch = normalizedBody.interactive?.id?.match(/rating_(\d+)/);
        if (ratingMatch) {
          surveyRating = parseInt(ratingMatch[1]);
        }
        surveyTitle = normalizedBody.interactive?.title || 'Sin título';
        console.log(`⭐ RESPUESTA DE ENCUESTA DETECTADA: Rating=${surveyRating}, Título="${surveyTitle}"`);
      }

      console.log(`📋 Datos extraídos: From=${fromNumber}, Type=${messageType}, Source=${source}, IsBot=${isFromBot}`);
      console.log(`📝 Contenido: ${messageText.substring(0, 100)}...`);
      
      // Datos de pedido si existen
      let total = 0;
      let items_count = 0;
      if (normalizedBody.orderData) {
        total = normalizedBody.orderData.total || 0;
        items_count = normalizedBody.orderData.itemCount || 0;
      }
      
      // Determinar prioridad
      let priority = 'normal';
      if (isOrder) priority = 'high';
      else if (normalizedBody.isFromAdmin) priority = 'medium';
      
      // Determinar calidad de extracción
      let quality = 'none';
      if (normalizedBody.orderData && normalizedBody.orderData.isValidFormat) {
        quality = 'excellent';
      } else if (isOrder) {
        quality = 'good';
      }
      
     // Función para obtener hora de México (UTC-6)
function getMexicoDateTime() {
  const now = new Date();
  // México está en UTC-6 (CST) 
  const mexicoTime = new Date(now.getTime() - (6 * 60 * 60 * 1000));
  return mexicoTime.toISOString().replace('T', ' ').substring(0, 19);
}

const fecha = getMexicoDateTime();
      
      // ✅ DETERMINAR ÍCONOS BASADOS EN TIPO Y FUENTE
      let sourceIcon = '📋';
      if (source === 'bot') sourceIcon = '🤖';
      else if (source === 'whatsapp_user') sourceIcon = '👤';
      else if (source === 'order_system') sourceIcon = '🛒';
      else if (source === 'direct') sourceIcon = '📱';

      let typeIcon = '❓';
      if (messageType === 'confirmed_order' || messageType === 'order_completed') typeIcon = '🛒';
      else if (messageType === 'bot_response') typeIcon = '🤖';
      else if (messageType === 'text') typeIcon = '💬';
      else if (messageType === 'button') typeIcon = '🔘📢'; // Botón de campaña
      else if (messageType === 'image' || messageType === 'bot_image') typeIcon = '🖼️';
      else if (messageType === 'video') typeIcon = '🎥';
      else if (messageType === 'audio') typeIcon = '🎵';
      else if (messageType === 'document') typeIcon = '📎';
      else if (messageType === 'interactive_button') typeIcon = '🔘';
      else if (messageType === 'interactive_list') typeIcon = '📝';
      else if (messageType === 'interactive_button_reply') typeIcon = '✅';
      else if (messageType === 'interactive_list_reply') typeIcon = '⭐';

      // ✅ CONSTRUIR MENSAJE CON HTML VÁLIDO
      let telegramMessage = '';
      
      try {
        // Encabezado con identificación de origen
        if (isFromBot) {
          telegramMessage += `<b>🤖 Respuesta del Bot Enviada</b>\n\n`;
        } else {
          telegramMessage += `<b>${sourceIcon} Mensaje Recibido</b>\n\n`;
        }
        
        // Información básica
        telegramMessage += `<b>📞 ${isFromBot ? 'Para' : 'De'}:</b> <code>${escapeHtml(String(fromNumber))}</code>\n`;
        telegramMessage += `<b>${typeIcon} Tipo:</b> <code>${escapeHtml(messageType)}</code>\n`;
        
        // ✅ MOSTRAR INFORMACIÓN DE MEDIA SI EXISTE
        if (hasMedia) {
          telegramMessage += `<b>📎 Media:</b> ✅ Sí`;
          if (mediaId) {
            telegramMessage += ` (ID: <code>${escapeHtml(String(mediaId))}</code>)`;
          }
          telegramMessage += `\n`;
        }
        
        // ✅ Si es BOTÓN DE CAMPAÑA, agregar información especial
        if (messageType === 'button') {
          telegramMessage += `\n<b>🔘📢 RESPUESTA DE CAMPAÑA DE MARKETING</b>\n`;

          // Mostrar payload si existe
          if (normalizedBody.buttonPayload) {
            telegramMessage += `<b>🎯 Acción:</b> ${escapeHtml(String(normalizedBody.buttonPayload))}\n`;
          }

          // Indicar que es una respuesta a campaña
          telegramMessage += `<b>📊 Origen:</b> Botón de campaña WhatsApp\n`;
          telegramMessage += `<b>🎯 Estado:</b> Cliente interesado\n`;
        }

        // ✅ Si es ENCUESTA, agregar información especial con alta prioridad
        else if (isSurveyResponse && surveyRating !== null) {
          telegramMessage += `\n<b>⭐⭐⭐ RESPUESTA DE ENCUESTA ⭐⭐⭐</b>\n`;

          // Generar estrellas visuales
          const stars = '⭐'.repeat(surveyRating);
          telegramMessage += `<b>📊 Calificación:</b> ${stars} (${surveyRating}/5)\n`;
          telegramMessage += `<b>🏷️ Selección:</b> ${escapeHtml(surveyTitle)}\n`;

          // Indicador de satisfacción
          let satisfactionLevel = '';
          let satisfactionIcon = '';
          if (surveyRating <= 2) {
            satisfactionLevel = 'BAJA - Requiere atención';
            satisfactionIcon = '🔴';
          } else if (surveyRating === 3) {
            satisfactionLevel = 'Media - Mejorable';
            satisfactionIcon = '🟡';
          } else {
            satisfactionLevel = 'Alta - Excelente';
            satisfactionIcon = '🟢';
          }
          telegramMessage += `<b>${satisfactionIcon} Nivel:</b> ${satisfactionLevel}\n`;
        }

        // ✅ Si es pedido, agregar información especial
        else if (isOrder) {
          telegramMessage += `\n<b>🛒 PEDIDO DETECTADO</b>\n`;
          telegramMessage += `<b>💰 Total:</b> ${total}\n`;

          if (items_count > 0) {
            telegramMessage += `<b>📦 Items:</b> ${items_count}\n`;
          }

          if (quality && quality !== 'unknown' && quality !== 'none') {
            let qualityIcon = '🟢';
            if (quality === 'good') qualityIcon = '🟡';
            else if (quality === 'partial') qualityIcon = '🟠';
            telegramMessage += `<b>📊 Calidad:</b> ${qualityIcon} ${quality}\n`;
          }

          if (priority && priority !== 'normal') {
            let priorityIcon = '🔴';
            if (priority === 'medium') priorityIcon = '🟡';
            else if (priority === 'low') priorityIcon = '🟢';
            telegramMessage += `<b>⚡ Prioridad:</b> ${priorityIcon} ${priority}\n`;
          }
        }
        
        // ✅ CONTENIDO DEL MENSAJE CON MANEJO ESPECIAL PARA BOT_RESPONSE
        telegramMessage += `\n<b>📄 Contenido:</b>\n`;
        
        if (messageText && messageText !== 'Sin contenido' && messageText !== '[Sin texto]' && messageText.trim().length > 0) {
          const escapedContent = escapeHtml(String(messageText));
          
          // Si el contenido es muy largo, truncar
          if (escapedContent.length > 2000) {
            telegramMessage += escapedContent.substring(0, 2000) + '...\n<i>(Mensaje truncado)</i>';
          } else {
            telegramMessage += escapedContent;
          }
        } else if (hasMedia) {
          telegramMessage += `<i>📎 Archivo multimedia ${mediaId ? `(ID: ${mediaId})` : ''}</i>`;
        } else {
          telegramMessage += '<i>Sin contenido de texto</i>';
        }
        
        // ✅ AGREGAR TIMESTAMP
        if (fecha) {
          telegramMessage += `\n\n<b>🕒 Fecha:</b> ${escapeHtml(String(fecha))}`;
        }
        
        // ✅ AGREGAR INFORMACIÓN ADICIONAL PARA BOT_RESPONSE
        if (isFromBot) {
          telegramMessage += `\n\n<i>ℹ️ Este mensaje fue enviado por el bot a un cliente</i>`;
        }
        
        console.log(`✅ Mensaje HTML creado (${telegramMessage.length} chars)`);
        
        // ✅ VALIDAR LONGITUD TOTAL
        if (telegramMessage.length > 4096) {
          console.log(`⚠️ Mensaje muy largo (${telegramMessage.length}), truncando...`);
          telegramMessage = telegramMessage.substring(0, 4090) + '...\n\n<b>⚠️ Mensaje truncado</b>';
        }
        
        // ✅ VERIFICAR QUE LAS ETIQUETAS ESTÉN BALANCEADAS
        const openTags = (telegramMessage.match(/<b>/g) || []).length;
        const closeTags = (telegramMessage.match(/<\/b>/g) || []).length;
        const openCodes = (telegramMessage.match(/<code>/g) || []).length;
        const closeCodes = (telegramMessage.match(/<\/code>/g) || []).length;
        const openItalics = (telegramMessage.match(/<i>/g) || []).length;
        const closeItalics = (telegramMessage.match(/<\/i>/g) || []).length;
        
        console.log(`🔍 Etiquetas: <b> ${openTags}/${closeTags}, <code> ${openCodes}/${closeCodes}, <i> ${openItalics}/${closeItalics}`);
        
        // ✅ CORREGIR ETIQUETAS DESBALANCEADAS
        if (openTags !== closeTags) {
          const missing = openTags - closeTags;
          for (let j = 0; j < missing; j++) {
            telegramMessage += '</b>';
          }
        }
        
        if (openCodes !== closeCodes) {
          const missing = openCodes - closeCodes;
          for (let j = 0; j < missing; j++) {
            telegramMessage += '</code>';
          }
        }
        
        if (openItalics !== closeItalics) {
          const missing = openItalics - closeItalics;
          for (let j = 0; j < missing; j++) {
            telegramMessage += '</i>';
          }
        }
        
        console.log(`📤 Mensaje final validado (${telegramMessage.length} chars)`);
        console.log(`📋 Preview: ${telegramMessage.substring(0, 150)}...`);
        
      } catch (htmlError) {
        console.error(`❌ Error construyendo HTML: ${htmlError.message}`);
        // Fallback a texto plano
        telegramMessage = `${sourceIcon} MENSAJE ${isFromBot ? 'ENVIADO POR BOT' : 'RECIBIDO'}\n\n`;
        telegramMessage += `${isFromBot ? 'Para' : 'De'}: ${fromNumber}\n`;
        telegramMessage += `Tipo: ${messageType}\n`;
        if (hasMedia) {
          telegramMessage += `📎 Media: Sí\n`;
        }
        if (isOrder) {
          telegramMessage += `🛒 PEDIDO - Total: ${total}\n`;
        }
        telegramMessage += `\nContenido:\n${messageText}`;
        if (fecha) {
          telegramMessage += `\n\nFecha: ${fecha}`;
        }
      }

      item.json.telegramMessage = telegramMessage;
      results.push(item);
      console.log(`✅ Item ${i + 1} procesado exitosamente`);

    } catch (itemError) {
      console.error(`❌ Error procesando item ${i + 1}: ${itemError.message}`);
      item.json.telegramMessage = `Error procesando mensaje: ${itemError.message}`;
      results.push(item);
    }
  }

  console.log(`🎯 Procesamiento completado: ${results.length} items procesados`);
  // ✅ RETORNAR ARRAY DE RESULTS, NO VALOR PRIMITIVO
  return results;

} catch (criticalError) {
  console.error('💥 Error crítico:', criticalError.message);
  // ✅ RETORNAR ARRAY, NO VALOR PRIMITIVO
  return [{
    json: { telegramMessage: `Error crítico en formateador: ${criticalError.message}` }
  }];
}