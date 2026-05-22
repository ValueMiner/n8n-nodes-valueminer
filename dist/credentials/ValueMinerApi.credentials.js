"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValueMinerApi = void 0;
class ValueMinerApi {
    constructor() {
        this.name = 'valueMinerApi';
        this.displayName = 'ValueMiner API';
        this.icon = 'file:../icons/valueminer-logo.svg';
        this.documentationUrl = 'https://valueminer.eu';
        this.properties = [
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
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    Authorization: '=Bearer {{$credentials.apiToken}}',
                    BA: '={{$credentials.baHeader}}',
                },
            },
        };
        this.test = {
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
}
exports.ValueMinerApi = ValueMinerApi;
//# sourceMappingURL=ValueMinerApi.credentials.js.map