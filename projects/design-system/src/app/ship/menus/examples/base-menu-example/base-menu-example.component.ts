import { Component } from '@angular/core';
import { ShipMenuComponent } from '@ship-ui/core';

@Component({
  selector: 'base-menu-example',
  templateUrl: './base-menu-example.component.html',
  styleUrls: ['./base-menu-example.component.scss'],
  imports: [ShipMenuComponent],
})
export class BaseMenuExampleComponent {
  menuItems = [
    { label: 'Home', value: 'home' },
    { label: 'Profile', value: 'profile' },
    { label: 'Settings', value: 'settings' },
  ];

  someFunction(item: any) {
    alert(item.label);
  }
}
