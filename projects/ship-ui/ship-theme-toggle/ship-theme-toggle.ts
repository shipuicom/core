import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipThemeOption, ShipThemeState } from './ship-theme-state';

@Component({
  selector: 'ship-theme-toggle',
  styleUrl: './ship-theme-toggle.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [ShipIcon, ShipButton],
  template: `
    <button shButton size="small" (click)="toggleTheme()">
      @if (theme() === 'dark') {
        <sh-icon>moon-bold</sh-icon>
      } @else if (theme() === 'light') {
        <sh-icon>sun-bold</sh-icon>
      } @else if (theme() === null) {
        <sh-icon class="small-icon">sun-bold</sh-icon>
        <sh-icon class="small-icon">moon-bold</sh-icon>
      }
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipThemeToggle {
  #themeState = inject(ShipThemeState);

  theme = this.#themeState.theme;

  toggleTheme() {
    this.#themeState.toggleTheme();
  }

  setTheme(theme: ShipThemeOption) {
    this.#themeState.setTheme(theme);
  }
}
