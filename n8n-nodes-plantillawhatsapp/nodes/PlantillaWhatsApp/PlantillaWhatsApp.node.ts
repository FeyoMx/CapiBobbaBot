
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
  IRequestOptions,
} from 'n8n-workflow';

export class PlantillaWhatsApp implements INodeType {
  description: INodeTypeDescription = {
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

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const phoneNumber = this.getNodeParameter('phoneNumber', i, '') as string;
        const templateName = this.getNodeParameter('templateName', i, '') as string;
        const languageCode = this.getNodeParameter('languageCode', i, 'es_MX') as string;
        const headerType = this.getNodeParameter('headerType', i, 'none') as string;
        const headerText = this.getNodeParameter('headerText', i, '') as string;
        const headerMediaLink = this.getNodeParameter('headerMediaLink', i, '') as string;
        const bodyParameters = this.getNodeParameter('bodyParameters', i, []) as { parameter: { type: string; value: string }[] }[];

        let credentials;
        try {
          credentials = await this.getCredentials('whatsAppApi');
        } catch (error) {
          throw new NodeOperationError(
            this.getNode(),
            `Failed to get credentials: ${(error as Error).message}`,
          );
        }

        const accessToken = credentials.accessToken as string;
        const phoneNumberId = credentials.phoneNumberId as string;

        if (!accessToken || !phoneNumberId) {
          throw new NodeOperationError(
            this.getNode(),
            `WhatsApp API credentials are not configured correctly. AccessToken: ${accessToken ? 'SET' : 'MISSING'}, PhoneNumberId: ${phoneNumberId ? 'SET' : 'MISSING'}`,
          );
        }

        const components: any[] = [];

        // Add header component if type is not 'none'
        if (headerType !== 'none') {
          const headerComponent: any = {
            type: 'header',
            parameters: [],
          };
          if (headerType === 'text') {
            headerComponent.parameters.push({
              type: 'text',
              text: headerText,
            });
          } else if (['image', 'video', 'document'].includes(headerType)) {
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
          const bodyComponent: any = {
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

        const options: IRequestOptions = {
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
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({ json: { error: (error as Error).message } });
          continue;
        }
        throw new NodeOperationError(this.getNode(), error as Error);
      }
    }

    return [returnData];
  }
}
