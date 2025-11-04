import { Component, signal } from '@angular/core';
import { ShipButton, ShipIcon, ShipMenuComponent } from 'ship-ui';

@Component({
  selector: 'sh-icon-suffix-menu',
  templateUrl: './icon-suffix-menu.component.html',
  styleUrls: ['./icon-suffix-menu.component.scss'],
  imports: [ShipMenuComponent, ShipIcon, ShipButton],
})
export class IconSuffixMenuComponent {
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
