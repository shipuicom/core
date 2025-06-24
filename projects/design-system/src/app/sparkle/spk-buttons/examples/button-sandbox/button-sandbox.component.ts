import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  SparkleButtonComponent,
  SparkleButtonGroupComponent,
  SparkleIconComponent,
  SparkleToggleComponent,
} from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-button-sandbox',
  imports: [SparkleButtonComponent, SparkleButtonGroupComponent, SparkleIconComponent, SparkleToggleComponent],
  templateUrl: './button-sandbox.component.html',
  styleUrl: './button-sandbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonSandboxComponent {
  isSmall = signal<boolean>(false);
  isRotated = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  isDisabled = signal<boolean>(false);
  isReadonly = signal<boolean>(false);

  colorClass = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
  variationClass = signal<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('raised');
  exampleClass = computed(() => this.colorClass() + ' ' + this.variationClass());
}
