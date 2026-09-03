import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';
import { Highlight } from '../../previewer/highlight/highlight';
import { PropertyViewer } from '../../property-viewer/property-viewer';

@Component({
  selector: 'app-a11y-keybindings-service',
  imports: [ApiReference, Highlight, PropertyViewer],
  templateUrl: './a11y-keybindings-service.html',
  styleUrl: './a11y-keybindings-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class A11yKeybindingsService {
  codeOverrides = `import { SHIP_A11Y_KEYBINDINGS_OVERRIDE } from '@ship-ui/core/ship-a11y-keybindings';

// app.config.ts — remap actions app-wide
providers: [
  {
    provide: SHIP_A11Y_KEYBINDINGS_OVERRIDE,
    useValue: {
      'spotlight.open': 'ctrlOrCmd+p',
      'datepicker.next-month': 'ctrlOrCmd+ArrowDown',
    },
  },
];`;

  codeMatches = `import { Component, inject } from '@angular/core';
import { ShipA11yKeybindingsService } from '@ship-ui/core/ship-a11y-keybindings';

@Component({
  host: { '(keydown)': 'onKeydown($event)' },
})
export class MyWidget {
  #keybindings = inject(ShipA11yKeybindingsService);

  constructor() {
    // Register defaults for your own actions (never overrides customised bindings)
    this.#keybindings.registerDefaults({ 'widget.confirm': 'Enter, space' });
  }

  onKeydown(event: KeyboardEvent) {
    if (this.#keybindings.matches(event, 'widget.confirm')) {
      event.preventDefault();
      this.confirm();
    }
  }
}`;

  codeDisplay = `// Platform-aware labels for tooltips / aria-keyshortcuts
this.#keybindings.getShortcut('spotlight.open');        // 'ctrlOrCmd+k'
this.#keybindings.getDisplayShortcut('spotlight.open'); // '⌘K' on macOS, 'Ctrl+K' elsewhere
this.#keybindings.getDefaultShortcut('spotlight.open'); // ignores overrides`;

  codeAnnounce = `import { inject } from '@angular/core';
import { ShipA11yAnnouncerService } from '@ship-ui/core/ship-a11y-announcer';

export class BoardPage {
  #announcer = inject(ShipA11yAnnouncerService);

  onCardMoved(card: Card, column: string) {
    // 'polite' (default) waits its turn; reserve 'assertive' for errors
    this.#announcer.announce(\`\${card.title} moved to \${column}\`);
  }

  onSaveFailed(reason: string) {
    this.#announcer.announce(\`Save failed: \${reason}\`, 'assertive');
  }
}`;

  codePause = `// Suspend all keybinding matching while a modal editor is open.
// pause() is reference-counted: every pause() needs a matching resume().
this.#keybindings.pause();
try {
  await this.openRawKeyboardEditor();
} finally {
  this.#keybindings.resume();
}`;
}
