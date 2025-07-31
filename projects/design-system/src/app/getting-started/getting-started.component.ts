import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipAlertComponent } from '../../../../ship-ui/src/public-api';
import { HighlightComponent } from '../previewer/highlight/highlight.component';

@Component({
  selector: 'app-getting-started',
  imports: [HighlightComponent, ShipAlertComponent],
  templateUrl: './getting-started.component.html',
  styleUrl: './getting-started.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class GettingStartedComponent {
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
