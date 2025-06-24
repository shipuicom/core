import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { SparkleAlertComponent, SparkleButtonGroupComponent } from '../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-alerts-sandbox',
  standalone: true,
  imports: [SparkleAlertComponent, SparkleButtonGroupComponent],
  templateUrl: './alerts-sandbox.component.html',
  styleUrl: './alerts-sandbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertsSandboxComponent {
  isDisabled = signal<boolean>(false);
  colorClass = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
  variationClass = signal<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('simple');
  exampleClass = computed(() => this.colorClass() + ' ' + this.variationClass());
}
