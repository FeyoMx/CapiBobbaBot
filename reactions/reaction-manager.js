/**
 * Sistema de Reacciones Inteligente para WhatsApp
 * Gestiona reacciones contextuales, progresivas y basadas en métricas
 */

const axios = require('axios');

// Configuración de emojis por contexto
const REACTION_EMOJIS = {
  // Flujo de pedidos
  ORDER_RECEIVED: '⏳',
  ORDER_CONFIRMED: '🛒',
  ORDER_COMPLETED: '✅',
  ORDER_ERROR: '❌',
  ORDER_UPDATED: '🔄',

  // Flujo de entrega
  ADDRESS_CONFIRMED: '🚚',
  LOCATION_RECEIVED: '📍',
  ACCESS_CODE_SAVED: '🏠',

  // Flujo de pago
  PAYMENT_RECEIVED: '💰',
  PAYMENT_PROOF: '📸',
  CASH_CONFIRMED: '💵',
  PAYMENT_VALIDATED: '✔️',
  PAYMENT_REJECTED: '❌',

  // Estados generales
  PROCESSING: '⏳',
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  CELEBRATION: '🎉',

  // Tipos de consulta
  MENU_INQUIRY: '📋',
  PRICE_INQUIRY: '💲',
  HOURS_INQUIRY: '⏱️',
  DELIVERY_INQUIRY: '🚗',
  PROMO_INQUIRY: '🎁',
  GREETING: '👋',
  FAREWELL: '🤝',

  // Métricas de usuario
  FREQUENT_CLIENT: '🔥',
  FIRST_ORDER: '🌟',
  LARGE_ORDER: '🎯',
  VIP_CLIENT: '💎',

  // Administración
  ADMIN_NOTIFICATION: '🔔',
  SECURITY_ALERT: '🚨',
  REPORT: '📊',
  ADMIN_COMMAND: '🛠️',

  // Validación/Seguridad
  VALID_INPUT: '✅',
  SUSPICIOUS_INPUT: '⚠️',
  RATE_LIMITED: '🚫',
  VERIFIED: '🔐',

  // Otros
  DOCUMENT: '📄',
  SAVE: '📝',
  REMINDER: '⏰'
};

// Mapeo de estados a reacciones
const STATE_REACTIONS = {
  'awaiting_address': REACTION_EMOJIS.ORDER_CONFIRMED,
  'awaiting_location_confirmation': REACTION_EMOJIS.ADDRESS_CONFIRMED,
  'awaiting_access_code_info': REACTION_EMOJIS.LOCATION_RECEIVED,
  'awaiting_payment_method': REACTION_EMOJIS.ACCESS_CODE_SAVED,
  'awaiting_cash_denomination': REACTION_EMOJIS.PAYMENT_RECEIVED,
  'awaiting_payment_proof': REACTION_EMOJIS.PAYMENT_RECEIVED,
  'order_complete': REACTION_EMOJIS.CELEBRATION
};

// Patrones de detección de intención
const INTENTION_PATTERNS = {
  menu: {
    keywords: ['menú', 'menu', 'carta', 'productos', 'qué tienen', 'que tienen', 'opciones'],
    emoji: REACTION_EMOJIS.MENU_INQUIRY
  },
  price: {
    keywords: ['precio', 'costo', 'cuánto', 'cuanto', 'valor', 'cuánto cuesta'],
    emoji: REACTION_EMOJIS.PRICE_INQUIRY
  },
  hours: {
    keywords: ['horario', 'hora', 'abierto', 'cerrado', 'atienden', 'abren', 'cierran'],
    emoji: REACTION_EMOJIS.HOURS_INQUIRY
  },
  delivery: {
    keywords: ['envío', 'envio', 'entrega', 'delivery', 'domicilio', 'llega'],
    emoji: REACTION_EMOJIS.DELIVERY_INQUIRY
  },
  promo: {
    keywords: ['promoción', 'promocion', 'oferta', 'descuento', 'especial', 'promo'],
    emoji: REACTION_EMOJIS.PROMO_INQUIRY
  },
  greeting: {
    keywords: ['hola', 'buenas', 'buenos días', 'buenas tardes', 'buenas noches', 'hey', 'holi'],
    emoji: REACTION_EMOJIS.GREETING
  },
  farewell: {
    keywords: ['adiós', 'adios', 'hasta luego', 'bye', 'chao', 'nos vemos', 'gracias'],
    emoji: REACTION_EMOJIS.FAREWELL
  }
};

class ReactionManager {
  constructor(whatsappToken, phoneNumberId, apiVersion = 'v18.0') {
    this.whatsappToken = whatsappToken;
    this.phoneNumberId = phoneNumberId;
    this.apiVersion = apiVersion;
    this.reactionHistory = new Map(); // Para tracking de reacciones previas
  }

  /**
   * Envía una reacción a un mensaje
   * @param {string} to - Número de teléfono del destinatario
   * @param {string} messageId - ID del mensaje a reaccionar
   * @param {string} emoji - Emoji a usar (o '' para quitar reacción)
   * @returns {Promise<boolean>}
   */
  async sendReaction(to, messageId, emoji) {
    if (!messageId) {
      console.warn('⚠️ No se puede enviar reacción: messageId no proporcionado');
      return false;
    }

    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
    const data = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'reaction',
      reaction: {
        message_id: messageId,
        emoji: emoji || '', // emoji vacío quita la reacción
      },
    };
    const headers = {
      'Authorization': `Bearer ${this.whatsappToken}`,
      'Content-Type': 'application/json',
    };

    try {
      await axios.post(url, data, { headers, timeout: 5000 });
      const action = emoji ? `enviada: ${emoji}` : 'removida';
      console.log(`✓ Reacción ${action} a mensaje ${messageId}`);

      // Guardar en historial
      this.reactionHistory.set(messageId, { to, emoji, timestamp: Date.now() });

      return true;
    } catch (error) {
      const errorDetails = error.response?.data
        ? JSON.stringify(error.response.data)
        : error.message || 'Error desconocido';
      console.error(`❌ Error al enviar reacción a ${messageId}:`, errorDetails);

      // Log adicional para debugging
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Headers:`, JSON.stringify(error.response.headers));
      } else if (error.request) {
        console.error(`   No se recibió respuesta del servidor`);
      } else {
        console.error(`   Error de configuración:`, error.message);
      }

      return false;
    }
  }

  /**
   * Quita una reacción previamente enviada
   * @param {string} to - Número de teléfono
   * @param {string} messageId - ID del mensaje
   * @returns {Promise<boolean>}
   */
  async removeReaction(to, messageId) {
    return await this.sendReaction(to, messageId, '');
  }

  /**
   * Reacción contextual según el estado del flujo
   * @param {string} to - Número de teléfono
   * @param {string} messageId - ID del mensaje
   * @param {string} state - Estado actual del flujo
   * @returns {Promise<boolean>}
   */
  async reactToState(to, messageId, state) {
    const emoji = STATE_REACTIONS[state];
    if (!emoji) {
      console.log(`ℹ️ No hay reacción definida para el estado: ${state}`);
      return false;
    }
    return await this.sendReaction(to, messageId, emoji);
  }

  /**
   * Reacción basada en la intención detectada en el mensaje
   * @param {string} to - Número de teléfono
   * @param {string} messageId - ID del mensaje
   * @param {string} messageText - Texto del mensaje
   * @returns {Promise<boolean>}
   */
  async reactToIntention(to, messageId, messageText) {
    if (!messageText) return false;

    const textLower = messageText.toLowerCase();

    // Buscar coincidencia de intención
    for (const [intentionName, intention] of Object.entries(INTENTION_PATTERNS)) {
      for (const keyword of intention.keywords) {
        if (textLower.includes(keyword)) {
          console.log(`🎯 Intención detectada: ${intentionName}`);
          return await this.sendReaction(to, messageId, intention.emoji);
        }
      }
    }

    return false;
  }

  /**
   * Reacción progresiva - cambia la reacción según el progreso
   * @param {string} to - Número de teléfono
   * @param {string} messageId - ID del mensaje
   * @param {string} previousEmoji - Emoji previo (opcional, para logging)
   * @param {string} newEmoji - Nuevo emoji
   * @returns {Promise<boolean>}
   */
  async updateReaction(to, messageId, newEmoji, previousEmoji = null) {
    if (previousEmoji) {
      console.log(`🔄 Actualizando reacción: ${previousEmoji} → ${newEmoji}`);
    }
    return await this.sendReaction(to, messageId, newEmoji);
  }

  /**
   * Reacción basada en métricas del usuario
   * @param {string} to - Número de teléfono
   * @param {string} messageId - ID del mensaje
   * @param {Object} userMetrics - Métricas del usuario
   * @returns {Promise<boolean>}
   */
  async reactToMetrics(to, messageId, userMetrics) {
    if (!userMetrics) return false;

    // Cliente frecuente (más de 5 pedidos)
    if (userMetrics.orderCount >= 5) {
      return await this.sendReaction(to, messageId, REACTION_EMOJIS.FREQUENT_CLIENT);
    }

    // Primera orden
    if (userMetrics.orderCount === 1) {
      return await this.sendReaction(to, messageId, REACTION_EMOJIS.FIRST_ORDER);
    }

    // Pedido grande (más de $500)
    if (userMetrics.orderTotal >= 500) {
      return await this.sendReaction(to, messageId, REACTION_EMOJIS.LARGE_ORDER);
    }

    // Cliente VIP (más de 10 pedidos o total > $2000)
    if (userMetrics.orderCount >= 10 || userMetrics.totalSpent >= 2000) {
      return await this.sendReaction(to, messageId, REACTION_EMOJIS.VIP_CLIENT);
    }

    return false;
  }

  /**
   * Reacciones para administradores
   * @param {string} to - Número de teléfono del admin
   * @param {string} messageId - ID del mensaje
   * @param {string} type - Tipo de notificación admin
   * @returns {Promise<boolean>}
   */
  async reactToAdminMessage(to, messageId, type) {
    const adminReactions = {
      'notification': REACTION_EMOJIS.ADMIN_NOTIFICATION,
      'security': REACTION_EMOJIS.SECURITY_ALERT,
      'report': REACTION_EMOJIS.REPORT,
      'command': REACTION_EMOJIS.ADMIN_COMMAND
    };

    const emoji = adminReactions[type] || REACTION_EMOJIS.INFO;
    return await this.sendReaction(to, messageId, emoji);
  }

  /**
   * Reacción de validación de input
   * @param {string} to - Número de teléfono
   * @param {string} messageId - ID del mensaje
   * @param {string} validationResult - 'valid', 'suspicious', 'blocked', 'verified'
   * @returns {Promise<boolean>}
   */
  async reactToValidation(to, messageId, validationResult) {
    const validationReactions = {
      'valid': REACTION_EMOJIS.VALID_INPUT,
      'suspicious': REACTION_EMOJIS.SUSPICIOUS_INPUT,
      'blocked': REACTION_EMOJIS.RATE_LIMITED,
      'verified': REACTION_EMOJIS.VERIFIED
    };

    const emoji = validationReactions[validationResult];
    if (!emoji) return false;

    return await this.sendReaction(to, messageId, emoji);
  }

  /**
   * Flujo completo de reacción para pedidos
   * @param {string} to - Número de teléfono
   * @param {string} messageId - ID del mensaje
   * @param {string} stage - Etapa del pedido
   * @returns {Promise<boolean>}
   */
  async reactToOrderFlow(to, messageId, stage) {
    const orderFlowReactions = {
      'received': REACTION_EMOJIS.ORDER_RECEIVED,
      'confirmed': REACTION_EMOJIS.ORDER_CONFIRMED,
      'address_saved': REACTION_EMOJIS.ADDRESS_CONFIRMED,
      'location_received': REACTION_EMOJIS.LOCATION_RECEIVED,
      'access_code_saved': REACTION_EMOJIS.ACCESS_CODE_SAVED,
      'payment_received': REACTION_EMOJIS.PAYMENT_RECEIVED,
      'payment_proof': REACTION_EMOJIS.PAYMENT_PROOF,
      'cash_confirmed': REACTION_EMOJIS.CASH_CONFIRMED,
      'validated': REACTION_EMOJIS.PAYMENT_VALIDATED,
      'completed': REACTION_EMOJIS.ORDER_COMPLETED,
      'error': REACTION_EMOJIS.ORDER_ERROR,
      'celebration': REACTION_EMOJIS.CELEBRATION
    };

    const emoji = orderFlowReactions[stage];
    if (!emoji) {
      console.warn(`⚠️ Etapa de pedido no reconocida: ${stage}`);
      return false;
    }

    return await this.sendReaction(to, messageId, emoji);
  }

  /**
   * Obtiene estadísticas de uso de reacciones
   * @returns {Object}
   */
  getReactionStats() {
    const stats = {
      total: this.reactionHistory.size,
      byEmoji: {},
      recent: []
    };

    // Contar por emoji
    for (const [messageId, data] of this.reactionHistory.entries()) {
      if (data.emoji) {
        stats.byEmoji[data.emoji] = (stats.byEmoji[data.emoji] || 0) + 1;
      }

      // Últimas 10 reacciones
      if (stats.recent.length < 10) {
        stats.recent.push({ messageId, ...data });
      }
    }

    // Ordenar recientes por timestamp
    stats.recent.sort((a, b) => b.timestamp - a.timestamp);

    return stats;
  }

  /**
   * Limpia el historial de reacciones antiguas (más de 24 horas)
   */
  cleanOldReactions() {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    let cleaned = 0;

    for (const [messageId, data] of this.reactionHistory.entries()) {
      if (data.timestamp < oneDayAgo) {
        this.reactionHistory.delete(messageId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Limpiadas ${cleaned} reacciones antiguas del historial`);
    }

    return cleaned;
  }
}

// Exportar clase y constantes
module.exports = {
  ReactionManager,
  REACTION_EMOJIS,
  STATE_REACTIONS,
  INTENTION_PATTERNS
};
