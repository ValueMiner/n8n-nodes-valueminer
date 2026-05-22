import { type IExecuteFunctions, type ILoadOptionsFunctions, type INodeExecutionData, type INodeListSearchResult, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
export declare class ValueMiner implements INodeType {
    description: INodeTypeDescription;
    methods: {
        listSearch: {
            getTools(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult>;
        };
    };
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
