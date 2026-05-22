"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValueMiner = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const index_1 = require("./resources/node/index");
function normalizeMcpUrl(credentials) {
    return credentials.mcpEndpointUrl.replace(/\/+$/, '');
}
function parseMcpResponse(context, response) {
    if (typeof response === 'object' &&
        response !== null &&
        Object.prototype.hasOwnProperty.call(response, 'body')) {
        return parseMcpResponse(context, response.body);
    }
    if (typeof response !== 'string') {
        return response;
    }
    const trimmed = response.trim();
    if (!trimmed.startsWith('event:') && !trimmed.startsWith('data:')) {
        return JSON.parse(trimmed);
    }
    const dataLine = trimmed
        .split('\n')
        .map((line) => line.trim())
        .find((line) => line.startsWith('data:'));
    if (!dataLine) {
        throw new n8n_workflow_1.NodeOperationError(context.getNode(), 'ValueMiner MCP endpoint returned an empty event stream response');
    }
    return JSON.parse(dataLine.slice('data:'.length).trim());
}
function getSessionId(headers) {
    if (!headers) {
        return undefined;
    }
    const header = Object.entries(headers).find(([key]) => key.toLowerCase() === 'mcp-session-id');
    return typeof (header === null || header === void 0 ? void 0 : header[1]) === 'string' ? header[1] : undefined;
}
function getMcpHeaders(sessionId) {
    return {
        Accept: 'application/json, text/event-stream',
        'Content-Type': 'application/json',
        'MCP-Protocol-Version': '2025-06-18',
        ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {}),
    };
}
async function requestMcp(context, method, params = {}, sessionId) {
    const credentials = await context.getCredentials('valueMinerApi');
    return await context.helpers.httpRequestWithAuthentication.call(context, 'valueMinerApi', {
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
    });
}
async function notifyMcpInitialized(context, sessionId) {
    try {
        const credentials = await context.getCredentials('valueMinerApi');
        await context.helpers.httpRequestWithAuthentication.call(context, 'valueMinerApi', {
            method: 'POST',
            url: normalizeMcpUrl(credentials),
            headers: getMcpHeaders(sessionId),
            body: {
                jsonrpc: '2.0',
                method: 'notifications/initialized',
                params: {},
            },
            json: true,
        });
    }
    catch {
    }
}
async function initializeMcp(context) {
    var _a;
    const response = await context.helpers.httpRequestWithAuthentication.call(context, 'valueMinerApi', {
        method: 'POST',
        url: normalizeMcpUrl(await context.getCredentials('valueMinerApi')),
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
    });
    const fullResponse = response;
    const initializeResponse = parseMcpResponse(context, response);
    if (initializeResponse.error) {
        throw new n8n_workflow_1.NodeOperationError(context.getNode(), (_a = initializeResponse.error.message) !== null && _a !== void 0 ? _a : 'Could not initialize ValueMiner MCP session', {
            description: JSON.stringify(initializeResponse.error),
        });
    }
    const sessionId = getSessionId(fullResponse.headers);
    await notifyMcpInitialized(context, sessionId);
    return sessionId;
}
async function callMcp(context, method, params = {}) {
    const sessionId = await initializeMcp(context);
    const response = await requestMcp(context, method, params, sessionId);
    return parseMcpResponse(context, response);
}
async function getValueMinerTools(context) {
    var _a, _b;
    const response = await callMcp(context, 'tools/list');
    if (response.error) {
        throw new n8n_workflow_1.NodeOperationError(context.getNode(), (_a = response.error.message) !== null && _a !== void 0 ? _a : 'Could not list tools', {
            description: JSON.stringify(response.error),
        });
    }
    const tools = (_b = response.result) === null || _b === void 0 ? void 0 : _b.tools;
    if (!Array.isArray(tools)) {
        return [];
    }
    return tools.filter((tool) => {
        return typeof tool === 'object' && tool !== null && typeof tool.name === 'string';
    });
}
function getToolName(tool) {
    if (typeof tool === 'string') {
        return tool;
    }
    return String(tool.value);
}
function parseArguments(context, rawArguments, itemIndex) {
    if (typeof rawArguments !== 'string') {
        return rawArguments;
    }
    const trimmedArguments = rawArguments.trim();
    if (!trimmedArguments) {
        return {};
    }
    const parsedArguments = JSON.parse(trimmedArguments);
    if (typeof parsedArguments !== 'object' ||
        parsedArguments === null ||
        Array.isArray(parsedArguments)) {
        throw new n8n_workflow_1.NodeOperationError(context.getNode(), 'Arguments must be a JSON object', { itemIndex });
    }
    return parsedArguments;
}
class ValueMiner {
    constructor() {
        this.description = {
            displayName: 'ValueMiner',
            name: 'valueMiner',
            icon: 'file:../../icons/valueminer-logo.svg',
            group: ['input'],
            version: 1,
            subtitle: '={{$parameter["operation"] === "callTool" ? "Call: " + $parameter["toolName"]?.value : "List Tools"}}',
            description: 'Run ValueMiner MCP tools in n8n workflows',
            defaults: {
                name: 'ValueMiner',
            },
            usableAsTool: true,
            inputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
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
                ...index_1.nodeOperations,
                ...index_1.nodeFields,
            ],
        };
        this.methods = {
            listSearch: {
                async getTools(filter) {
                    var _a;
                    const tools = await getValueMinerTools(this);
                    const normalizedFilter = (_a = filter === null || filter === void 0 ? void 0 : filter.toLowerCase()) !== null && _a !== void 0 ? _a : '';
                    return {
                        results: tools
                            .filter((tool) => {
                            var _a;
                            if (!normalizedFilter) {
                                return true;
                            }
                            return (tool.name.toLowerCase().includes(normalizedFilter) ||
                                ((_a = tool.description) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(normalizedFilter)));
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
    }
    async execute() {
        var _a;
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            try {
                const resource = this.getNodeParameter('resource', i);
                const operation = this.getNodeParameter('operation', i);
                if (resource === 'tool' && operation === 'listTools') {
                    const tools = await getValueMinerTools(this);
                    for (const tool of tools) {
                        returnData.push({
                            json: tool,
                            pairedItem: { item: i },
                        });
                    }
                    continue;
                }
                if (resource === 'tool' && operation === 'callTool') {
                    const tool = this.getNodeParameter('toolName', i);
                    const rawArguments = this.getNodeParameter('arguments', i, '{}');
                    const toolName = getToolName(tool);
                    const response = await callMcp(this, 'tools/call', {
                        name: toolName,
                        arguments: parseArguments(this, rawArguments, i),
                    });
                    if (response.error) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), (_a = response.error.message) !== null && _a !== void 0 ? _a : 'MCP tool failed', {
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
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Unsupported operation: ${operation}`, {
                    itemIndex: i,
                });
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            error: error instanceof Error ? error.message : String(error),
                        },
                        pairedItem: { item: i },
                    });
                    continue;
                }
                if (error instanceof n8n_workflow_1.NodeOperationError) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), error.message, { itemIndex: i });
                }
                const errorResponse = error instanceof Error ? { message: error.message } : { message: String(error) };
                throw new n8n_workflow_1.NodeApiError(this.getNode(), errorResponse, { itemIndex: i });
            }
        }
        return [returnData];
    }
}
exports.ValueMiner = ValueMiner;
//# sourceMappingURL=ValueMiner.node.js.map