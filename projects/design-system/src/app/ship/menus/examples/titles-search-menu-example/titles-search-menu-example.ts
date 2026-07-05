import { Component } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipMenu } from '@ship-ui/core/ship-menu';

@Component({
  selector: 'sh-titles-search-menu-example',
  templateUrl: './titles-search-menu-example.html',
  styleUrls: ['./titles-search-menu-example.scss'],
  imports: [ShipMenu, ShipButton],
  standalone: true,
})
export class TitlesSearchMenuExample {
  sections = [
    {
      title: 'Admin',
      items: [
        { label: 'Dashboard', value: 'dashboard' },
        { label: 'Users', value: 'users' },
        { label: 'Permissions', value: 'permissions' },
      ]
    },
    {
      title: 'Personal',
      items: [
        { label: 'Profile', value: 'profile' },
        { label: 'Settings', value: 'settings' },
        { label: 'Security', value: 'security' },
      ]
    },
    {
      title: 'Support',
      items: [
        { label: 'Help Center', value: 'help' },
        { label: 'Feedback', value: 'feedback' },
        { label: 'Contact Us', value: 'contact' },
      ]
    }
  ];
  selected: string | null = null;

  select(value: string) {
    this.selected = value;
  }
}
