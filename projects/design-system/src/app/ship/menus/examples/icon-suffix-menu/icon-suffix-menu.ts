import { Component, signal } from '@angular/core';
import { ShipButton, ShipIcon, ShipMenu } from 'ship-ui';

@Component({
  selector: 'sh-icon-suffix-menu',
  templateUrl: './icon-suffix-menu.html',
  styleUrls: ['./icon-suffix-menu.scss'],
  imports: [ShipMenu, ShipIcon, ShipButton],
})
export class IconSuffixMenu {
  menuItems = [
    { label: 'Home', value: 'home', hotkey: '⌘L' },
    { label: 'Profile', value: 'profile', hotkey: '⌘K' },
    { label: 'Settings', value: 'settings', hotkey: '⌘J' },
  ];

  selected = signal<string | null>(null);

  select(item: any) {
    this.selected.set(item.value);
  }
}
