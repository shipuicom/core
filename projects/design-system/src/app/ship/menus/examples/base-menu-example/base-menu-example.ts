import { Component } from '@angular/core';
import { ShipButton, ShipMenu } from 'ship-ui';

@Component({
  selector: 'base-menu-example',
  templateUrl: './base-menu-example.html',
  styleUrls: ['./base-menu-example.scss'],
  imports: [ShipMenu, ShipButton],
})
export class BaseMenuExample {
  menuItems = [
    { label: 'Home', value: 'home' },
    { label: 'Profile', value: 'profile' },
    { label: 'Settings', value: 'settings' },
  ];

  someFunction(item: any) {
    alert(item.label);
  }
}
