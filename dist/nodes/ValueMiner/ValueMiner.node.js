"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValueMiner = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const index_1 = require("./resources/node/index");
class ValueMiner {
    constructor() {
        this.description = {
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
            inputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
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
                ...index_1.nodeOperations,
                ...index_1.nodeFields,
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        const credentials = await this.getCredentials('valueMinerApi');
        const apiToken = credentials.apiToken;
        const baHeader = credentials.baHeader;
        for (let i = 0; i < items.length; i++) {
            const resource = this.getNodeParameter('resource', i);
            const operation = this.getNodeParameter('operation', i);
            if (resource === 'node') {
                if (operation === 'read') {
                    const content = this.getNodeParameter('content', i, '');
                    const nodeId = this.getNodeParameter('nodeId', i, 0);
                    const payload = {};
                    if (content)
                        payload.content = content;
                    if (nodeId)
                        payload.nodeId = nodeId;
                    const response = await this.helpers.httpRequest({
                        method: 'POST',
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
exports.ValueMiner = ValueMiner;
//# sourceMappingURL=ValueMiner.node.js.map