import type { INodeProperties } from 'n8n-workflow';

export const nodeOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['node'],
			},
		},
		options: [
			{
				name: 'Read',
				value: 'read',
				description: 'Read ValueMiner nodes',
				action: 'Read a node',
			},
		],
		default: 'read',
	},
];

export const nodeFields: INodeProperties[] = [
	// ── Read ──────────────────────────────────────────────────────────────
	{
		displayName: 'Content',
		name: 'content',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['node'],
				operation: ['read'],
			},
		},
		description: 'Content to search or filter nodes by',
	},
	{
		displayName: 'Node ID',
		name: 'nodeId',
		type: 'number',
		default: 0,
		displayOptions: {
			show: {
				resource: ['node'],
				operation: ['read'],
			},
		},
		description: 'ID of the node to retrieve',
	},
];
