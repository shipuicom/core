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
  - `search_components`: Find components by name or selector.
  - `get_component_details`: Get full documentation, css variables, inputs/outputs, and examples.
  - `get_setup_instructions`: Get step-by-step setup and installation instructions for an Angular 19+ project.
  - `get_design_tokens`: Get a comprehensive guide on ShipUI design tokens (Radix 1-12 colors, typography, shapes, and utility classes).
  - `get_css_variable_abbreviations`: Get the complete cheatsheet for minified CSS variables and abbreviations used in ShipUI components (e.g. `btn-c-h`).
  - `get_icon_guide`: Get setup and usage instructions for Phosphor Icons CLI font subsetting (`ship-fg`).
- **Prompts**:
  - `use_component`: Get a starting template for a specific component.
  - `setup_project`: Tailored interactive step-by-step setup guides for different project types.
  - `customize_theme`: Generate custom CSS theme overrides using Radix 1-12 scales.
  - `implement_layout`: Guidance and templates to build structured layouts using `sh-sheet` and CSS grids.
