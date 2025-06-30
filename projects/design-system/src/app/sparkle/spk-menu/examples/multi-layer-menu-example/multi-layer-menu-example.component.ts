import { Component } from '@angular/core';
import { SparkleButtonComponent, SparkleMenuComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'spk-multi-layer-menu-example',
  templateUrl: './multi-layer-menu-example.component.html',
  styleUrls: ['./multi-layer-menu-example.component.scss'],
  imports: [SparkleMenuComponent, SparkleButtonComponent],
  standalone: true,
})
export class MultiLayerMenuExampleComponent {
  menu = [
    {
      label: 'File',
      children: [
        { label: 'New', value: 'new' },
        { label: 'Open', value: 'open' },
        { label: 'Exit', value: 'exit' },
      ],
    },
    {
      label: 'Edit',
      children: [
        { label: 'Undo', value: 'undo' },
        { label: 'Redo', value: 'redo' },
      ],
    },
    { label: 'Help', value: 'help' },
  ];
  selected: string | null = null;
  openSubmenu: number | null = null;

  select(item: any) {
    this.selected = item.value;
  }

  toggleSubmenu(idx: number) {
    this.openSubmenu = this.openSubmenu === idx ? null : idx;
  }
}
