import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipThemeState } from '@ship-ui/core/ship-theme-toggle';
import { ApiReference } from '../../api-reference/api-reference';
import { Highlight } from '../../previewer/highlight/highlight';
import { PropertyViewer } from '../../property-viewer/property-viewer';

@Component({
  selector: 'app-theme-toggle-service',
  imports: [ApiReference, Highlight, PropertyViewer, ShipButton],
  templateUrl: './theme-toggle-service.html',
  styleUrl: './theme-toggle-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ThemeToggleService {
  themeState = inject(ShipThemeState);

  codeUsage = `import { Component, inject } from '@angular/core';
import { ShipThemeState } from '@ship-ui/core/ship-theme-toggle';

@Component({
  template: \`
    <button (click)="themeState.toggleTheme()">
      Current theme: {{ themeState.theme() ?? 'system' }}
    </button>
  \`,
})
export class SettingsPage {
  themeState = inject(ShipThemeState);
}`;

  codeSetTheme = `// Explicitly pick a theme (persisted to localStorage under 'shipTheme')
themeState.setTheme('dark');
themeState.setTheme('light');

// null clears the stored preference and falls back to the system theme
themeState.setTheme(null);`;

  codeReact = `import { effect } from '@angular/core';

// theme is a read-only signal — react to changes anywhere
#syncCharts = effect(() => {
  const theme = this.themeState.theme(); // 'light' | 'dark' | null
  this.chartLib.setColorScheme(theme ?? 'auto');
});`;
}
