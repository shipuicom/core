import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipButton, ShipButtonGroup, ShipEventCard, ShipToggle } from 'ship-ui';

@Component({
  selector: 'app-event-card-sandbox',
  imports: [FormsModule, ShipEventCard, ShipButton, ShipToggle, ShipButtonGroup],
  templateUrl: './event-card-sandbox.html',
  styleUrl: './event-card-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventCardSandbox {
  colorClass = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
  variationClass = signal<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('simple');

  useDynamicColor = signal<boolean>(false);
  dynamicColor = signal<string>('#2f54eb');

  exampleClass = computed(() => {
    if (this.useDynamicColor()) return 'dynamic';

    return this.variationClass() + ' ' + this.colorClass();
  });
}
