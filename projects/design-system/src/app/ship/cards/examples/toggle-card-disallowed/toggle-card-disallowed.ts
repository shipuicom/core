import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipMenu } from '@ship-ui/core/ship-menu';
import { ShipToggleCard } from '@ship-ui/core/ship-toggle-card';

@Component({
  selector: 'app-toggle-card-disallowed-example',
  standalone: true,
  imports: [ShipToggleCard, ShipMenu, ShipButton],
  templateUrl: './toggle-card-disallowed.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleCardDisallowedExampleComponent {
  menuItems = [
    { label: 'Dashboard', value: 'dashboard' },
    { label: 'Users', value: 'users' },
    { label: 'Settings', value: 'settings' },
    { label: 'Billing', value: 'billing' },
  ];
  selected: string | null = null;

  select(item: any) {
    this.selected = item.value;
  }
}
