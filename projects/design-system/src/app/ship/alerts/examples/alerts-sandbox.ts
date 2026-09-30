import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipAlert } from '@ship-ui/core/ship-alert';

@Component({
  selector: 'app-alerts-sandbox',
  standalone: true,
  imports: [ShipAlert],
  templateUrl: './alerts-sandbox.html',
  styleUrl: './alerts-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertsSandbox {
  color = input<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
  variant = input<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('simple');
}
