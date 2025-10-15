import {
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class WhatsAppApi implements ICredentialType {
  name = 'whatsAppApi';
  displayName = 'WhatsApp API';
  documentationUrl = 'https://developers.facebook.com/docs/whatsapp/cloud-api';
  properties: INodeProperties[] = [
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
