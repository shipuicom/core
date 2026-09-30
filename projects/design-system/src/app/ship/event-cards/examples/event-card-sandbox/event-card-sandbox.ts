import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipEventCard } from '@ship-ui/core/ship-event-card';

@Component({
  selector: 'app-event-card-sandbox',
  imports: [ShipEventCard, ShipButton],
  templateUrl: './event-card-sandbox.html',
  styleUrl: './event-card-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventCardSandbox {
  color = input<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
  variant = input<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('simple');
  useDynamicColor = input(false);
  dynamicColor = input('#2f54eb');

  exampleClass = computed(() => {
    if (this.useDynamicColor()) return 'dynamic';

    return this.variant() + ' ' + this.color();
  });
}
