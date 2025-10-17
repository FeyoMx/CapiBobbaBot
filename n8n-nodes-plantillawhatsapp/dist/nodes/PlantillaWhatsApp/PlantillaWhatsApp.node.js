"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlantillaWhatsApp = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class PlantillaWhatsApp {
    constructor() {
        this.description = {
            displayName: 'WhatsApp Template Sender',
            name: 'plantillaWhatsApp',
            icon: 'file:plantilawhatsapp.png',
            group: ['transform'],
            version: 1,
            description: 'Sends a WhatsApp template message',
            defaults: {
                name: 'WhatsApp Template Sender',
            },
            inputs: ['main'],
            outputs: ['main'],
            credentials: [
                {
                    name: 'whatsAppApi',
                    required: true,
                },
            ],
            properties: [
                {
                    displayName: 'Phone Number',
                    name: 'phoneNumber',
                    type: 'string',
                    default: '',
                    placeholder: '1234567890',
                    description: 'The phone number to send the message to',
                },
                {
                    displayName: 'Template Name',
                    name: 'templateName',
                    type: 'string',
                    default: '',
                    required: true,
                    description: 'The name of the WhatsApp template to send',
                },
                {
                    displayName: 'Language Code',
                    name: 'languageCode',
                    type: 'string',
                    default: 'es_MX',
                    description: 'The language code for the template (e.g., es_MX, en_US)',
                },
                {
                    displayName: 'Header Type',
                    name: 'headerType',
                    type: 'options',
                    options: [
                        { name: 'None', value: 'none' },
                        { name: 'Text', value: 'text' },
                        { name: 'Image', value: 'image' },
                        { name: 'Video', value: 'video' },
                        { name: 'Document', value: 'document' },
                    ],
                    default: 'none',
                    description: 'Type of content for the template header',
                },
                {
                    displayName: 'Header Text',
                    name: 'headerText',
                    type: 'string',
                    default: '',
                    displayOptions: {
                        show: {
                            headerType: ['text'],
                        },
                    },
                    description: 'Text content for the header',
                },
                {
                    displayName: 'Header Media Link',
                    name: 'headerMediaLink',
                    type: 'string',
                    default: '',
                    displayOptions: {
                        show: {
                            headerType: ['image', 'video', 'document'],
                        },
                    },
                    description: 'URL of the media file for the header (image, video, or document)',
                },
                {
                    displayName: 'Body Parameters',
                    name: 'bodyParameters',
                    type: 'fixedCollection',
                    typeOptions: {
                        multipleValues: true,
                    },
                    description: 'Parameters for the template body',
                    placeholder: 'Add Parameter',
                    default: {},
                    options: [
                        {
                            name: 'parameter',
                            displayName: 'Parameter',
                            values: [
                                {
                                    displayName: 'Type',
                                    name: 'type',
                                    type: 'options',
                                    options: [
                                        { name: 'Text', value: 'text' },
                                    ],
                                    default: 'text',
                                    description: 'Type of the parameter',
                                },
                                {
                                    displayName: 'Value',
                                    name: 'value',
                                    type: 'string',
                                    default: '',
                                    description: 'Value of the parameter',
                                },
                            ],
                        },
                    ],
                },
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            try {
                const phoneNumber = this.getNodeParameter('phoneNumber', i, '');
                const templateName = this.getNodeParameter('templateName', i, '');
                const languageCode = this.getNodeParameter('languageCode', i, 'es_MX');
                const headerType = this.getNodeParameter('headerType', i, 'none');
                const headerText = this.getNodeParameter('headerText', i, '');
                const headerMediaLink = this.getNodeParameter('headerMediaLink', i, '');
                const bodyParameters = this.getNodeParameter('bodyParameters', i, []);
                let credentials;
                try {
                    credentials = await this.getCredentials('whatsAppApi');
                }
                catch (error) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Failed to get credentials: ${error.message}`);
                }
                const accessToken = credentials.accessToken;
                const phoneNumberId = credentials.phoneNumberId;
                if (!accessToken || !phoneNumberId) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `WhatsApp API credentials are not configured correctly. AccessToken: ${accessToken ? 'SET' : 'MISSING'}, PhoneNumberId: ${phoneNumberId ? 'SET' : 'MISSING'}`);
                }
                const components = [];
                // Add header component if type is not 'none'
                if (headerType !== 'none') {
                    const headerComponent = {
                        type: 'header',
                        parameters: [],
                    };
                    if (headerType === 'text') {
                        headerComponent.parameters.push({
                            type: 'text',
                            text: headerText,
                        });
                    }
                    else if (['image', 'video', 'document'].includes(headerType)) {
                        headerComponent.parameters.push({
                            type: headerType,
                            [headerType]: {
                                link: headerMediaLink,
                            },
                        });
                    }
                    components.push(headerComponent);
                }
                // Add body component with parameters
                if (bodyParameters.length > 0) {
                    const bodyComponent = {
                        type: 'body',
                        parameters: [],
                    };
                    for (const param of bodyParameters) {
                        bodyComponent.parameters.push({
                            type: param.parameter[0].type,
                            text: param.parameter[0].value,
                        });
                    }
                    components.push(bodyComponent);
                }
                const data = {
                    "messaging_product": "whatsapp",
                    "to": phoneNumber,
                    "type": "template",
                    "template": {
                        "name": templateName,
                        "language": {
                            "code": languageCode
                        },
                        "components": components,
                    }
                };
                const options = {
                    method: 'POST',
                    uri: `https://graph.facebook.com/v24.0/${phoneNumberId}/marketing_messages`,
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: data,
                    json: true,
                };
                const responseData = await this.helpers.request(options);
                returnData.push({ json: responseData });
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({ json: { error: error.message } });
                    continue;
                }
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), error);
            }
        }
        return [returnData];
    }
}
exports.PlantillaWhatsApp = PlantillaWhatsApp;
//# sourceMappingURL=PlantillaWhatsApp.node.js.map