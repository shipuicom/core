import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipAlert } from 'ship-ui';
import { Highlight } from '../previewer/highlight/highlight';

@Component({
  selector: 'app-getting-started',
  imports: [Highlight, ShipAlert],
  templateUrl: './getting-started.html',
  styleUrl: './getting-started.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class GettingStarted {
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
`;
}
