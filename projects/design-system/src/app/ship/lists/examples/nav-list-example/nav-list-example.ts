import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipList } from '@ship-ui/core/ship-list';

@Component({
  selector: 'app-nav-list-example',
  imports: [ShipList, ShipIcon],
  templateUrl: './nav-list-example.html',
  styleUrl: './nav-list-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavListExample {
  pages = [
    { id: 'general', title: 'General', description: 'Name, region and language.', icon: 'sliders' },
    { id: 'team', title: 'Team', description: 'People and permissions.', icon: 'users' },
    { id: 'billing', title: 'Billing', description: 'Plan, invoices and payment methods.', icon: 'credit-card' },
  ];

  opened = signal<string | null>(null);
}
