import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipAlert, ShipButtonGroup } from 'ship-ui';

@Component({
  selector: 'app-alerts-sandbox',
  standalone: true,
  imports: [ShipAlert, ShipButtonGroup],
  templateUrl: './alerts-sandbox.html',
  styleUrl: './alerts-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertsSandbox {
  isDisabled = signal<boolean>(false);
  colorClass = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
  variationClass = signal<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('simple');
}
