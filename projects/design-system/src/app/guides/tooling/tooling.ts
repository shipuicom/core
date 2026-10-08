import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Highlight } from '../../previewer/highlight/highlight';
import { PropertyViewer } from '../../property-viewer/property-viewer';

@Component({
  selector: 'app-tooling',
  imports: [Highlight, PropertyViewer, RouterLink],
  templateUrl: './tooling.html',
  styleUrl: './tooling.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Tooling {
  readonly MCP_COMMAND = `npx @ship-ui/core ship-mcp`;

  readonly CLAUDE_DESKTOP = `{
  "mcpServers": {
    "ship-ui": {
      "command": "npx",
      "args": ["-y", "@ship-ui/core", "ship-mcp"]
    }
  }
}`;

  readonly SNIPPETS = `./node_modules/@ship-ui/core/snippets/ship-ui.code-snippets`;

  readonly ICON_SCRIPTS = `"scripts": {
  "gen:font": "ship-fg --src='./src' --out='./src/assets' --rootPath='./'",
  "watch:font": "ship-fg --src='./src' --out='./src/assets' --rootPath='./' --watch",
  "start": "npm run watch:font & ng serve",
  "build": "npm run gen:font && ng build"
}`;

  readonly ICON_HEAD = `<!-- index.html -->
<link rel="stylesheet" href="/ship.css" />`;

  readonly ASSETS = `"assets": [
  "src/assets",
  {
    "glob": "**/*",
    "input": "./node_modules/@ship-ui/core/assets",
    "output": "./ship-ui-assets/"
  }
]`;

  readonly SHIP_STYLES = `npx ship-styles --in ship-styles.json --out src/_ship-styles.scss`;

  readonly SHIP_MIGRATE = `npx ship-migrate --dry-run`;
}
