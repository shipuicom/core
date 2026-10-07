import { ChangeDetectionStrategy, Component, computed, inject, input, ViewEncapsulation } from '@angular/core';
import { SHIP_CONFIG, shipComponentClasses, ShipButtonSize, ShipColor, ShipSheetVariant } from '@ship-ui/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipThemeOption, ShipThemeState } from './ship-theme-state';

@Component({
  selector: 'sh-theme-toggle',
  styleUrl: './ship-theme-toggle.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [ShipIcon, ShipButton],
  template: `
    <button shButton aria-label="Toggle theme" [color]="effectiveColor()" [variant]="effectiveVariant()" [size]="effectiveSize()" (click)="toggleTheme()">
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
  host: { '[class]': 'hostClasses()' },
})
export class ShipThemeToggle {
  #themeState = inject(ShipThemeState);
  #config = inject(SHIP_CONFIG, { optional: true });

  /** Theme color applied to the underlying toggle button (project default via `ShipConfig.themeToggle.color`). */
  color = input<ShipColor | null>(null);
  /** Visual variant applied to the underlying toggle button (project default via `ShipConfig.themeToggle.variant`). */
  variant = input<ShipSheetVariant | null>(null);
  /** Size of the underlying toggle button; `ShipConfig.themeToggle.size` wins over the `small` default. */
  size = input<ShipButtonSize | null>(null);

  // The inputs with the `ShipConfig.themeToggle` defaults; passed to the inner button and stamped on the host.
  effectiveColor = computed(() => this.color() ?? (this.#config?.themeToggle?.color as ShipColor | undefined) ?? null);
  effectiveVariant = computed(
    () => this.variant() ?? (this.#config?.themeToggle?.variant as ShipSheetVariant | undefined) ?? null
  );
  effectiveSize = computed(() => this.size() ?? (this.#config?.themeToggle?.size as ShipButtonSize | undefined) ?? 'small');

  hostClasses = shipComponentClasses('themeToggle', {
    color: this.effectiveColor,
    variant: this.effectiveVariant,
    size: this.effectiveSize,
  });

  theme = this.#themeState.theme;

  toggleTheme() {
    this.#themeState.toggleTheme();
  }

  /** Sets the active theme explicitly to `'light'`, `'dark'`, or `null` (system default). */
  setTheme(theme: ShipThemeOption) {
    this.#themeState.setTheme(theme);
  }
}
