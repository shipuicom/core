import { Component } from '@angular/core';
import { SparkleButtonComponent, SparkleMenuComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'spk-toggle-select-menu-example',
  templateUrl: './toggle-select-menu-example.component.html',
  styleUrls: ['./toggle-select-menu-example.component.scss'],
  imports: [SparkleMenuComponent, SparkleButtonComponent],
  standalone: true,
})
export class ToggleSelectMenuExampleComponent {
  menuItems = [
    { label: 'Email Notifications', value: 'email' },
    { label: 'SMS Alerts', value: 'sms' },
    { label: 'Push Notifications', value: 'push' },
  ];
  selected: Set<string> = new Set();

  toggle(item: any) {
    if (this.selected.has(item.value)) {
      this.selected.delete(item.value);
    } else {
      this.selected.add(item.value);
    }
    // Force change detection for Set
    this.selected = new Set(this.selected);
  }

  isSelected(item: any) {
    return this.selected.has(item.value);
  }
}
