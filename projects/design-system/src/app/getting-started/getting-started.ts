import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShipButton, ShipCard, ShipChip, ShipDivider, ShipIcon, ShipList, ShipTabs } from 'ship-ui';
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

  COMPONENT_PREVIEW = `<button shButton color="primary">
  <sh-icon>pen</sh-icon> 
  Edit
</button>`;

  CURSOR_CONFIG = `Name: ShipUI
Type: command
Command: npx @ship-ui/core ship-mcp`;

  VSCODE_CONFIG = `Using an extension like Cline, Kilo code or Roo Code:
1. Open MCP Settings in the extension.
2. Add a new command server:
   Command: npx
   Args: -y @ship-ui/core ship-mcp`;

  WINDSURF_CONFIG = `Add to your ~/.codeium/config.json:
{
  "mcpServers": {
    "ship-ui": {
      "command": "npx",
      "args": ["-y", "@ship-ui/core", "ship-mcp"]
    }
  }
}`;

  WEBSTORM_CONFIG = `Settings | Tools | MCP Servers:
1. Click + and select 'Command'
2. Name: ShipUI
3. Command: npx
4. Arguments: -y @ship-ui/core ship-mcp`;

  ANTIGRAVITY_CONFIG = `Add to your MCP settings:
{
  "command": "npx",
  "args": ["-y", "@ship-ui/core", "ship-mcp"]
}`;

  openGithub() {
    this.#window.open('https://github.com/shipuicom/core', '_blank');
  }
}
