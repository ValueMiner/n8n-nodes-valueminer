import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class ValueMinerApi implements ICredentialType {
	name = 'valueMinerApi';
	displayName = 'ValueMiner API';
	documentationUrl = 'https://valueminer.eu';
	properties: INodeProperties[] = [
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Your ValueMiner API access token',
		},
		{
			displayName: 'BA Header',
			name: 'baHeader',
			type: 'string',
			default: '757',
			required: true,
			description: 'Your ValueMiner BA identifier',
		},
	];
}
