"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValueMinerApi = void 0;
class ValueMinerApi {
    constructor() {
        this.name = 'valueMinerApi';
        this.displayName = 'ValueMiner API';
        this.documentationUrl = 'https://valueminer.eu';
        this.properties = [
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
}
exports.ValueMinerApi = ValueMinerApi;
//# sourceMappingURL=ValueMinerApi.credentials.js.map