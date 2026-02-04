---
description: How to use and update the ShipUI MCP server
---

# ShipUI MCP Server

This project includes a Model Context Protocol (MCP) server that provides documentation, examples, and tools for all ShipUI elements.

## Adding to Cursor

To use this MCP server in Cursor:

1. Open Cursor Settings -> Models -> MCP.
2. Click **+ Add New MCP Server**.
3. Name: `ShipUI`.
4. Type: `command`.
5. Command: `bun run mcp:start` (Make sure you are in the project root).
   - Or absolute path: `cd /Users/simon/Documents/dev/ship-ui && bun run mcp:start`

## Updating the Server

If you add new components or change existing ones, you can update the MCP data by running:

```bash
bun run mcp:update
```

This will re-scan the `projects/ship-ui` and `projects/design-system` directories to update the component index.

## Features

- **Resources**: Browse components via `ship-ui://components/sh-button`.
- **Tools**:
  - `search_components`: Find components by name.
  - `get_component_details`: Get full documentation and examples.
- **Prompts**:
  - `use_component`: Get a starting template for a specific component.
