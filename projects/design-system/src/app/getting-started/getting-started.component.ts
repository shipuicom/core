import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HighlightComponent } from '../previewer/highlight/highlight.component';

@Component({
  selector: 'app-getting-started',
  imports: [HighlightComponent],
  templateUrl: './getting-started.component.html',
  styleUrl: './getting-started.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class GettingStartedComponent {
  SCRIPTS = `"scripts": {
  "gen:font": "sparkle-fg --src='./src' --out='./src/assets' --rootPath='./'",
  "watch:font": "sparkle-fg --src='./src' --out='./src/assets' --rootPath='./' --watch",
  ..
}`;
  UPDATE_SCRIPTS = `"scripts": {
  ..
  "start": "npm run watch:font & ng serve",
  "build": "npm run gen:font & ng build",
  ..
`;
}
