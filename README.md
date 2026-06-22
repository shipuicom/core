# ⛵ Ship UI

A modern signal based and zoneless compatable UI library for Angular visit our website [shipui.com](https://shipui.com) for more info.

Docs can be found at [docs.shipui.com](https://docs.shipui.com)

> [!IMPORTANT]
> **Upgrading to v0.21.0?** ShipUI now uses a modular secondary entry point architecture for maximum tree-shaking and HMR performance. Please read our [Migration Guide](MIGRATION.md) for instructions on updating your imports.

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

## Keyboard Accessibility (A11y)

ShipUI includes a robust global keybindings service `ShipA11yKeybindingsService` that manages default keyboard shortcuts for all interactive components (such as selects, datepickers, menus, tabs, and dialogs) with full support for WASD alternatives and macOS custom formatting.

### Default Keybinding Actions
* **Datepicker**: Prev/Next Month (`PageUp` / `PageDown`), Prev/Next Year (`Shift+PageUp` / `Shift+PageDown`), Start/End Month (`Home` / `End`), Move focus (`ArrowRight, d`, `ArrowLeft, a`, `ArrowDown, s`, `ArrowUp, w`).
* **Selection Groups (Tabs, Steppers, Button Groups)**: Navigate (`ArrowRight, ArrowDown, d, s`, `ArrowLeft, ArrowUp, a, w`), Select (`Enter, space`).
* **Select**: Navigate (`ArrowDown, s`, `ArrowUp, w`), Select (`Enter, space`), Close (`Escape`).
* **Menu**: Navigate (`ArrowDown, s`, `ArrowUp, w`), Submenus (`ArrowRight, d`, `ArrowLeft, a`), Select (`Enter, space`).
* **Spotlight**: Navigate (`ArrowDown, s`, `ArrowUp, w`), Open spotlight (`ctrlOrCmd+k`).
* **Dialogs & Popovers**: Close (`Escape`).
* **Form Controls (Checkbox, Toggle, Radio)**: Toggle/Select (`Enter, space`).
* **Table**: Sort column (`Enter, space`).
* **Blueprint**: Cancel connection drag (`Escape`).
* **Editor Toolbar**: Navigate items (`ArrowRight, ArrowDown`, `ArrowLeft, ArrowUp`), Jump (`Home`, `End`).

### Overriding Keybindings Globally
You can customize or override any of these keybindings globally in your application using the `SHIP_A11Y_KEYBINDINGS_OVERRIDE` token in your app configuration:

```typescript
import { ApplicationConfig } from '@angular/core';
import { SHIP_A11Y_KEYBINDINGS_OVERRIDE } from '@ship-ui/core/ship-a11y-keybindings';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: SHIP_A11Y_KEYBINDINGS_OVERRIDE,
      useValue: {
        // Change spotlight search shortcut to cmd+p / ctrl+p
        'spotlight.open': 'ctrlOrCmd+p',
        // Change datepicker controls to custom mappings
        'datepicker.day-next': 'ArrowRight, l',
        'datepicker.day-prev': 'ArrowLeft, h',
      }
    }
  ]
};
```

### Declaring Shortcuts on Elements (Directives)

ShipUI provides two standalone directives to connect your HTML elements with the `ShipA11yKeybindingsService` and automatically output compliant `aria-keyshortcuts` attributes for screen readers:

1. **`[shA11yKeybinding]`**: Maps an action name, sets the `aria-keyshortcuts` attribute, listens to the keyboard event (globally or locally), and automatically triggers a `.click()` on the host element when matched.
   ```html
   <!-- Automatically triggers click/onClose() and sets aria-keyshortcuts when user presses Escape -->
   <button shA11yKeybinding="dialog.close" mode="local" (triggered)="onClose()">Close Dialog</button>
   ```

2. **`[shA11yKeyshortcut]`**: Sets the `aria-keyshortcuts` attribute dynamically from the service without setting up any keydown event listeners. Use this on elements/components that already handle key events internally but need to advertise their hotkeys to assistive technologies.
   ```html
   <!-- Sets aria-keyshortcuts="Enter, Space" dynamically on the list header -->
   <th shA11yKeyshortcut="table.sort" (click)="sort()">Sorted Column</th>
   ```

### Keybinding Syntax
* Support multiple key combinations using comma-separated notation (e.g. `'ArrowRight, d'`).
* Modifier combinations are specified with `+`, such as `'ctrl+shift+k'`.
* Use `ctrlOrCmd` to automatically bind to `Command` on macOS and `Control` on Windows/Linux/ChromeOS.
* Standard keys like `Enter`, `space` (all lowercase), `Escape`, `ArrowUp`, `PageUp`, etc. are fully supported.
* If a component needs keybinding checking manually, inject `ShipA11yKeybindingsService` and check `this.keybindings.matches(event, 'action.name')`.

## Follow our progress

We have a [todos](documents/todos.md) file where we try keep track of features/bugs/blockers currently in pipeline etc

## Notes

- <strike>There was raised thoughts on separating out the icon utility the decision are for now not to since this package are depended on those icons for now, we can open up a new debate about it if some comes with a solid argument for it</strike>
- <strike>For safari `<18` the selects does not support using options so you must use `<sh-option>` instead of `<option>` (this is fixed in the next select version currently suffixed with `-new`)</strike> (We circumvent this by using a templates instead of options)

## Contributors

### Creators

- [Simon - development](https://github.com/sp90)
- [Morten - design](https://x.com/mortenpx)

### Sponsors

- [Duplicati](https://duplicati.com)

## License

MIT
