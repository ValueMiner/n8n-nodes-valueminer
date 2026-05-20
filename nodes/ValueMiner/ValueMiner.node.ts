import { NodeConnectionTypes, type INodeType, type INodeTypeDescription, type IExecuteFunctions, type INodeExecutionData, type IHttpRequestMethods } from 'n8n-workflow';
import { nodeOperations, nodeFields } from './resources/node/index';

export class ValueMiner implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ValueMiner',
		name: 'valueMiner',
		icon: 'file:../../icons/valueminer.svg',
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the ValueMiner API',
		defaults: {
			name: 'ValueMiner',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'valueMinerApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://rag.valueminer.ai:8310',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Node',
						value: 'node',
					},
				],
				default: 'node',
			},
			...nodeOperations,
			...nodeFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('valueMinerApi');
		const apiToken = credentials.apiToken as string;
		const baHeader = credentials.baHeader as string;

		for (let i = 0; i < items.length; i++) {
			const resource = this.getNodeParameter('resource', i) as string;
			const operation = this.getNodeParameter('operation', i) as string;

			if (resource === 'node') {
				if (operation === 'read') {
					const content = this.getNodeParameter('content', i, '') as string;
					const nodeId = this.getNodeParameter('nodeId', i, 0) as number;

					const payload: Record<string, unknown> = {};
					if (content) payload.content = content;
					if (nodeId) payload.nodeId = nodeId;

					const response = await this.helpers.httpRequest({
						method: 'POST' as IHttpRequestMethods,
						url: 'https://rag.valueminer.ai:8310/api/v6/nodes/read',
						headers: {
							Authorization: `Bearer ${apiToken}`,
							BA: baHeader,
							'Content-Type': 'application/json',
						},
						body: payload,
						json: true,
					});

					returnData.push({ json: response });
				}
			}
		}

		return [returnData];
	}
}