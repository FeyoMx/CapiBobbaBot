// security/input-validator.js
// Sistema de validación y sanitización de inputs para prevenir inyecciones y ataques

class InputValidator {
    constructor() {
        // Patrones peligrosos a detectar
        this.dangerousPatterns = [
            // SQL Injection
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
            // Script injection
            /<script[^>]*>.*?<\/script>/gi,
            // XSS básico
            /<iframe[^>]*>.*?<\/iframe>/gi,
            /<object[^>]*>.*?<\/object>/gi,
            // Command injection
            /[;&|`$()]/g,
            // Path traversal
            /\.\.\//g,
            // NoSQL injection
            /\$where|\$ne|\$gt|\$lt/gi
        ];

        // Límites de longitud
        this.maxLengths = {
            text: 4096,           // Mensajes de texto
            address: 500,         // Direcciones
            phoneNumber: 20,      // Números de teléfono
            orderSummary: 2000,   // Resumen de pedido
            paymentNote: 200      // Notas de pago
        };
    }

    /**
     * Valida y sanitiza un mensaje de texto
     * @param {string} text - Texto a validar
     * @returns {{valid: boolean, sanitized: string, errors: string[]}}
     */
    validateText(text) {
        const errors = [];

        if (!text || typeof text !== 'string') {
            return { valid: false, sanitized: '', errors: ['El texto es requerido'] };
        }

        // Verificar longitud
        if (text.length > this.maxLengths.text) {
            errors.push(`El texto excede el límite de ${this.maxLengths.text} caracteres`);
            text = text.substring(0, this.maxLengths.text);
        }

        // Detectar patrones peligrosos
        const dangerousFound = this.detectDangerousPatterns(text);
        if (dangerousFound.length > 0) {
            errors.push(`Patrones sospechosos detectados: ${dangerousFound.join(', ')}`);
        }

        // Sanitizar
        const sanitized = this.sanitizeString(text);

        return {
            valid: errors.length === 0,
            sanitized,
            errors,
            suspicious: dangerousFound.length > 0
        };
    }

    /**
     * Valida un número de teléfono
     * @param {string} phoneNumber - Número a validar
     * @returns {{valid: boolean, sanitized: string, errors: string[]}}
     */
    validatePhoneNumber(phoneNumber) {
        const errors = [];

        if (!phoneNumber || typeof phoneNumber !== 'string') {
            return { valid: false, sanitized: '', errors: ['El número de teléfono es requerido'] };
        }

        // Remover caracteres no numéricos excepto +
        const cleaned = phoneNumber.replace(/[^\d+]/g, '');

        // Verificar longitud
        if (cleaned.length < 10 || cleaned.length > this.maxLengths.phoneNumber) {
            errors.push('Formato de número de teléfono inválido');
        }

        // Verificar formato básico
        const phoneRegex = /^\+?[\d]{10,15}$/;
        if (!phoneRegex.test(cleaned)) {
            errors.push('El número de teléfono contiene caracteres inválidos');
        }

        return {
            valid: errors.length === 0,
            sanitized: cleaned,
            errors
        };
    }

    /**
     * Valida una dirección de entrega
     * @param {string} address - Dirección a validar
     * @returns {{valid: boolean, sanitized: string, errors: string[]}}
     */
    validateAddress(address) {
        const errors = [];

        if (!address || typeof address !== 'string') {
            return { valid: false, sanitized: '', errors: ['La dirección es requerida'] };
        }

        // Verificar longitud mínima
        if (address.trim().length < 10) {
            errors.push('La dirección es demasiado corta (mínimo 10 caracteres)');
        }

        // Verificar longitud máxima
        if (address.length > this.maxLengths.address) {
            errors.push(`La dirección excede el límite de ${this.maxLengths.address} caracteres`);
            address = address.substring(0, this.maxLengths.address);
        }

        // Detectar patrones peligrosos
        const dangerousFound = this.detectDangerousPatterns(address);
        if (dangerousFound.length > 0) {
            errors.push('La dirección contiene caracteres sospechosos');
        }

        const sanitized = this.sanitizeString(address);

        return {
            valid: errors.length === 0,
            sanitized,
            errors
        };
    }

    /**
     * Valida datos de un pedido completo
     * @param {Object} orderData - Datos del pedido
     * @returns {{valid: boolean, sanitized: Object, errors: string[]}}
     */
    validateOrderData(orderData) {
        const errors = [];

        if (!orderData || typeof orderData !== 'object') {
            return { valid: false, sanitized: null, errors: ['Datos de pedido inválidos'] };
        }

        const sanitized = {};

        // Validar summary
        if (orderData.summary) {
            const summaryValidation = this.validateText(orderData.summary);
            if (!summaryValidation.valid) {
                errors.push(...summaryValidation.errors.map(e => `Summary: ${e}`));
            }
            sanitized.summary = summaryValidation.sanitized;
        }

        // Validar total
        if (orderData.total !== undefined) {
            const totalValidation = this.validateNumber(orderData.total);
            if (!totalValidation.valid) {
                errors.push(...totalValidation.errors.map(e => `Total: ${e}`));
            }
            sanitized.total = totalValidation.sanitized;
        }

        // Validar fullText
        if (orderData.fullText) {
            const fullTextValidation = this.validateText(orderData.fullText);
            if (!fullTextValidation.valid) {
                errors.push(...fullTextValidation.errors.map(e => `FullText: ${e}`));
            }
            sanitized.fullText = fullTextValidation.sanitized;
        }

        return {
            valid: errors.length === 0,
            sanitized,
            errors
        };
    }

    /**
     * Valida un número (precio, cantidad, etc.)
     * @param {*} value - Valor a validar
     * @returns {{valid: boolean, sanitized: number, errors: string[]}}
     */
    validateNumber(value) {
        const errors = [];

        if (value === undefined || value === null) {
            return { valid: false, sanitized: 0, errors: ['El valor numérico es requerido'] };
        }

        const num = parseFloat(value);

        if (isNaN(num)) {
            errors.push('El valor no es un número válido');
            return { valid: false, sanitized: 0, errors };
        }

        if (num < 0) {
            errors.push('El valor no puede ser negativo');
        }

        if (num > 999999) {
            errors.push('El valor es demasiado grande');
        }

        return {
            valid: errors.length === 0,
            sanitized: num,
            errors
        };
    }

    /**
     * Valida un objeto JSON recibido
     * @param {*} obj - Objeto a validar
     * @param {number} maxDepth - Profundidad máxima permitida
     * @returns {{valid: boolean, errors: string[]}}
     */
    validateJSON(obj, maxDepth = 5) {
        const errors = [];

        if (!obj || typeof obj !== 'object') {
            return { valid: false, errors: ['El objeto JSON es inválido'] };
        }

        // Verificar profundidad
        const depth = this._getObjectDepth(obj);
        if (depth > maxDepth) {
            errors.push(`El objeto JSON es demasiado profundo (máximo: ${maxDepth} niveles)`);
        }

        // Verificar tamaño del objeto
        const size = JSON.stringify(obj).length;
        if (size > 50000) {
            errors.push('El objeto JSON es demasiado grande');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Detecta patrones peligrosos en un string
     * @private
     */
    detectDangerousPatterns(text) {
        const found = [];

        for (const pattern of this.dangerousPatterns) {
            if (pattern.test(text)) {
                found.push(pattern.toString());
            }
        }

        return found;
    }

    /**
     * Sanitiza un string removiendo caracteres peligrosos
     * @private
     */
    sanitizeString(text) {
        if (!text) return '';

        // Remover tags HTML
        let sanitized = text.replace(/<[^>]*>/g, '');

        // Escapar caracteres especiales
        sanitized = sanitized
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');

        // Remover caracteres de control
        sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

        return sanitized.trim();
    }

    /**
     * Calcula la profundidad de un objeto
     * @private
     */
    _getObjectDepth(obj, depth = 0) {
        if (typeof obj !== 'object' || obj === null) {
            return depth;
        }

        const depths = Object.values(obj).map(value => this._getObjectDepth(value, depth + 1));
        return Math.max(depth, ...depths);
    }

    /**
     * Valida un mensaje completo de WhatsApp
     * @param {Object} message - Mensaje de WhatsApp
     * @returns {{valid: boolean, sanitized: Object, errors: string[]}}
     */
    validateWhatsAppMessage(message) {
        const errors = [];

        if (!message || typeof message !== 'object') {
            return { valid: false, sanitized: null, errors: ['Mensaje inválido'] };
        }

        const sanitized = { ...message };

        // Validar from
        if (message.from) {
            const phoneValidation = this.validatePhoneNumber(message.from);
            if (!phoneValidation.valid) {
                errors.push(...phoneValidation.errors.map(e => `From: ${e}`));
            }
            sanitized.from = phoneValidation.sanitized;
        }

        // Validar text body
        if (message.type === 'text' && message.text && message.text.body) {
            const textValidation = this.validateText(message.text.body);
            if (textValidation.suspicious) {
                errors.push('Mensaje de texto contiene patrones sospechosos');
            }
            sanitized.text = { body: textValidation.sanitized };
        }

        // Validar estructura JSON
        const jsonValidation = this.validateJSON(message);
        if (!jsonValidation.valid) {
            errors.push(...jsonValidation.errors);
        }

        return {
            valid: errors.length === 0,
            sanitized,
            errors,
            suspicious: errors.some(e => e.includes('sospechoso'))
        };
    }
}

module.exports = InputValidator;