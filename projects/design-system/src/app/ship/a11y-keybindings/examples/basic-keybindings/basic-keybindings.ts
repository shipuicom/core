import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ShipA11yKeybindingsDirective, ShipA11yKeybindingsService } from '@ship-ui/core/ship-a11y-keybindings';
import { ShipButton } from '@ship-ui/core/ship-button';

@Component({
  selector: 'app-basic-keybindings',
  imports: [ShipA11yKeybindingsDirective, ShipButton],
  templateUrl: './basic-keybindings.html',
  styleUrl: './basic-keybindings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicKeybindingsComponent {
  readonly service = inject(ShipA11yKeybindingsService);

  localCounter = signal(0);
  globalCounter = signal(0);

  constructor() {
    // Register defaults for our example actions
    this.service.registerDefaults({
      'example.increment-local': 'enter',
      'example.increment-global': 'ctrlOrCmd+shift+s',
    });
  }

  incrementLocal() {
    this.localCounter.update((c) => c + 1);
  }

  incrementGlobal() {
    this.globalCounter.update((c) => c + 1);
  }

  changeShortcut() {
    // Override a keybinding at runtime
    const currentLocal = this.service.getShortcut('example.increment-local');
    const nextLocal = currentLocal === 'enter' ? 'space' : 'enter';

    this.service.registerOverrides({
      'example.increment-local': nextLocal,
    });
  }
}
