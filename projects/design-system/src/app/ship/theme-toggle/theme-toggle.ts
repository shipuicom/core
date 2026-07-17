import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import { ApiReference } from '../../api-reference/api-reference';
import { Highlight } from '../../previewer/highlight/highlight';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicThemeToggle } from './examples/basic-theme-toggle/basic-theme-toggle';
import { StyledThemeToggle } from './examples/styled-theme-toggle/styled-theme-toggle';

@Component({
  selector: 'app-theme-toggle',
  imports: [ShipTabs, ApiReference, PropertyViewer, Previewer, Highlight, BasicThemeToggle, StyledThemeToggle],
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ThemeToggle {
  activeTab = signal('overview');

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
