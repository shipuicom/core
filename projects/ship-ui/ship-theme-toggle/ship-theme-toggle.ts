import { ChangeDetectionStrategy, Component, inject, input, ViewEncapsulation } from '@angular/core';
import { ShipButtonSize, ShipColor, ShipSheetVariant } from '@ship-ui/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipThemeOption, ShipThemeState } from './ship-theme-state';

@Component({
  selector: 'ship-theme-toggle',
  styleUrl: './ship-theme-toggle.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [ShipIcon, ShipButton],
  template: `
    <button shButton aria-label="Toggle theme" [color]="color()" [variant]="variant()" [size]="size()" (click)="toggleTheme()">
      @if (theme() === 'dark') {
        <sh-icon>moon-bold</sh-icon>
      } @else if (theme() === 'light') {
        <sh-icon>sun-bold</sh-icon>
      } @else if (theme() === null) {
        <sh-icon>circle-half-tilt-bold</sh-icon>
      }
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipThemeToggle {
  #themeState = inject(ShipThemeState);

  /** Theme color applied to the underlying toggle button. */
  color = input<ShipColor | null>(null);
  /** Visual variant applied to the underlying toggle button. */
  variant = input<ShipSheetVariant | null>(null);
  /** Size of the underlying toggle button. */
  size = input<ShipButtonSize | null>('small');

  theme = this.#themeState.theme;

  toggleTheme() {
    this.#themeState.toggleTheme();
  }

  /** Sets the active theme explicitly to `'light'`, `'dark'`, or `null` (system default). */
  setTheme(theme: ShipThemeOption) {
    this.#themeState.setTheme(theme);
  }
}
