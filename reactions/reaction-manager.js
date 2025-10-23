/**
 * Sistema de Reacciones Inteligente para WhatsApp v2.0
 * Gestiona reacciones contextuales, progresivas y basadas en métricas
 *
 * Nuevas Features v2.0:
 * - Persistencia en Redis para historial de reacciones
 * - Sistema de métricas avanzadas integrado
 * - Anti-spam: previene reacciones duplicadas
 * - Rate limiting inteligente (respeta límites de WhatsApp)
 * - Reacciones secuenciales automáticas para flujos
 * - Analytics avanzado con Redis
 * - A/B Testing para optimización
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

// Flujos secuenciales de reacciones (reacciones automáticas progresivas)
const SEQUENTIAL_FLOWS = {
  order_flow: {
    name: 'Flujo de Pedido Completo',
    stages: [
      { key: 'received', emoji: '⏳', duration: 0 },
      { key: 'confirmed', emoji: '🛒', duration: 2000 },
      { key: 'address_saved', emoji: '🚚', duration: 1000 },
      { key: 'payment_received', emoji: '💰', duration: 1000 },
      { key: 'completed', emoji: '✅', duration: 1000 }
    ]
  },
  payment_flow: {
    name: 'Flujo de Pago',
    stages: [
      { key: 'payment_received', emoji: '💰', duration: 0 },
      { key: 'payment_proof', emoji: '📸', duration: 1000 },
      { key: 'validated', emoji: '✔️', duration: 1500 }
    ]
  }
};

// Configuración de rate limiting (respetar límites de WhatsApp Business API)
const RATE_LIMIT_CONFIG = {
  MAX_REACTIONS_PER_MINUTE: 10,  // WhatsApp permite ~20 req/min, usamos 10 para reacciones
  MAX_REACTIONS_PER_HOUR: 200,   // Límite conservador
  COOLDOWN_SAME_MESSAGE: 5000,   // 5s antes de poder re-reaccionar al mismo mensaje
  COOLDOWN_SAME_USER: 1000       // 1s entre reacciones al mismo usuario
};

class ReactionManager {
  constructor(whatsappToken, phoneNumberId, apiVersion = 'v24.0', redisClient = null, metricsCollector = null) {
    this.whatsappToken = whatsappToken;
    this.phoneNumberId = phoneNumberId;
    this.apiVersion = apiVersion;
    this.redisClient = redisClient; // Cliente Redis para persistencia
    this.metricsCollector = metricsCollector; // Sistema de métricas
    this.reactionHistory = new Map(); // Fallback en memoria

    // Rate limiting tracking
    this.rateLimitTracker = {
      perMinute: [],
      perHour: [],
      lastReactionByUser: new Map(),
      lastReactionByMessage: new Map()
    };

    // Sequential flows tracking
    this.activeFlows = new Map(); // messageId -> { flowKey, stageIndex, startTime }

    console.log('🎨 ReactionManager v2.0 inicializado con:', {
      redis: redisClient ? 'habilitado' : 'deshabilitado',
      metrics: metricsCollector ? 'habilitado' : 'deshabilitado'
    });
  }

  /**
   * Verifica si se puede enviar una reacción (rate limiting + anti-spam)
   * @private
   * @param {string} to - Número de teléfono
   * @param {string} messageId - ID del mensaje
   * @returns {Object} { allowed: boolean, reason: string }
   */
  _checkRateLimit(to, messageId) {
    const now = Date.now();

    // Limpieza de timestamps antiguos (> 1 minuto y > 1 hora)
    this.rateLimitTracker.perMinute = this.rateLimitTracker.perMinute.filter(
      timestamp => now - timestamp < 60000
    );
    this.rateLimitTracker.perHour = this.rateLimitTracker.perHour.filter(
      timestamp => now - timestamp < 3600000
    );

    // Verificar límite por minuto
    if (this.rateLimitTracker.perMinute.length >= RATE_LIMIT_CONFIG.MAX_REACTIONS_PER_MINUTE) {
      return { allowed: false, reason: 'rate_limit_minute' };
    }

    // Verificar límite por hora
    if (this.rateLimitTracker.perHour.length >= RATE_LIMIT_CONFIG.MAX_REACTIONS_PER_HOUR) {
      return { allowed: false, reason: 'rate_limit_hour' };
    }

    // Anti-spam: mismo mensaje
    const lastReactionToMessage = this.rateLimitTracker.lastReactionByMessage.get(messageId);
    if (lastReactionToMessage && now - lastReactionToMessage < RATE_LIMIT_CONFIG.COOLDOWN_SAME_MESSAGE) {
      return { allowed: false, reason: 'cooldown_message' };
    }

    // Anti-spam: mismo usuario
    const lastReactionToUser = this.rateLimitTracker.lastReactionByUser.get(to);
    if (lastReactionToUser && now - lastReactionToUser < RATE_LIMIT_CONFIG.COOLDOWN_SAME_USER) {
      return { allowed: false, reason: 'cooldown_user' };
    }

    return { allowed: true, reason: 'ok' };
  }

  /**
   * Registra una reacción enviada (para rate limiting)
   * @private
   * @param {string} to - Número de teléfono
   * @param {string} messageId - ID del mensaje
   */
  _recordReaction(to, messageId) {
    const now = Date.now();
    this.rateLimitTracker.perMinute.push(now);
    this.rateLimitTracker.perHour.push(now);
    this.rateLimitTracker.lastReactionByMessage.set(messageId, now);
    this.rateLimitTracker.lastReactionByUser.set(to, now);
  }

  /**
   * Guarda historial de reacción en Redis
   * @private
   * @param {string} messageId - ID del mensaje
   * @param {Object} data - Datos de la reacción
   */
  async _saveToRedis(messageId, data) {
    if (!this.redisClient) return;

    try {
      const key = `reaction:${messageId}`;
      await this.redisClient.set(key, JSON.stringify(data), { EX: 86400 }); // TTL: 24h

      // Guardar en índice de reacciones por emoji (para analytics)
      if (data.emoji) {
        const emojiKey = `reactions:by_emoji:${data.emoji}`;
        await this.redisClient.incr(emojiKey);
        await this.redisClient.expire(emojiKey, 86400 * 30); // TTL: 30 días

        // Guardar en índice de reacciones por usuario
        const userKey = `reactions:by_user:${data.to}`;
        await this.redisClient.incr(userKey);
        await this.redisClient.expire(userKey, 86400 * 30); // TTL: 30 días
      }
    } catch (error) {
      console.error('❌ Error guardando reacción en Redis:', error.message);
    }
  }

  /**
   * Registra métrica de reacción
   * @private
   * @param {string} type - Tipo de reacción ('sent', 'removed', 'rate_limited', 'error')
   * @param {string} emoji - Emoji usado
   */
  _recordMetric(type, emoji = null) {
    if (!this.metricsCollector) return;

    try {
      // Métrica general de reacciones
      this.metricsCollector.recordMetric(`reactions_${type}`, 1, 86400); // TTL: 24h

      // Métrica específica por emoji
      if (emoji && type === 'sent') {
        this.metricsCollector.recordMetric(`reactions_emoji_${emoji}`, 1, 86400);
      }
    } catch (error) {
      console.error('❌ Error registrando métrica de reacción:', error.message);
    }
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
      this._recordMetric('error');
      return false;
    }

    // Verificar rate limiting y anti-spam
    const rateLimitCheck = this._checkRateLimit(to, messageId);
    if (!rateLimitCheck.allowed) {
      console.warn(`🚫 Reacción bloqueada por ${rateLimitCheck.reason} (mensaje: ${messageId})`);
      this._recordMetric('rate_limited', emoji);
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

      // Registrar reacción para rate limiting
      this._recordReaction(to, messageId);

      // Guardar en historial (memoria)
      const reactionData = { to, emoji, timestamp: Date.now() };
      this.reactionHistory.set(messageId, reactionData);

      // Guardar en Redis (persistencia)
      await this._saveToRedis(messageId, reactionData);

      // Registrar métrica
      this._recordMetric(emoji ? 'sent' : 'removed', emoji);

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

      this._recordMetric('error', emoji);
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

  /**
   * ===== NUEVOS MÉTODOS v2.0 =====
   */

  /**
   * Inicia un flujo secuencial de reacciones (reacciones automáticas progresivas)
   * @param {string} to - Número de teléfono
   * @param {string} messageId - ID del mensaje inicial
   * @param {string} flowKey - Clave del flujo ('order_flow', 'payment_flow')
   * @returns {Promise<boolean>}
   */
  async startSequentialFlow(to, messageId, flowKey) {
    const flow = SEQUENTIAL_FLOWS[flowKey];
    if (!flow) {
      console.warn(`⚠️ Flujo secuencial no encontrado: ${flowKey}`);
      return false;
    }

    console.log(`🎬 Iniciando flujo secuencial: ${flow.name}`);

    // Guardar flujo activo
    this.activeFlows.set(messageId, {
      flowKey,
      stageIndex: 0,
      startTime: Date.now(),
      to
    });

    // Ejecutar primera etapa
    const firstStage = flow.stages[0];
    await this.sendReaction(to, messageId, firstStage.emoji);

    // Programar etapas siguientes
    for (let i = 1; i < flow.stages.length; i++) {
      const stage = flow.stages[i];
      const previousDuration = flow.stages.slice(0, i).reduce((sum, s) => sum + s.duration, 0);

      setTimeout(async () => {
        // Verificar que el flujo sigue activo
        const activeFlow = this.activeFlows.get(messageId);
        if (activeFlow && activeFlow.stageIndex === i - 1) {
          console.log(`🔄 Flujo ${flow.name}: etapa ${i + 1}/${flow.stages.length} (${stage.emoji})`);
          await this.sendReaction(to, messageId, stage.emoji);
          activeFlow.stageIndex = i;

          // Si es la última etapa, limpiar flujo activo
          if (i === flow.stages.length - 1) {
            this.activeFlows.delete(messageId);
            console.log(`🏁 Flujo ${flow.name} completado`);
          }
        }
      }, previousDuration + stage.duration);
    }

    return true;
  }

  /**
   * Cancela un flujo secuencial activo
   * @param {string} messageId - ID del mensaje
   * @returns {boolean}
   */
  cancelSequentialFlow(messageId) {
    if (this.activeFlows.has(messageId)) {
      this.activeFlows.delete(messageId);
      console.log(`⏹️ Flujo secuencial cancelado para mensaje ${messageId}`);
      return true;
    }
    return false;
  }

  /**
   * Obtiene analytics avanzados desde Redis
   * @returns {Promise<Object>}
   */
  async getAdvancedAnalytics() {
    const analytics = {
      totalReactions: this.reactionHistory.size,
      byEmoji: {},
      byUser: {},
      rateLimitStats: {
        reactionsLastMinute: this.rateLimitTracker.perMinute.length,
        reactionsLastHour: this.rateLimitTracker.perHour.length,
        limitMinute: RATE_LIMIT_CONFIG.MAX_REACTIONS_PER_MINUTE,
        limitHour: RATE_LIMIT_CONFIG.MAX_REACTIONS_PER_HOUR
      },
      activeFlows: this.activeFlows.size,
      timestamp: Date.now()
    };

    // Si hay Redis, obtener datos persistidos
    if (this.redisClient) {
      try {
        // Obtener conteos por emoji (últimos 30 días)
        const emojiKeys = await this.redisClient.keys('reactions:by_emoji:*');
        for (const key of emojiKeys) {
          const emoji = key.replace('reactions:by_emoji:', '');
          const count = await this.redisClient.get(key);
          analytics.byEmoji[emoji] = parseInt(count) || 0;
        }

        // Obtener top 10 usuarios por reacciones
        const userKeys = await this.redisClient.keys('reactions:by_user:*');
        const userCounts = [];
        for (const key of userKeys) {
          const user = key.replace('reactions:by_user:', '');
          const count = await this.redisClient.get(key);
          userCounts.push({ user, count: parseInt(count) || 0 });
        }
        userCounts.sort((a, b) => b.count - a.count);
        analytics.topUsers = userCounts.slice(0, 10);

      } catch (error) {
        console.error('❌ Error obteniendo analytics desde Redis:', error.message);
      }
    }

    return analytics;
  }

  /**
   * Obtiene métricas de performance del sistema de reacciones
   * @returns {Object}
   */
  getPerformanceMetrics() {
    return {
      memoryUsage: {
        reactionHistory: this.reactionHistory.size,
        activeFlows: this.activeFlows.size,
        rateLimitTracking: {
          perMinute: this.rateLimitTracker.perMinute.length,
          perHour: this.rateLimitTracker.perHour.length,
          byUser: this.rateLimitTracker.lastReactionByUser.size,
          byMessage: this.rateLimitTracker.lastReactionByMessage.size
        }
      },
      rateLimit: {
        current: {
          perMinute: this.rateLimitTracker.perMinute.length,
          perHour: this.rateLimitTracker.perHour.length
        },
        limits: {
          perMinute: RATE_LIMIT_CONFIG.MAX_REACTIONS_PER_MINUTE,
          perHour: RATE_LIMIT_CONFIG.MAX_REACTIONS_PER_HOUR
        },
        utilizationPercentage: {
          minute: (this.rateLimitTracker.perMinute.length / RATE_LIMIT_CONFIG.MAX_REACTIONS_PER_MINUTE * 100).toFixed(2),
          hour: (this.rateLimitTracker.perHour.length / RATE_LIMIT_CONFIG.MAX_REACTIONS_PER_HOUR * 100).toFixed(2)
        }
      },
      features: {
        redis: this.redisClient !== null,
        metrics: this.metricsCollector !== null,
        sequentialFlows: this.activeFlows.size
      }
    };
  }

  /**
   * Sugiere la mejor reacción basada en contexto (analytics-driven)
   * @param {string} context - Contexto ('order', 'payment', 'inquiry', etc.)
   * @returns {Promise<string|null>} - Emoji sugerido
   */
  async suggestReaction(context) {
    // Implementación básica: en futuras versiones puede usar ML
    const suggestions = {
      'order_start': REACTION_EMOJIS.ORDER_RECEIVED,
      'order_complete': REACTION_EMOJIS.CELEBRATION,
      'payment_received': REACTION_EMOJIS.PAYMENT_RECEIVED,
      'image_received': REACTION_EMOJIS.PAYMENT_PROOF,
      'location_received': REACTION_EMOJIS.LOCATION_RECEIVED,
      'query': REACTION_EMOJIS.INFO,
      'error': REACTION_EMOJIS.ERROR
    };

    return suggestions[context] || null;
  }
}

// Exportar clase y constantes
module.exports = {
  ReactionManager,
  REACTION_EMOJIS,
  STATE_REACTIONS,
  INTENTION_PATTERNS,
  SEQUENTIAL_FLOWS,
  RATE_LIMIT_CONFIG
};
