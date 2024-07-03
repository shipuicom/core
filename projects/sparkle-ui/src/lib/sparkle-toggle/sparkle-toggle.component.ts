import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type SparkleColorSchemes = 'base' | 'primary' | 'accent' | 'tertiary' | 'warn' | 'success';
export type SparkleToggleVariants = 'base' | 'stroked' | 'flat' | 'raised';

@Component({
  selector: 'sparkle-toggle',
  standalone: true,
  imports: [NgClass],
  templateUrl: './sparkle-toggle.component.html',
  styleUrl: './sparkle-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SparkleToggleComponent {
  active = input<boolean>(false);
  color = input<SparkleColorSchemes>('primary');
  variant = input<SparkleToggleVariants>('base');

  colorClass = computed(() => 'sc-' + this.color());
  variantClass = computed(() => 'sv-' + this.variant());
}
