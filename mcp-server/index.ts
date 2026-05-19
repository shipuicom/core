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
  keywords?: string[];
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
 * Tools: SEARCH, GET_USAGE, SETUP, DESIGN_TOKENS, ABBREVIATIONS, ICONS
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
      {
        name: 'get_setup_instructions',
        description: 'Get step-by-step setup and installation instructions for ShipUI in an Angular 19+ project',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_design_tokens',
        description: 'Get a comprehensive guide on ShipUI design tokens including Radix 1-12 colors, typography, shapes, and utility classes',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_css_variable_abbreviations',
        description: 'Get the complete cheat sheet for minified CSS variables and abbreviations used in ShipUI components (e.g. btn-c-h)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_icon_guide',
        description: 'Get the setup and usage instructions for custom icon subsetting with Phosphor Icons and ship-fg CLI',
        inputSchema: {
          type: 'object',
          properties: {},
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
    const results = components.filter((c) => {
      const q = query.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.selector.toLowerCase().includes(q) ||
        c.keywords?.some((k) => k.toLowerCase().includes(q))
      );
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            results.map((c) => ({
              name: c.name,
              selector: c.selector,
              description: c.description?.split('\n')[0],
              keywords: c.keywords,
            })),
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

  if (name === 'get_setup_instructions') {
    return {
      content: [
        {
          type: 'text',
          text: `# ShipUI Setup & Installation Guide

To integrate ShipUI in your Angular project, you must be using Angular 19 or newer. Follow these steps:

## 1. Install Package
\`\`\`bash
npm i -S @ship-ui/core
\`\`\`

## 2. Import Global Styles
Add this import at the top of your \`src/styles.scss\` (or main styles file):
\`\`\`scss
@use '@ship-ui/core/styles';
\`\`\`

## 3. Configure Assets in angular.json
To enable bundling of default ShipUI fonts and assets, add the assets glob pattern to your project's assets array under \`architect.build.options.assets\` and \`architect.serve.options.assets\`:
\`\`\`json
"assets": [
  "src/assets",
  {
    "glob": "**/*",
    "input": "./node_modules/@ship-ui/core/assets",
    "output": "./ship-ui-assets/"
  }
]
\`\`\`

## 4. Setup Icon Font CLI
Add scripts to \`package.json\` for compilation and watching of the custom Phosphor icon font:
\`\`\`json
"scripts": {
  "gen:font": "ship-fg --src='./src' --out='./src/assets' --rootPath='./'",
  "watch:font": "ship-fg --src='./src' --out='./src/assets' --rootPath='./' --watch",
  "start": "npm run watch:font & ng serve",
  "build": "npm run gen:font & ng build"
}
\`\`\`

Add the generated sheet link inside your \`<head>\` tag in \`index.html\`:
\`\`\`html
<link rel="stylesheet" href="/ship.css" />
\`\`\``,
        },
      ],
    };
  }

  if (name === 'get_design_tokens') {
    return {
      content: [
        {
          type: 'text',
          text: `# ShipUI Design Tokens Guide

ShipUI implements a cohesive, highly customizable design system based on modern CSS properties.

## 1. HSL Color Scale (Radix 1-12 aligned)
ShipUI uses semantic scales from 1 (lightest background / darkest shadow) to 12 (darkest text / solid foreground).
Available palettes: \`--primary-\`, \`--accent-\`, \`--warn-\`, \`--error-\`, \`--success-\`, \`--base-\`.

Example Color CSS Variables:
- \`--primary-1\`: Base app background
- \`--primary-2\`: Subtle background
- \`--primary-3\`: UI element background
- \`--primary-4\`: Hover state background
- \`--primary-5\`: Active state background
- \`--primary-8\`: Brand primary color / solid border
- \`--primary-9\`: Brand hover primary color
- \`--primary-12\`: High contrast text

We also provide gradient scales for backgrounds:
- \`--primary-g2\` / \`--primary-g3\`
- \`--accent-g2\` / \`--accent-g3\`
- \`--warn-g2\` / \`--warn-g3\`
- \`--error-g2\` / \`--error-g3\`
- \`--success-g2\` / \`--success-g3\`
- \`--base-g2\` / \`--base-g3\` / \`--base-g6\` / \`--base-g7\`

## 2. Typography Scale
Custom typography definitions utilizing \`Inter Tight\`:
- \`--display-10\` to \`--display-50\` (Large hero titles)
- \`--title-10\` to \`--title-30B\` (Section headers)
- \`--paragraph-10\` to \`--paragraph-40B\` (Body, labels, and micro-copy)
- \`--code-10\` to \`--code-30\` (Monospace text)

Usage Example:
\`\`\`css
.card-title {
  font: var(--title-30B);
}
\`\`\`

## 3. Shape Scale
Used for rounded borders, scaling using \`--shape-scale\` multiplier (default is \`1\`):
- \`--shape-1\`: 4px border-radius
- \`--shape-2\`: 8px border-radius
- \`--shape-3\`: 12px border-radius
- \`--shape-4\`: 16px border-radius
- \`--shape-5\`: 20px border-radius

## 4. Shadows & Borders
- Shadows: \`--box-shadow-10\` to \`--box-shadow-60\`.
- Borders: \`--border-10\` (thin base color border), \`--border-20\` (medium base color border).

## 5. Global CSS Helper Classes
- \`.spacer\`: Flex-grow spacer helper (\`flex: 1 0;\`).
- \`.sh-primary\`, \`.sh-accent\`, \`.sh-warn\`, \`.sh-error\`, \`.sh-success\`: Semantic text color helpers.`,
        },
      ],
    };
  }

  if (name === 'get_css_variable_abbreviations') {
    return {
      content: [
        {
          type: 'text',
          text: `# CSS Variables Abbreviations Guide

ShipUI minifies all component CSS variables to reduce production bundle size without framework specific parsers.
Variables follow the structural pattern: \`--[component]-[style]-[state]\`.
For example, \`--btn-c-h\` represents \`[button]-[color]-[hover]\`.

## Component Prefix Identifiers
- \`btn\` : Button component
- \`btng\`: Button group
- \`pb\`  : Progress bar
- \`pbt\` : Progress bar track
- \`rs\`  : Range slider
- \`rst\` : Range slider track
- \`po\`  : Popover
- \`radio\`: Radio button
- \`radiod\`: Radio dot / indicator
- \`table\`: Data table
- \`tabs\` : Tabs header/body
- \`toggle\`: Switch toggle
- \`togglek\`: Switch toggle knob
- \`dp\`  : Datepicker / datepicker input
- \`chip\`: Chip component

## Style Property Infixes
- \`bs\` : box-shadow
- \`bg\` : background-color
- \`c\`  : color (text)
- \`br\` : border-radius
- \`bw\` : border-width
- \`b\`  : border
- \`s\`  : shape
- \`si\` : size
- \`ih\` : icon-height
- \`iw\` : icon-width
- \`ic\` : icon-color
- \`ir\` : icon-rotate
- \`h\`  : height
- \`mh\` : max-height
- \`mih\`: min-height
- \`w\`  : width
- \`mw\` : max-width
- \`miw\`: min-width
- \`f\`  : font
- \`d\`  : display
- \`o\`  : opacity
- \`ad\` : animation-duration

## State Suffixes
- \`h\` : hover
- \`a\` : active
- \`d\` : disabled
- \`s\` : selected

## Example Usage
To override button styles on hover, override \`--btn-c-h\`:
\`\`\`css
.my-custom-button {
  --btn-c-h: var(--accent-12);
  --btn-bg-h: var(--accent-3);
}
\`\`\``,
        },
      ],
    };
  }

  if (name === 'get_icon_guide') {
    return {
      content: [
        {
          type: 'text',
          text: `# ShipUI Icons Integration & Usage Guide

ShipUI uses Phosphor Icons bundled into a minified custom webfont. Unused icons are automatically stripped via a custom CLI builder (\`ship-fg\`).

## 1. Icon Syntax
To render icons, use a standard element with the \`class\` prefixed with \`ph-\`.
Example:
\`\`\`html
<i class="ph ph-heart"></i>
\`\`\`

## 2. Dynamic Weight & Style Suffixes
You can use multiple Phosphor icon weights (bold, fill, light, regular, thin) in the exact same font file by suffixing the icon class name:
- Bold style: \`ph-heart-bold\`
- Fill style: \`ph-heart-fill\`
- Light style: \`ph-heart-light\`
- Thin style: \`ph-heart-thin\`
- Regular style: \`ph-heart\` (or \`ph-heart-regular\`)

Example:
\`\`\`html
<i class="ph ph-envelope-fill"></i>
\`\`\`

## 3. CLI Subsetter (ship-fg)
The subsetting engine scans your source files (\`.html\`, \`.ts\`, etc.) for references to \`ph-\` classes, downloads the respective SVG icons, and compiles them into a custom optimized web font on-the-fly.

Configuration options for \`ship-fg\`:
- \`--src\`: Directory to scan for icon classes (e.g. \`./src\`).
- \`--out\`: Directory to write generated font files (e.g. \`./src/assets\`).
- \`--rootPath\`: Output URL root path (e.g. \`./\` or \`/\`).
- \`--watch\`: Watch source files for changes and regenerate automatically.`,
        },
      ],
    };
  }

  throw new Error(`Tool ${name} not found`);
});

/**
 * Prompts: Code generation helper, setup, themes, and layouts
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
      {
        name: 'setup_project',
        description: 'Get interactive setup instructions tailored to your workspace layout',
        arguments: [
          {
            name: 'projectType',
            description: 'e.g., Standard Angular App, Nx Workspace (optional)',
            required: false,
          },
          {
            name: 'stylesFormat',
            description: 'e.g., scss, css, sass (optional)',
            required: false,
          },
        ],
      },
      {
        name: 'customize_theme',
        description: 'Generate custom CSS overrides or themes for ShipUI (colors, typography, radii)',
        arguments: [
          {
            name: 'brandColor',
            description: 'The hex or HSL value of your brand color (optional)',
            required: false,
          },
          {
            name: 'themeMode',
            description: 'light, dark, or both (optional)',
            required: false,
          },
        ],
      },
      {
        name: 'implement_layout',
        description: 'Get guidance and template code to build structured layouts using sh-sheet and CSS grids',
        arguments: [
          {
            name: 'layoutType',
            description: 'e.g., sidebar layout dashboard, header/footer dashboard, grid gallery (optional)',
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

Keywords:
${component.keywords?.join(', ') || 'None'}

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

  if (name === 'setup_project') {
    const projectType = args?.projectType || 'Standard Angular App';
    const stylesFormat = args?.stylesFormat || 'scss';

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `I want to integrate ShipUI in my ${projectType} project. I'm using ${stylesFormat} for styles. Please guide me through a full customized setup. Include installation commands, asset configuration in angular.json, global imports, CLI watchers for custom phosphor icons, and how to verify everything is working.`,
          },
        },
      ],
    };
  }

  if (name === 'customize_theme') {
    const brandColor = args?.brandColor || 'hsl(217, 91%, 60%)';
    const themeMode = args?.themeMode || 'both';

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `I want to customize the ShipUI design system theme. My target brand color is: ${brandColor}. I want to support ${themeMode} color mode(s). Please help me generate custom Radix-like 1-12 HSL scale overrides, custom theme utility rules, light-dark() CSS properties, and custom border/shape or shadow overrides. Ensure all generated classes correctly override ShipUI base styles.`,
          },
        },
      ],
    };
  }

  if (name === 'implement_layout') {
    const layoutType = args?.layoutType || 'sidebar layout dashboard';

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `I want to build a ${layoutType} using ShipUI's layout tokens, sheet utilities (sh-sheet), and responsive structural patterns. Provide clean, modern HTML structure and CSS variables (using the correct abbreviations like po, rs, dp, btn, base-1 to base-12 scales) to achieve a beautiful, responsive, and zoneless-compatible interface.`,
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
