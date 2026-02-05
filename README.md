# ⛵ Ship UI

A modern signal based and zoneless compatable UI library for Angular visit our website [shipui.com](https://shipui.com) for more info.

Docs can be found at [docs.shipui.com](https://docs.shipui.com)

## Base setup

To start using ShipUI make sure you're using angular 19 or newer.

### Install

```sh
npm i -S @ship-ui/core
```

### Add styles inside your src/styles.scss

```scss
@use '@ship-ui/core/styles';
```

### Inside your angular.json file

you need to add the ship assets to your assets array this is to add the ship default font

```json
"assets": [
  "src/assets",
  {
    "glob": "**/*",
    "input": "./node_modules/@ship-ui/core/assets",
    "output": "./ship-ui-assets/"
  }
]
```

### Setup Icons

Ship comes with a custom CLI for subsetting and auto generating an icon font currently we support Phospher icons

```html
<!-- Add to the head of your index.html -->
<link rel="stylesheet" href="/ship.css" />
```

### Add following scripts to your package.json scripts

One are for generating the icon font once, the other has a watch feature.

```json
"scripts": {
  ..
  "gen:font": "ship-fg --src='./src' --out='./src/assets' --rootPath='./'",
  "watch:font": "ship-fg --src='./src' --out='./src/assets' --rootPath='./' --watch",
  ..
}
```

### Now update your current start and build scripts

You now wanna add when to build the font and when to watch so it works well together with your start and build, **remember** to add the `npm run gen:font` to all your build scripts

```json
"scripts": {
  ..
  "start": "npm run watch:font & ng serve",
  "build": "npm run gen:font & ng build",
  ..
}
```

## AI & Developer Experience

ShipUI comes with built-in tools to enhance your development workflow through AI and IDE integrations.

### Model Context Protocol (MCP)

ShipUI includes an MCP server that allows AI agents (like Cursor, Claude Desktop, or custom tools) to understand and correctly use ShipUI components.

#### Setup in Editors

To use ShipUI with your favorite AI-powered editor, add the following configuration:

**Command:** `npx @ship-ui/core ship-mcp`

- **Cursor**:
  1. Go to **Settings** > **Models** > **MCP**.
  2. Click **+ Add new MCP server**.
  3. Name: `ShipUI`, Type: `command`, Command: `npx @ship-ui/core ship-mcp`.
- **Antigravity**:
  1. Open your workspace or global configuration.
  2. Add `@ship-ui/core` to your `mcpServers` list or run with `npx @ship-ui/core ship-mcp`.
- **Claude Desktop**:
  Add to your `claude_desktop_config.json`:
  ```json
  "mcpServers": {
    "ship-ui": {
      "command": "npx",
      "args": ["-y", "@ship-ui/core", "ship-mcp"]
    }
  }
  ```

To manually verify the server is working:

```sh
npx @ship-ui/core ship-mcp
```

### VS Code Snippets

The library includes high-quality TextMate snippets for all components, including "full" versions with choices for colors, variants, and sizes.

To use them in VS Code, you can add a link to the snippets file in your `.vscode/settings.json` or copy the content to your project's snippets. The file is located at:
`./node_modules/@ship-ui/core/snippets/ship-ui.code-snippets`

## Follow our progress

We have a [todos](documents/todos.md) file where we try keep track of features/bugs/blockers currently in pipeline etc

## Notes

- <strike>There was raised thoughts on separating out the icon utility the decision are for now not to since this package are depended on those icons for now, we can open up a new debate about it if some comes with a solid argument for it</strike>
- <strike>For safari `<18` the selects does not support using options so you must use `<sh-option>` instead of `<option>` (this is fixed in the next select version currently suffixed with `-new`)</strike> (We circumvent this by using a templates instead of options)
- Known issues for selects when having two selects editing the same value and it is a multi select and searchable they clear out when opened also when selecting a new item they clear the rest of the list - not a very likely scenario but it is something to keep in mind (Your UI probably should not allow this scenario write an issue if you think it should be possible with a good explanation and example)

## Contributors

### Creators

- [Simon - development](https://github.com/sp90)
- [Morten - design](https://x.com/mortenpx)

### Sponsors

- [Duplicati](https://duplicati.com)

## License

MIT
