import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  SparkleButtonGroupComponent,
  SparkleChipComponent,
  SparkleIconComponent,
  SparkleToggleComponent,
} from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-chip-sandbox',
  imports: [SparkleIconComponent, SparkleChipComponent, SparkleButtonGroupComponent, SparkleToggleComponent],
  templateUrl: './chip-sandbox.component.html',
  styleUrl: './chip-sandbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipSandboxComponent {
  isSmall = signal<boolean>(false);
  hasIcon = signal<boolean>(true);
  hasSuffixIcon = signal<boolean>(true);
  hasText = signal<boolean>(true);

  colorClass = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
  variationClass = signal<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('raised');
  exampleClass = computed(() => this.colorClass() + ' ' + this.variationClass());
}
