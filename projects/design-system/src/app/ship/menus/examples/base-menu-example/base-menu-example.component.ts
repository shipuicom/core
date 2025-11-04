import { Component } from '@angular/core';
import { ShipButton, ShipMenuComponent } from 'ship-ui';

@Component({
  selector: 'base-menu-example',
  templateUrl: './base-menu-example.component.html',
  styleUrls: ['./base-menu-example.component.scss'],
  imports: [ShipMenuComponent, ShipButton],
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
