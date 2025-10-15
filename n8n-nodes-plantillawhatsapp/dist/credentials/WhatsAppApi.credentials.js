"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppApi = void 0;
class WhatsAppApi {
    constructor() {
        this.name = 'whatsAppApi';
        this.displayName = 'WhatsApp API';
        this.documentationUrl = 'https://developers.facebook.com/docs/whatsapp/cloud-api';
        this.properties = [
            {
                displayName: 'Access Token',
                name: 'accessToken',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                required: true,
                description: 'The access token for WhatsApp Business API',
            },
            {
                displayName: 'Phone Number ID',
                name: 'phoneNumberId',
                type: 'string',
                default: '',
                required: true,
                description: 'The phone number ID from WhatsApp Business account',
            },
        ];
    }
}
exports.WhatsAppApi = WhatsAppApi;
//# sourceMappingURL=WhatsAppApi.credentials.js.map