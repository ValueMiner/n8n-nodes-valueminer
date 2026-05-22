import {
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
	type IAllExecuteFunctions,
	type IDataObject,
	type IExecuteFunctions,
	type ILoadOptionsFunctions,
	type INodeExecutionData,
	type INodeListSearchResult,
	type INodeParameterResourceLocator,
	type INodeType,
	type INodeTypeDescription,
	type JsonObject,
} from 'n8n-workflow';
import { nodeOperations, nodeFields } from './resources/node/index';

type ValueMinerCredentials = {
	mcpEndpointUrl: string;
};

type McpTool = {
	name: string;
	description?: string;
	inputSchema?: IDataObject;
};

type McpResponse = {
	jsonrpc?: string;
	id?: string | number;
	result?: IDataObject;
	error?: {
		code?: number;
		message?: string;
		data?: unknown;
	};
};

type McpFullResponse = {
	body?: unknown;
	headers?: IDataObject;
};

type ValueMinerFunctions = IExecuteFunctions | ILoadOptionsFunctions;

function normalizeMcpUrl(credentials: ValueMinerCredentials): string {
	return credentials.mcpEndpointUrl.replace(/\/+$/, '');
}

function parseMcpResponse(context: ValueMinerFunctions, response: unknown): McpResponse {
	if (
		typeof response === 'object' &&
		response !== null &&
		Object.prototype.hasOwnProperty.call(response, 'body')
	) {
		return parseMcpResponse(context, (response as McpFullResponse).body);
	}

	if (typeof response !== 'string') {
		return response as McpResponse;
	}

	const trimmed = response.trim();
	if (!trimmed.startsWith('event:') && !trimmed.startsWith('data:')) {
		return JSON.parse(trimmed) as McpResponse;
	}

	const dataLine = trimmed
		.split('\n')
		.map((line) => line.trim())
		.find((line) => line.startsWith('data:'));

	if (!dataLine) {
		throw new NodeOperationError(
			context.getNode(),
			'ValueMiner MCP endpoint returned an empty event stream response',
		);
	}

	return JSON.parse(dataLine.slice('data:'.length).trim()) as McpResponse;
}

function getSessionId(headers: IDataObject | undefined): string | undefined {
	if (!headers) {
		return undefined;
	}

	const header = Object.entries(headers).find(([key]) => key.toLowerCase() === 'mcp-session-id');

	return typeof header?.[1] === 'string' ? header[1] : undefined;
}

function getMcpHeaders(sessionId?: string): IDataObject {
	return {
		Accept: 'application/json, text/event-stream',
		'Content-Type': 'application/json',
		'MCP-Protocol-Version': '2025-06-18',
		...(sessionId ? { 'Mcp-Session-Id': sessionId } : {}),
	};
}

async function requestMcp(
	context: ValueMinerFunctions,
	method: string,
	params: IDataObject = {},
	sessionId?: string,
): Promise<unknown> {
	const credentials = await context.getCredentials<ValueMinerCredentials>('valueMinerApi');

	return await context.helpers.httpRequestWithAuthentication.call(
		context as IAllExecuteFunctions,
		'valueMinerApi',
		{
			method: 'POST',
			url: normalizeMcpUrl(credentials),
			headers: getMcpHeaders(sessionId),
			body: {
				jsonrpc: '2.0',
				id: `n8n-${Date.now()}`,
				method,
				params,
			},
			json: true,
		},
	);
}

async function notifyMcpInitialized(
	context: ValueMinerFunctions,
	sessionId: string | undefined,
): Promise<void> {
	try {
		const credentials = await context.getCredentials<ValueMinerCredentials>('valueMinerApi');

		await context.helpers.httpRequestWithAuthentication.call(
			context as IAllExecuteFunctions,
			'valueMinerApi',
			{
				method: 'POST',
				url: normalizeMcpUrl(credentials),
				headers: getMcpHeaders(sessionId),
				body: {
					jsonrpc: '2.0',
					method: 'notifications/initialized',
					params: {},
				},
				json: true,
			},
		);
	} catch {
		// Some MCP HTTP transports acknowledge notifications without a JSON response.
	}
}

async function initializeMcp(context: ValueMinerFunctions): Promise<string | undefined> {
	const response = await context.helpers.httpRequestWithAuthentication.call(
		context as IAllExecuteFunctions,
		'valueMinerApi',
		{
			method: 'POST',
			url: normalizeMcpUrl(await context.getCredentials<ValueMinerCredentials>('valueMinerApi')),
			headers: getMcpHeaders(),
			body: {
				jsonrpc: '2.0',
				id: `n8n-${Date.now()}`,
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
			returnFullResponse: true,
		},
	);

	const fullResponse = response as McpFullResponse;
	const initializeResponse = parseMcpResponse(context, response);

	if (initializeResponse.error) {
		throw new NodeOperationError(
			context.getNode(),
			initializeResponse.error.message ?? 'Could not initialize ValueMiner MCP session',
			{
				description: JSON.stringify(initializeResponse.error),
			},
		);
	}

	const sessionId = getSessionId(fullResponse.headers);
	await notifyMcpInitialized(context, sessionId);

	return sessionId;
}

async function callMcp(
	context: ValueMinerFunctions,
	method: string,
	params: IDataObject = {},
): Promise<McpResponse> {
	const sessionId = await initializeMcp(context);
	const response = await requestMcp(context, method, params, sessionId);

	return parseMcpResponse(context, response);
}

async function getValueMinerTools(context: ValueMinerFunctions): Promise<McpTool[]> {
	const response = await callMcp(context, 'tools/list');

	if (response.error) {
		throw new NodeOperationError(context.getNode(), response.error.message ?? 'Could not list tools', {
			description: JSON.stringify(response.error),
		});
	}

	const tools = response.result?.tools;

	if (!Array.isArray(tools)) {
		return [];
	}

	return tools.filter((tool): tool is McpTool => {
		return typeof tool === 'object' && tool !== null && typeof (tool as McpTool).name === 'string';
	});
}

function getToolName(tool: INodeParameterResourceLocator | string): string {
	if (typeof tool === 'string') {
		return tool;
	}

	return String(tool.value);
}

function parseArguments(
	context: IExecuteFunctions,
	rawArguments: IDataObject | string,
	itemIndex: number,
): IDataObject {
	if (typeof rawArguments !== 'string') {
		return rawArguments;
	}

	const trimmedArguments = rawArguments.trim();

	if (!trimmedArguments) {
		return {};
	}

	const parsedArguments = JSON.parse(trimmedArguments) as unknown;

	if (
		typeof parsedArguments !== 'object' ||
		parsedArguments === null ||
		Array.isArray(parsedArguments)
	) {
		throw new NodeOperationError(context.getNode(), 'Arguments must be a JSON object', { itemIndex });
	}

	return parsedArguments as IDataObject;
}

export class ValueMiner implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ValueMiner',
		name: 'valueMiner',
		icon: 'file:../../icons/valueminer.svg',
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"] === "callTool" ? "Call: " + $parameter["toolName"]?.value : "List Tools"}}',
		description: 'Run ValueMiner MCP tools in n8n workflows',
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
			baseURL: 'https://ai.develop-hetzner.valueminer.eu',
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
						name: 'Tool',
						value: 'tool',
					},
				],
				default: 'tool',
			},
			...nodeOperations,
			...nodeFields,
		],
	};

	methods = {
		listSearch: {
			async getTools(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult> {
				const tools = await getValueMinerTools(this);
				const normalizedFilter = filter?.toLowerCase() ?? '';

				return {
					results: tools
						.filter((tool) => {
							if (!normalizedFilter) {
								return true;
							}

							return (
								tool.name.toLowerCase().includes(normalizedFilter) ||
								tool.description?.toLowerCase().includes(normalizedFilter)
							);
						})
						.map((tool) => ({
							name: tool.name,
							value: tool.name,
							description: tool.description,
						})),
				};
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				if (resource === 'tool' && operation === 'listTools') {
					const tools = await getValueMinerTools(this);

					for (const tool of tools) {
						returnData.push({
							json: tool as IDataObject,
							pairedItem: { item: i },
						});
					}

					continue;
				}

				if (resource === 'tool' && operation === 'callTool') {
					const tool = this.getNodeParameter('toolName', i) as INodeParameterResourceLocator;
					const rawArguments = this.getNodeParameter('arguments', i, '{}') as IDataObject | string;
					const toolName = getToolName(tool);
					const response = await callMcp(this, 'tools/call', {
						name: toolName,
						arguments: parseArguments(this, rawArguments, i),
					});

					if (response.error) {
						throw new NodeOperationError(this.getNode(), response.error.message ?? 'MCP tool failed', {
							description: JSON.stringify(response.error),
							itemIndex: i,
						});
					}

					returnData.push({
						json: {
							tool: toolName,
							result: response.result,
						},
						pairedItem: { item: i },
					});

					continue;
				}

				throw new NodeOperationError(this.getNode(), `Unsupported operation: ${operation}`, {
					itemIndex: i,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : String(error),
						},
						pairedItem: { item: i },
					});
					continue;
				}

				if (error instanceof NodeOperationError) {
					throw new NodeOperationError(this.getNode(), error.message, { itemIndex: i });
				}

				const errorResponse: JsonObject =
					error instanceof Error ? { message: error.message } : { message: String(error) };

				throw new NodeApiError(this.getNode(), errorResponse, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
