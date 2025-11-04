import { Component } from '@angular/core';
import { ShipButton, ShipMenu } from 'ship-ui';

@Component({
  selector: 'sh-multi-layer-menu-example',
  templateUrl: './multi-layer-menu-example.html',
  styleUrls: ['./multi-layer-menu-example.scss'],
  imports: [ShipMenu, ShipButton],
  standalone: true,
})
export class MultiLayerMenuExample {
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
