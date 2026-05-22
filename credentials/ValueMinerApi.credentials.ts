import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ValueMinerApi implements ICredentialType {
	name = 'valueMinerApi';
	displayName = 'ValueMiner API';
	icon = 'file:../icons/valueminer.svg' as const;
	documentationUrl = 'https://valueminer.eu';
	properties: INodeProperties[] = [
		{
			displayName: 'MCP Endpoint URL',
			name: 'mcpEndpointUrl',
			type: 'string',
			default: 'https://ai.develop-hetzner.valueminer.eu/mcp/ba/757',
			required: true,
			description: 'Full URL for the ValueMiner MCP HTTP endpoint',
		},
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

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiToken}}',
				BA: '={{$credentials.baHeader}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			url: '={{$credentials.mcpEndpointUrl}}',
			method: 'POST',
			headers: {
				Accept: 'application/json, text/event-stream',
				'Content-Type': 'application/json',
				'MCP-Protocol-Version': '2025-06-18',
			},
			body: {
				jsonrpc: '2.0',
				id: 'n8n-credential-test',
				method: 'initialize',
				params: {
					protocolVersion: '2025-06-18',
					capabilities: {},
					clientInfo: {
						name: 'n8n-nodes-valueminer',
						version: '0.1.0',
					},
				},
			},
			json: true,
		},
	};
}
