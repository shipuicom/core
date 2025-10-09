import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { ShipButtonGroupComponent, ShipCardComponent, ShipToggleCardComponent, ShipToggleComponent } from 'ship-ui';

@Component({
  selector: 'app-card-sandbox',
  imports: [ShipCardComponent, ShipToggleCardComponent, ShipButtonGroupComponent, ShipToggleComponent],
  templateUrl: './card-sandbox.component.html',
  styleUrl: './card-sandbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardSandboxComponent {
  cardType = signal<'type-a' | 'type-b' | 'type-c'>('type-a');
  useToggleCard = signal<boolean>(false);
  disallowToggle = signal<boolean>(false);

  cardClass = computed(() => (this.cardType() === 'type-a' ? '' : this.cardType()));
}
