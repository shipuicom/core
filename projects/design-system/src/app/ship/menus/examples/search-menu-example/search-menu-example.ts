import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipButton, ShipMenu } from 'ship-ui';

@Component({
  selector: 'sh-search-menu-example',
  templateUrl: './search-menu-example.html',
  styleUrls: ['./search-menu-example.scss'],
  imports: [FormsModule, ShipMenu, ShipButton],
  standalone: true,
})
export class SearchMenuExample {
  menuItems = [
    { label: 'Dashboard', value: 'dashboard' },
    { label: 'Users', value: 'users' },
    { label: 'Settings', value: 'settings' },
    { label: 'Billing', value: 'billing' },
    { label: 'Support', value: 'support' },
  ];
  search = '';
  selected: string | null = null;

  get filteredItems() {
    return this.menuItems.filter((item) => item.label.toLowerCase().includes(this.search.toLowerCase()));
  }

  select(item: any) {
    this.selected = item.value;
  }
}
