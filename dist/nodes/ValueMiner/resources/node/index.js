"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodeFields = exports.nodeOperations = void 0;
exports.nodeOperations = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['tool'],
            },
        },
        options: [
            {
                name: 'Call Tool',
                value: 'callTool',
                description: 'Run a ValueMiner MCP tool',
                action: 'Call a tool',
            },
            {
                name: 'List Tools',
                value: 'listTools',
                description: 'List available ValueMiner MCP tools',
                action: 'List tools',
            },
        ],
        default: 'callTool',
    },
];
exports.nodeFields = [
    {
        displayName: 'Tool',
        name: 'toolName',
        type: 'resourceLocator',
        default: { mode: 'list', value: '' },
        required: true,
        displayOptions: {
            show: {
                resource: ['tool'],
                operation: ['callTool'],
            },
        },
        description: 'ValueMiner MCP tool to call',
        modes: [
            {
                displayName: 'From List',
                name: 'list',
                type: 'list',
                typeOptions: {
                    searchListMethod: 'getTools',
                    searchable: true,
                },
            },
            {
                displayName: 'By Name',
                name: 'id',
                type: 'string',
                placeholder: 'search_companies',
            },
        ],
    },
    {
        displayName: 'Arguments',
        name: 'arguments',
        type: 'json',
        default: '{}',
        displayOptions: {
            show: {
                resource: ['tool'],
                operation: ['callTool'],
            },
        },
        description: 'JSON object to send as the MCP tool arguments',
    },
];
//# sourceMappingURL=index.js.map