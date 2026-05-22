# n8n-nodes-valueminer

This is an n8n community node for ValueMiner. It lets you run ValueMiner MCP tools from n8n workflows and use ValueMiner as an AI-agent tool.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

- Tool
    - Call Tool: run a ValueMiner MCP tool with JSON arguments
    - List Tools: return the tools exposed by the ValueMiner MCP endpoint

## Credentials

Create a ValueMiner API credential in n8n and provide:

- MCP Endpoint URL: `https://ai.develop-hetzner.valueminer.eu/mcp/ba/757`
- API Token: your ValueMiner bearer token
- BA Header: your ValueMiner BA identifier

## Compatibility

Compatible with n8n@1.60.0 or later

## Usage

Use **List Tools** to confirm which MCP tools are available for your credential. Use **Call Tool**, select a tool from the list, and provide a JSON object for its arguments.

Example arguments:

```json
{
	"query": "companies using workflow automation",
	"limit": 10
}
```

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [ValueMiner](https://valueminer.eu)
