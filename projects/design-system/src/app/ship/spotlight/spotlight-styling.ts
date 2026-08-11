import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Highlight } from '../../previewer/highlight/highlight';

@Component({
  selector: 'app-spotlight-styling',
  imports: [Highlight],
  template: `
    <p>Use the following CSS variables or classes to customize the spotlight styling.</p>
    <app-highlight lang="scss" [content]="codeStylingExample" />
  `,
  styleUrl: './spotlight-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpotlightStyling {
  codeStylingExample = `@use '@ship-ui/core/styles' as ship;

// Customizing Spotlight tokens
:root {
  --ship-spotlight-bg: var(--base-11);
  --ship-spotlight-border: var(--base-9);
  --ship-spotlight-text: var(--base-2);
}

// Or override styles directly
.spotlight-dialog {
  border-radius: ship.p2r(12);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}`;
}
