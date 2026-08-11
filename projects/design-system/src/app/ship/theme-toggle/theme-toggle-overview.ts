import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Highlight } from '../../previewer/highlight/highlight';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicThemeToggle } from './examples/basic-theme-toggle/basic-theme-toggle';

@Component({
  selector: 'app-theme-toggle-overview',
  imports: [Previewer, PropertyViewer, Highlight, BasicThemeToggle],
  templateUrl: './theme-toggle-overview.html',
  styleUrl: './theme-toggle-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ThemeToggleOverview {
  usageExample = `import { ShipThemeToggle } from '@ship-ui/core/ship-theme-toggle';

@Component({
  imports: [ShipThemeToggle],
  template: '<ship-theme-toggle color="primary" variant="raised" />',
})
export class MyToolbar {}`;

  serviceExample = `import { inject } from '@angular/core';
import { ShipThemeState } from '@ship-ui/core/ship-theme-toggle';

export class MyComponent {
  #theme = inject(ShipThemeState);

  // Read the current theme reactively ('light' | 'dark' | null = system).
  current = this.#theme.theme;

  toDark() {
    this.#theme.setTheme('dark');
  }
}`;
}
