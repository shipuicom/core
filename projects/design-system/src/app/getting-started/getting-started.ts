import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipCard } from '@ship-ui/core/ship-card';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipDivider } from '@ship-ui/core/ship-divider';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipList } from '@ship-ui/core/ship-list';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import { WINDOW } from '../core/providers/window';
import { Highlight } from '../previewer/highlight/highlight';

@Component({
  selector: 'app-getting-started',
  imports: [Highlight, ShipButton, ShipCard, ShipIcon, ShipChip, ShipDivider, RouterLink, ShipList, ShipTabs],
  templateUrl: './getting-started.html',
  styleUrl: './getting-started.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class GettingStarted {
  #window = inject(WINDOW);

  activeMcpTab = signal('cursor');

  ASSETS_CONFIG = `"assets": [ 
  "src/assets",
  {
    "glob": "**/*",
    "input": "./node_modules/@ship-ui/core/assets",
    "output": "./ship-ui-assets/"
  }
]`;

  SCRIPTS = `"scripts": {
  "gen:font": "ship-fg --src='./src' --out='./src/assets' --rootPath='./'",
  "watch:font": "ship-fg --src='./src' --out='./src/assets' --rootPath='./' --watch",
  ..
}`;

  UPDATE_SCRIPTS = `"scripts": {
  ..
  "start": "npm run watch:font & ng serve",
  "build": "npm run gen:font & ng build",
  ..
}`;

  COMPONENT_PREVIEW = `import { Component } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'button-example',
  imports: [ShipButton, ShipIcon],
  template: \`
    <button shButton color="primary">
      <sh-icon>pen</sh-icon>
      Edit
    </button>
  \`
})
export class ButtonExample {}`;

  IMPORT_EXAMPLE = `import { Component } from '@angular/core';
// Import each component from its secondary entry point
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [ShipButton, ShipIcon],
  template: \`<button shButton><sh-icon>pen</sh-icon> Edit</button>\`
})
export class ExampleComponent {}`;

  CURSOR_CONFIG = `Name: ShipUI
Type: command
Command: npx @ship-ui/core ship-mcp`;

  VSCODE_CONFIG = `Using an extension like Cline, Kilo code or Roo Code:
1. Open MCP Settings in the extension.
2. Add a new command server:
   Command: npx
   Args: -y @ship-ui/core ship-mcp`;

  CLAUDE_CODE_CONFIG = `# One-off, for the current user:
claude mcp add ship-ui -- npx -y @ship-ui/core ship-mcp

# Or commit it with the project in .mcp.json:
{
  "mcpServers": {
    "ship-ui": {
      "command": "npx",
      "args": ["-y", "@ship-ui/core", "ship-mcp"]
    }
  }
}`;

  CODEX_CONFIG = `# One-off, for the current user:
codex mcp add ship-ui -- npx -y @ship-ui/core ship-mcp

# Or add it to ~/.codex/config.toml:
[mcp_servers.ship-ui]
command = "npx"
args = ["-y", "@ship-ui/core", "ship-mcp"]`;

  ANTIGRAVITY_CONFIG = `Add to your MCP settings:
{
  "command": "npx",
  "args": ["-y", "@ship-ui/core", "ship-mcp"]
}`;

  openGithub() {
    this.#window.open('https://github.com/shipuicom/core', '_blank');
  }
}
