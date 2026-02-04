import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShipButton, ShipCard, ShipChip, ShipDivider, ShipIcon, ShipList } from 'ship-ui';
import { Highlight } from '../previewer/highlight/highlight';

@Component({
  selector: 'app-getting-started',
  imports: [Highlight, ShipButton, ShipCard, ShipIcon, ShipChip, ShipDivider, RouterLink, ShipList],
  templateUrl: './getting-started.html',
  styleUrl: './getting-started.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class GettingStarted {
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

  protected window = window;
}
