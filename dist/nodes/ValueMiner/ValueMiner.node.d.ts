import { type INodeType, type INodeTypeDescription, type IExecuteFunctions, type INodeExecutionData } from 'n8n-workflow';
export declare class ValueMiner implements INodeType {
    description: INodeTypeDescription;
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
