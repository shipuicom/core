import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';
import { Highlight } from '../../previewer/highlight/highlight';
import { PropertyViewer } from '../../property-viewer/property-viewer';

@Component({
  selector: 'app-spotlight-service',
  imports: [ApiReference, Highlight, PropertyViewer],
  templateUrl: './spotlight-service.html',
  styleUrl: './spotlight-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpotlightService {
  codeRegisterItems = `import { Component, inject } from '@angular/core';
import { ShipSpotlightService } from '@ship-ui/core/ship-spotlight';

@Component({ /* ... */ })
export class AppShell {
  #spotlightService = inject(ShipSpotlightService);

  constructor() {
    // Cleanup is returned — and auto-called on this component's DestroyRef
    this.#spotlightService.registerItems([
      { id: 'dashboard', label: 'Go to dashboard', icon: 'home', shortcut: 'alt+d', data: { route: '/dashboard' } },
      { id: 'theme', label: 'Toggle theme', icon: 'contrast', shortcut: 'alt+t', data: { action: 'theme' } },
    ]);
  }
}`;

  codeContextualItems = `// Replace the previous contextual set whenever the active view changes
this.#spotlightService.setContextualItems([
  { id: 'export', label: 'Export report', icon: 'download', data: { action: 'export' } },
]);

// ...and drop them when leaving the view
this.#spotlightService.clearContextualItems();`;

  codeSelections = `import { effect, inject } from '@angular/core';

export class AppShell {
  #spotlightService = inject(ShipSpotlightService);

  #onSelect = effect(() => {
    const item = this.#spotlightService.globalItemSelected();
    if (item?.data?.route) this.router.navigateByUrl(item.data.route);
  });
}`;

  codeManualOpen = `// Open imperatively (uses all registered items unless you pass your own)
const instance = this.#spotlightService.open({ placeholder: 'Search actions…' });

instance.itemSelected.subscribe((item) => console.log('picked', item));
instance.closed.subscribe(() => console.log('closed'));
instance.close();`;

  codeConfig = `import { SHIP_SPOTLIGHT_CONFIG } from '@ship-ui/core/ship-spotlight';

// app.config.ts
providers: [
  {
    provide: SHIP_SPOTLIGHT_CONFIG,
    useValue: {
      enableGlobalEventListener: false, // opt out of the global Cmd/Ctrl+K listener
      defaultItems: [{ id: 'help', label: 'Help', icon: 'help' }],
    },
  },
];`;
}
