#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

// When bundled, components.json will be in ../assets/mcp/ relative to the binary
// But for local dev it's in the same folder as scan.ts
const LOCAL_DATA = path.join(__dirname, 'components.json');
const BUNDLED_DATA = path.join(__dirname, '../assets/mcp/components.json');
const DATA_FILE = fs.existsSync(LOCAL_DATA) ? LOCAL_DATA : BUNDLED_DATA;

interface ComponentData {
  name: string;
  selector: string;
  path: string;
  description?: string;
  inputs: { name: string; type: string; description?: string; defaultValue?: string; options?: string[] }[];
  outputs: { name: string; type: string; description?: string }[];
  methods: { name: string; parameters: string; returnType: string; description?: string }[];
  cssVariables: { name: string; defaultValue?: string; description?: string }[];
  examples: {
    name: string;
    html: string;
    ts: string;
  }[];
}

function loadData(): ComponentData[] {
  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

const server = new Server(
  {
    name: 'ship-ui-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  }
);

/**
 * Resources: Each component is a resource.
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const components = loadData();
  return {
    resources: components.map((c) => ({
      uri: `ship-ui://components/${c.selector}`,
      name: c.name,
      description: `ShipUI Component: ${c.selector}`,
      mimeType: 'application/json',
    })),
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const components = loadData();
  const uri = new URL(request.params.uri);
  const selector = uri.pathname.split('/').pop();
  const component = components.find((c) => c.selector === selector);

  if (!component) {
    throw new Error(`Component ${selector} not found`);
  }

  return {
    contents: [
      {
        uri: request.params.uri,
        mimeType: 'application/json',
        text: JSON.stringify(component, null, 2),
      },
    ],
  };
});

/**
 * Tools: SEARCH and GET_USAGE
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_components',
        description: 'Search for ShipUI components by name or selector',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_component_details',
        description: 'Get full details of a component including examples and css variables',
        inputSchema: {
          type: 'object',
          properties: {
            selector: { type: 'string', description: 'Component selector (e.g. sh-button)' },
          },
          required: ['selector'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const components = loadData();
  const { name, arguments: args } = request.params;

  if (name === 'search_components') {
    const { query } = args as { query: string };
    const results = components.filter(
      (c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) || c.selector.toLowerCase().includes(query.toLowerCase())
    );
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            results.map((c) => ({ name: c.name, selector: c.selector, description: c.description?.split('\n')[0] })),
            null,
            2
          ),
        },
      ],
    };
  }

  if (name === 'get_component_details') {
    const { selector } = args as { selector: string };
    const component = components.find((c) => c.selector === selector);
    if (!component) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Component ${selector} not found` }],
      };
    }
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(component, null, 2),
        },
      ],
    };
  }

  throw new Error(`Tool ${name} not found`);
});

/**
 * Prompts: Code generation helper
 */
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'use_component',
        description: 'Generate code for using a specific ShipUI component',
        arguments: [
          {
            name: 'selector',
            description: 'The selector of the component to use',
            required: true,
          },
          {
            name: 'context',
            description: 'What are you trying to build?',
            required: false,
          },
        ],
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const components = loadData();
  const { name, arguments: args } = request.params;

  if (name === 'use_component') {
    const selector = args?.selector;
    const context = args?.context || 'a new feature';
    const component = components.find((c) => c.selector === selector);

    if (!component) {
      throw new Error(`Component ${selector} not found`);
    }

    const example = component.examples[0] || { html: '<!-- No example available -->', ts: '// No example available' };

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `I want to use the ${component.name} component (${component.selector}) in ${context}. 
Here are the component details:

Description:
${component.description || 'No description available'}

Inputs:
${component.inputs
  .map(
    (i) =>
      `- ${i.name} (${i.type})${i.defaultValue ? ` (default: ${i.defaultValue})` : ''}${
        i.options ? ` [options: ${i.options.join(', ')}]` : ''
      }${i.description ? `: ${i.description}` : ''}`
  )
  .join('\n')}

Outputs:
${component.outputs.map((o) => `- ${o.name} (${o.type})${o.description ? `: ${o.description}` : ''}`).join('\n')}

CSS Variables:
${component.cssVariables.map((v) => `- ${v.name}${v.defaultValue ? ` (default: ${v.defaultValue})` : ''}`).join('\n')}

Methods:
${
  component.methods
    ?.map((m) => `- ${m.name}(${m.parameters}): ${m.returnType}${m.description ? `: ${m.description}` : ''}`)
    .join('\n') || 'None'
}

Example HTML:
\`\`\`html
${example.html}
\`\`\`

Example TS:
\`\`\`typescript
${example.ts}
\`\`\`

Please help me implement this in my project.`,
          },
        },
      ],
    };
  }

  throw new Error(`Prompt ${name} not found`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('ShipUI MCP Server running on stdio');
