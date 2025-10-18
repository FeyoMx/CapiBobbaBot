/**
 * Manejador de Reacciones de WhatsApp para Campañas de Marketing
 * Procesa reacciones, analiza sentimiento y genera estadísticas
 */

class ReactionHandler {
  constructor(campaignTracker) {
    this.campaignTracker = campaignTracker;

    // Categorización de emojis por sentimiento
    this.sentimentMap = {
      // Positivos
      '👍': 'positive',
      '❤️': 'positive',
      '😍': 'positive',
      '🔥': 'positive',
      '🎉': 'positive',
      '✨': 'positive',
      '💯': 'positive',
      '🙌': 'positive',
      '👏': 'positive',
      '😊': 'positive',
      '😀': 'positive',
      '🤩': 'positive',
      '💚': 'positive',
      '💙': 'positive',
      '💜': 'positive',
      '🧡': 'positive',
      '💛': 'positive',
      '🤗': 'positive',
      '😘': 'positive',
      '😎': 'positive',
      '🥰': 'positive',
      '🌟': 'positive',

      // Negativos
      '👎': 'negative',
      '😡': 'negative',
      '😠': 'negative',
      '😤': 'negative',
      '💔': 'negative',
      '😢': 'negative',
      '😭': 'negative',
      '😞': 'negative',
      '😔': 'negative',
      '😟': 'negative',
      '😕': 'negative',
      '🙁': 'negative',
      '☹️': 'negative',
      '😒': 'negative',
      '😑': 'negative',
      '💩': 'negative',

      // Neutrales
      '🤔': 'neutral',
      '😐': 'neutral',
      '😶': 'neutral',
      '🙄': 'neutral',
      '😏': 'neutral',
      '😬': 'neutral',
      '🤷': 'neutral',
      '👀': 'neutral',
      '😮': 'neutral',
      '😯': 'neutral',
      '😲': 'neutral',
      '😳': 'neutral',

      // Curiosidad/Interés
      '🤨': 'neutral',
      '🧐': 'neutral',
      '👁️': 'neutral'
    };
  }

  /**
   * Procesa una reacción recibida desde el webhook
   * @param {Object} webhookData - Datos del webhook de reacción
   * @returns {Promise<Object>} Resultado del procesamiento
   */
  async handleReaction(webhookData) {
    const { messageId, campaignId, emoji, userId, timestamp } = webhookData;

    try {
      // Validar datos requeridos
      if (!messageId || !emoji || !userId) {
        throw new Error('Missing required fields: messageId, emoji, userId');
      }

      // Analizar sentimiento del emoji
      const sentiment = this.analyzeReaction(emoji);

      // Registrar reacción en campaign tracker
      await this.campaignTracker.addReaction(messageId, {
        emoji,
        userId,
        timestamp: timestamp || Date.now(),
        sentiment
      });

      console.log(`✅ [REACTION] Procesada: ${emoji} (${sentiment}) por ${userId} → ${messageId}`);

      return {
        success: true,
        messageId,
        campaignId,
        emoji,
        sentiment,
        timestamp
      };

    } catch (error) {
      console.error(`❌ [REACTION] Error procesando reacción:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analiza el sentimiento de un emoji
   * @param {string} emoji - Emoji a analizar
   * @returns {string} Sentimiento (positive, negative, neutral)
   */
  analyzeReaction(emoji) {
    return this.sentimentMap[emoji] || 'neutral';
  }

  /**
   * Obtiene estadísticas de reacciones para una campaña
   * @param {string} campaignId - ID de la campaña
   * @returns {Promise<Object>} Estadísticas de reacciones
   */
  async getReactionStats(campaignId) {
    const reactions = await this.campaignTracker.getReactionsByCampaign(campaignId);

    if (reactions.length === 0) {
      return {
        total: 0,
        bySentiment: {
          positive: 0,
          negative: 0,
          neutral: 0
        },
        byEmoji: {},
        topEmojis: [],
        sentimentRate: {
          positive: 0,
          negative: 0,
          neutral: 0
        }
      };
    }

    // Contadores
    const bySentiment = {
      positive: 0,
      negative: 0,
      neutral: 0
    };

    const byEmoji = {};
    const uniqueUsers = new Set();

    // Procesar cada reacción
    for (const reaction of reactions) {
      const sentiment = this.analyzeReaction(reaction.emoji);

      // Contar por sentimiento
      bySentiment[sentiment]++;

      // Contar por emoji
      byEmoji[reaction.emoji] = (byEmoji[reaction.emoji] || 0) + 1;

      // Usuarios únicos que reaccionaron
      uniqueUsers.add(reaction.userId);
    }

    // Calcular top emojis
    const topEmojis = Object.entries(byEmoji)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([emoji, count]) => ({
        emoji,
        count,
        sentiment: this.analyzeReaction(emoji)
      }));

    // Calcular tasas de sentimiento
    const total = reactions.length;
    const sentimentRate = {
      positive: Math.round((bySentiment.positive / total) * 1000) / 10,
      negative: Math.round((bySentiment.negative / total) * 1000) / 10,
      neutral: Math.round((bySentiment.neutral / total) * 1000) / 10
    };

    return {
      total,
      uniqueUsers: uniqueUsers.size,
      bySentiment,
      byEmoji,
      topEmojis,
      sentimentRate
    };
  }

  /**
   * Obtiene timeline de reacciones para gráficos
   * @param {string} campaignId - ID de la campaña
   * @param {string} interval - Intervalo de agrupación (hour, day)
   * @returns {Promise<Array>} Timeline de reacciones
   */
  async getReactionTimeline(campaignId, interval = 'hour') {
    const reactions = await this.campaignTracker.getReactionsByCampaign(campaignId);

    if (reactions.length === 0) {
      return [];
    }

    // Agrupar por intervalo
    const timeline = {};

    for (const reaction of reactions) {
      const timestamp = reaction.timestamp;
      const date = new Date(timestamp);

      let key;
      if (interval === 'hour') {
        // Agrupar por hora
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
      } else if (interval === 'day') {
        // Agrupar por día
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      } else {
        key = timestamp;
      }

      if (!timeline[key]) {
        timeline[key] = {
          timestamp: key,
          total: 0,
          positive: 0,
          negative: 0,
          neutral: 0,
          emojis: {}
        };
      }

      const sentiment = this.analyzeReaction(reaction.emoji);

      timeline[key].total++;
      timeline[key][sentiment]++;
      timeline[key].emojis[reaction.emoji] = (timeline[key].emojis[reaction.emoji] || 0) + 1;
    }

    // Convertir a array y ordenar cronológicamente
    return Object.values(timeline).sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  /**
   * Compara el engagement de múltiples campañas
   * @param {Array<string>} campaignIds - IDs de campañas a comparar
   * @returns {Promise<Object>} Comparación de engagement
   */
  async compareEngagement(campaignIds) {
    const comparison = [];

    for (const campaignId of campaignIds) {
      const campaign = await this.campaignTracker.getCampaign(campaignId);
      const stats = await this.getReactionStats(campaignId);

      if (campaign) {
        const totalSent = campaign.stats.totalSent || 0;
        const engagementRate = totalSent > 0
          ? Math.round((stats.total / totalSent) * 1000) / 10
          : 0;

        comparison.push({
          campaignId,
          campaignName: campaign.name,
          totalSent,
          reactions: stats.total,
          engagementRate,
          sentiment: stats.sentimentRate,
          topEmojis: stats.topEmojis.slice(0, 3)
        });
      }
    }

    // Ordenar por engagement rate (mayor a menor)
    comparison.sort((a, b) => b.engagementRate - a.engagementRate);

    return comparison;
  }

  /**
   * Detecta patrones inusuales en reacciones (potenciales problemas o éxitos)
   * @param {string} campaignId - ID de la campaña
   * @returns {Promise<Object>} Alertas y insights
   */
  async detectPatterns(campaignId) {
    const stats = await this.getReactionStats(campaignId);
    const campaign = await this.campaignTracker.getCampaign(campaignId);

    const alerts = [];
    const insights = [];

    if (!campaign || stats.total === 0) {
      return { alerts, insights };
    }

    // Alerta: Alto porcentaje de reacciones negativas
    if (stats.sentimentRate.negative > 30) {
      alerts.push({
        type: 'warning',
        severity: 'high',
        message: `Alto porcentaje de reacciones negativas (${stats.sentimentRate.negative}%)`,
        recommendation: 'Revisar el contenido de la plantilla y ajustar el mensaje'
      });
    }

    // Insight: Excelente engagement
    const totalSent = campaign.stats.totalSent || 0;
    const engagementRate = totalSent > 0 ? (stats.total / totalSent) * 100 : 0;

    if (engagementRate > 20) {
      insights.push({
        type: 'success',
        message: `Excelente tasa de engagement (${Math.round(engagementRate * 10) / 10}%)`,
        recommendation: 'Considera replicar el estilo de esta campaña en futuras plantillas'
      });
    }

    // Insight: Alta tasa de sentimiento positivo
    if (stats.sentimentRate.positive > 70) {
      insights.push({
        type: 'success',
        message: `Alta tasa de reacciones positivas (${stats.sentimentRate.positive}%)`,
        recommendation: 'La audiencia está respondiendo muy bien a este mensaje'
      });
    }

    // Alerta: Bajo engagement
    if (totalSent > 50 && engagementRate < 5) {
      alerts.push({
        type: 'info',
        severity: 'medium',
        message: `Bajo engagement (${Math.round(engagementRate * 10) / 10}%)`,
        recommendation: 'Considera ajustar el contenido o el timing de los envíos'
      });
    }

    return {
      alerts,
      insights,
      metrics: {
        engagementRate: Math.round(engagementRate * 10) / 10,
        sentimentScore: Math.round((stats.sentimentRate.positive - stats.sentimentRate.negative) * 10) / 10
      }
    };
  }

  /**
   * Obtiene los usuarios más activos (que más reaccionan)
   * @param {string} campaignId - ID de la campaña
   * @param {number} limit - Número de usuarios a retornar
   * @returns {Promise<Array>} Top usuarios
   */
  async getTopReactors(campaignId, limit = 10) {
    const reactions = await this.campaignTracker.getReactionsByCampaign(campaignId);

    if (reactions.length === 0) {
      return [];
    }

    // Contar reacciones por usuario
    const userReactions = {};

    for (const reaction of reactions) {
      if (!userReactions[reaction.userId]) {
        userReactions[reaction.userId] = {
          userId: reaction.userId,
          count: 0,
          emojis: {}
        };
      }

      userReactions[reaction.userId].count++;
      userReactions[reaction.userId].emojis[reaction.emoji] =
        (userReactions[reaction.userId].emojis[reaction.emoji] || 0) + 1;
    }

    // Convertir a array y ordenar
    const topReactors = Object.values(userReactions)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(user => ({
        userId: user.userId,
        reactionCount: user.count,
        favoriteEmoji: Object.entries(user.emojis)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || '❓'
      }));

    return topReactors;
  }
}

module.exports = ReactionHandler;
