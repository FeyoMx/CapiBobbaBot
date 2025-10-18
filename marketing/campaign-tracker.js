/**
 * Sistema de Tracking de Campañas de Marketing WhatsApp
 * Gestiona campañas, mensajes individuales, estados y métricas
 */

const redis = require('redis');

class CampaignTracker {
  constructor(redisClient) {
    this.redis = redisClient;

    // TTL en segundos
    this.TTL = {
      MESSAGE: 2592000,      // 30 días para mensajes
      CAMPAIGN: 0,           // Sin expiración para campañas activas
      ARCHIVED_CAMPAIGN: 7776000  // 90 días para campañas archivadas
    };
  }

  // ==================== GESTIÓN DE CAMPAÑAS ====================

  /**
   * Crea una nueva campaña de marketing
   * @param {Object} campaignData - Datos de la campaña
   * @returns {Promise<Object>} Campaña creada
   */
  async createCampaign(campaignData) {
    const { id, name, templateName, description = '' } = campaignData;

    if (!id || !name || !templateName) {
      throw new Error('Missing required fields: id, name, templateName');
    }

    const campaign = {
      id,
      name,
      templateName,
      description,
      created: Date.now(),
      active: true,
      stats: {
        totalSent: 0,
        delivered: 0,
        read: 0,
        failed: 0,
        reactions: 0
      }
    };

    const key = `marketing:campaign:${id}`;

    // Verificar si ya existe
    const exists = await this.redis.exists(key);
    if (exists) {
      throw new Error(`Campaign with id '${id}' already exists`);
    }

    await this.redis.set(key, JSON.stringify(campaign));

    // Agregar a índice de campañas
    await this.redis.sAdd('marketing:campaigns:all', id);

    console.log(`✅ [MARKETING] Campaña creada: ${id} - ${name}`);

    return campaign;
  }

  /**
   * Obtiene una campaña por ID
   * @param {string} campaignId - ID de la campaña
   * @returns {Promise<Object|null>} Datos de la campaña
   */
  async getCampaign(campaignId) {
    const key = `marketing:campaign:${campaignId}`;
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  }

  /**
   * Lista todas las campañas
   * @param {boolean} activeOnly - Solo campañas activas
   * @returns {Promise<Array>} Lista de campañas
   */
  async listCampaigns(activeOnly = false) {
    const campaignIds = await this.redis.sMembers('marketing:campaigns:all');
    const campaigns = [];

    for (const id of campaignIds) {
      const campaign = await this.getCampaign(id);
      if (campaign && (!activeOnly || campaign.active)) {
        campaigns.push(campaign);
      }
    }

    // Ordenar por fecha de creación (más recientes primero)
    campaigns.sort((a, b) => b.created - a.created);

    return campaigns;
  }

  /**
   * Actualiza el estado de una campaña
   * @param {string} campaignId - ID de la campaña
   * @param {boolean} active - Estado activo/inactivo
   */
  async updateCampaignStatus(campaignId, active) {
    const campaign = await this.getCampaign(campaignId);

    if (!campaign) {
      throw new Error(`Campaign '${campaignId}' not found`);
    }

    campaign.active = active;

    const key = `marketing:campaign:${campaignId}`;
    await this.redis.set(key, JSON.stringify(campaign));

    console.log(`🔄 [MARKETING] Campaña ${campaignId} ${active ? 'activada' : 'desactivada'}`);
  }

  /**
   * Actualiza las estadísticas de una campaña
   * @param {string} campaignId - ID de la campaña
   * @param {string} statType - Tipo de estadística (delivered, read, failed, reactions)
   * @param {number} increment - Incremento (default: 1)
   */
  async updateCampaignStats(campaignId, statType, increment = 1) {
    const campaign = await this.getCampaign(campaignId);

    if (!campaign) {
      console.warn(`⚠️ [MARKETING] Campaña no encontrada: ${campaignId}`);
      return;
    }

    // Actualizar estadística específica
    if (campaign.stats.hasOwnProperty(statType)) {
      campaign.stats[statType] += increment;
    } else {
      console.warn(`⚠️ [MARKETING] Tipo de stat desconocido: ${statType}`);
      return;
    }

    const key = `marketing:campaign:${campaignId}`;
    await this.redis.set(key, JSON.stringify(campaign));

    console.log(`📊 [MARKETING] ${campaignId}: ${statType} = ${campaign.stats[statType]}`);
  }

  // ==================== GESTIÓN DE MENSAJES ====================

  /**
   * Registra un mensaje enviado de una campaña
   * @param {Object} messageData - Datos del mensaje
   * @returns {Promise<Object>} Mensaje registrado
   */
  async registerMessage(messageData) {
    const { messageId, campaignId, recipient, templateName, sentAt } = messageData;

    if (!messageId || !campaignId || !recipient) {
      throw new Error('Missing required fields: messageId, campaignId, recipient');
    }

    // Verificar que la campaña existe
    const campaign = await this.getCampaign(campaignId);
    if (!campaign) {
      throw new Error(`Campaign '${campaignId}' not found`);
    }

    const message = {
      messageId,
      campaignId,
      recipient,
      templateName: templateName || campaign.templateName,
      status: 'sent',
      timestamps: {
        sent: sentAt || Date.now(),
        delivered: null,
        read: null,
        failed: null
      },
      reactions: [],
      error: null
    };

    const key = `marketing:message:${messageId}`;

    // Guardar mensaje con TTL
    await this.redis.set(
      key,
      JSON.stringify(message),
      { EX: this.TTL.MESSAGE }
    );

    // Agregar a índice de campaña
    await this.redis.sAdd(`marketing:campaign:${campaignId}:messages`, messageId);

    // Incrementar contador totalSent
    await this.updateCampaignStats(campaignId, 'totalSent', 1);

    console.log(`✅ [MARKETING] Mensaje registrado: ${messageId} → ${campaignId}`);

    return message;
  }

  /**
   * Obtiene un mensaje por ID
   * @param {string} messageId - ID del mensaje
   * @returns {Promise<Object|null>} Datos del mensaje
   */
  async getMessage(messageId) {
    const key = `marketing:message:${messageId}`;
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  }

  /**
   * Actualiza el estado de un mensaje
   * @param {string} messageId - ID del mensaje
   * @param {string} status - Nuevo estado (delivered, read, failed)
   * @param {number} timestamp - Timestamp del cambio
   */
  async updateMessageStatus(messageId, status, timestamp = Date.now()) {
    const message = await this.getMessage(messageId);

    if (!message) {
      console.warn(`⚠️ [MARKETING] Mensaje no encontrado: ${messageId}`);
      return;
    }

    // Solo actualizar si es un cambio válido
    const validStatuses = ['delivered', 'read', 'failed'];
    if (!validStatuses.includes(status)) {
      console.warn(`⚠️ [MARKETING] Estado inválido: ${status}`);
      return;
    }

    // Actualizar estado y timestamp
    message.status = status;
    message.timestamps[status] = timestamp;

    const key = `marketing:message:${messageId}`;
    await this.redis.set(
      key,
      JSON.stringify(message),
      { EX: this.TTL.MESSAGE }
    );

    // Actualizar stats de campaña (solo incrementar la primera vez)
    if (message.timestamps[status] === timestamp) {
      await this.updateCampaignStats(message.campaignId, status, 1);
    }

    console.log(`🔄 [MARKETING] Estado actualizado: ${messageId} → ${status}`);
  }

  /**
   * Marca un mensaje como fallido con información de error
   * @param {string} messageId - ID del mensaje
   * @param {Object} errorData - Datos del error
   */
  async markMessageFailed(messageId, errorData) {
    const message = await this.getMessage(messageId);

    if (!message) {
      console.warn(`⚠️ [MARKETING] Mensaje no encontrado: ${messageId}`);
      return;
    }

    message.status = 'failed';
    message.timestamps.failed = Date.now();
    message.error = {
      code: errorData.code || 'unknown',
      title: errorData.title || 'Unknown error',
      message: errorData.message || '',
      timestamp: Date.now()
    };

    const key = `marketing:message:${messageId}`;
    await this.redis.set(
      key,
      JSON.stringify(message),
      { EX: this.TTL.MESSAGE }
    );

    // Actualizar stats de campaña
    await this.updateCampaignStats(message.campaignId, 'failed', 1);

    console.error(`❌ [MARKETING] Mensaje fallido: ${messageId} - ${errorData.title}`);
  }

  /**
   * Obtiene todos los mensajes de una campaña
   * @param {string} campaignId - ID de la campaña
   * @param {Object} filters - Filtros opcionales (status, etc.)
   * @returns {Promise<Array>} Lista de mensajes
   */
  async getMessagesByCampaign(campaignId, filters = {}) {
    const messageIds = await this.redis.sMembers(`marketing:campaign:${campaignId}:messages`);
    const messages = [];

    for (const messageId of messageIds) {
      const message = await this.getMessage(messageId);
      if (message) {
        // Aplicar filtros
        if (filters.status && message.status !== filters.status) {
          continue;
        }
        messages.push(message);
      }
    }

    // Ordenar por fecha de envío (más recientes primero)
    messages.sort((a, b) => b.timestamps.sent - a.timestamps.sent);

    return messages;
  }

  // ==================== GESTIÓN DE REACCIONES ====================

  /**
   * Agrega una reacción a un mensaje
   * @param {string} messageId - ID del mensaje
   * @param {Object} reactionData - Datos de la reacción
   */
  async addReaction(messageId, reactionData) {
    const { emoji, userId, timestamp } = reactionData;

    if (!emoji || !userId) {
      throw new Error('Missing required fields: emoji, userId');
    }

    const message = await this.getMessage(messageId);

    if (!message) {
      console.warn(`⚠️ [MARKETING] Mensaje no encontrado: ${messageId}`);
      return;
    }

    const reaction = {
      emoji,
      userId,
      timestamp: timestamp || Date.now()
    };

    // Verificar si el usuario ya reaccionó (evitar duplicados)
    const existingReactionIndex = message.reactions.findIndex(r => r.userId === userId);

    if (existingReactionIndex >= 0) {
      // Actualizar reacción existente
      message.reactions[existingReactionIndex] = reaction;
      console.log(`🔄 [MARKETING] Reacción actualizada: ${emoji} por ${userId}`);
    } else {
      // Agregar nueva reacción
      message.reactions.push(reaction);

      // Incrementar contador de reacciones en campaña
      await this.updateCampaignStats(message.campaignId, 'reactions', 1);

      console.log(`❤️ [MARKETING] Nueva reacción: ${emoji} por ${userId}`);
    }

    const key = `marketing:message:${messageId}`;
    await this.redis.set(
      key,
      JSON.stringify(message),
      { EX: this.TTL.MESSAGE }
    );
  }

  /**
   * Obtiene todas las reacciones de un mensaje
   * @param {string} messageId - ID del mensaje
   * @returns {Promise<Array>} Lista de reacciones
   */
  async getReactionsByMessage(messageId) {
    const message = await this.getMessage(messageId);
    return message ? message.reactions : [];
  }

  /**
   * Obtiene todas las reacciones de una campaña
   * @param {string} campaignId - ID de la campaña
   * @returns {Promise<Array>} Lista de reacciones con metadata
   */
  async getReactionsByCampaign(campaignId) {
    const messages = await this.getMessagesByCampaign(campaignId);
    const allReactions = [];

    for (const message of messages) {
      for (const reaction of message.reactions) {
        allReactions.push({
          ...reaction,
          messageId: message.messageId,
          recipient: message.recipient
        });
      }
    }

    return allReactions;
  }

  // ==================== ANALYTICS ====================

  /**
   * Calcula estadísticas detalladas de una campaña
   * @param {string} campaignId - ID de la campaña
   * @returns {Promise<Object>} Estadísticas completas
   */
  async getCampaignStats(campaignId) {
    const campaign = await this.getCampaign(campaignId);

    if (!campaign) {
      throw new Error(`Campaign '${campaignId}' not found`);
    }

    const messages = await this.getMessagesByCampaign(campaignId);
    const reactions = await this.getReactionsByCampaign(campaignId);

    // Calcular tasas
    const totalSent = campaign.stats.totalSent || 0;
    const deliveryRate = totalSent > 0 ? (campaign.stats.delivered / totalSent) * 100 : 0;
    const readRate = totalSent > 0 ? (campaign.stats.read / totalSent) * 100 : 0;
    const failureRate = totalSent > 0 ? (campaign.stats.failed / totalSent) * 100 : 0;
    const engagementRate = totalSent > 0 ? (campaign.stats.reactions / totalSent) * 100 : 0;

    // Análisis de reacciones
    const emojiDistribution = {};
    for (const reaction of reactions) {
      emojiDistribution[reaction.emoji] = (emojiDistribution[reaction.emoji] || 0) + 1;
    }

    // Top emojis
    const topEmojis = Object.entries(emojiDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([emoji, count]) => ({ emoji, count }));

    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        templateName: campaign.templateName,
        created: campaign.created,
        active: campaign.active
      },
      stats: {
        ...campaign.stats,
        deliveryRate: Math.round(deliveryRate * 10) / 10,
        readRate: Math.round(readRate * 10) / 10,
        failureRate: Math.round(failureRate * 10) / 10,
        engagementRate: Math.round(engagementRate * 10) / 10
      },
      reactions: {
        total: reactions.length,
        distribution: emojiDistribution,
        topEmojis
      },
      messages: {
        total: messages.length,
        byStatus: {
          sent: messages.filter(m => m.status === 'sent').length,
          delivered: messages.filter(m => m.status === 'delivered').length,
          read: messages.filter(m => m.status === 'read').length,
          failed: messages.filter(m => m.status === 'failed').length
        }
      }
    };
  }

  /**
   * Obtiene estadísticas generales del dashboard
   * @returns {Promise<Object>} Estadísticas del dashboard
   */
  async getDashboardStats() {
    const campaigns = await this.listCampaigns();

    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.active).length;

    let totalSent = 0;
    let totalDelivered = 0;
    let totalRead = 0;
    let totalFailed = 0;
    let totalReactions = 0;

    for (const campaign of campaigns) {
      totalSent += campaign.stats.totalSent || 0;
      totalDelivered += campaign.stats.delivered || 0;
      totalRead += campaign.stats.read || 0;
      totalFailed += campaign.stats.failed || 0;
      totalReactions += campaign.stats.reactions || 0;
    }

    const avgDeliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const avgReadRate = totalSent > 0 ? (totalRead / totalSent) * 100 : 0;
    const avgEngagementRate = totalSent > 0 ? (totalReactions / totalSent) * 100 : 0;

    return {
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns,
        archived: totalCampaigns - activeCampaigns
      },
      messages: {
        totalSent,
        delivered: totalDelivered,
        read: totalRead,
        failed: totalFailed,
        reactions: totalReactions
      },
      averages: {
        deliveryRate: Math.round(avgDeliveryRate * 10) / 10,
        readRate: Math.round(avgReadRate * 10) / 10,
        engagementRate: Math.round(avgEngagementRate * 10) / 10
      },
      recentCampaigns: campaigns.slice(0, 5)
    };
  }
}

module.exports = CampaignTracker;
