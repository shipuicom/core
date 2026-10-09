import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipAvatar } from '@ship-ui/core/ship-avatar';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipCard } from '@ship-ui/core/ship-card';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-type-c-card',
  imports: [ShipCard, ShipAvatar, ShipButton, ShipChip, ShipIcon],
  templateUrl: './type-c-card.html',
  styleUrl: './type-c-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeCCardComponent {
  members = [
    { name: 'Maya Lindqvist', email: 'maya@example.com', role: 'Owner' },
    { name: 'Jonas Okafor', email: 'jonas@example.com', role: 'Editor' },
    { name: 'Priya Raman', email: 'priya@example.com', role: 'Viewer' },
  ];
}
