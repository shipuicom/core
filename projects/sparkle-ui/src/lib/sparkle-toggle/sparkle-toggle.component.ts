import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type SparkleColorSchemes = 'base' | 'primary' | 'accent' | 'tertiary' | 'warn' | 'success';
export type SparkleToggleVariants = 'base' | 'stroked' | 'flat' | 'raised';

@Component({
  selector: 'sparkle-toggle',
  standalone: true,
  imports: [], 
  templateUrl: './sparkle-toggle.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'colorClass() + " " + variantClass()'
  }
})
export class SparkleToggleComponent {
  active = input<boolean>(false);
  color = input<SparkleColorSchemes>('primary');
  variant = input<SparkleToggleVariants>('base');

  colorClass = computed(() => 'sc-' + this.color());
  variantClass = computed(() => 'sv-' + this.variant());
}
