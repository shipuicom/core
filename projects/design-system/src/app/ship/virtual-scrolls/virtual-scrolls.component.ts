import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipVirtualScrollComponent } from 'ship-ui';

type ExampleItem = {
  id: number;
  name: string;
  color: string;
  fontSize: number;
  showContent: boolean;
};
const data: Array<ExampleItem> = [];

const colors = ['lightblue', 'lightgreen', 'lightpink'];

for (let i = 0; i < 1000; i++) {
  data.push({
    id: i,
    name: 'Item ' + i,
    color: colors[i % colors.length],
    fontSize: 16 + (i % 5), // Vary font size to simulate different heights
    showContent: i % 2 === 0,
  });
}

@Component({
  selector: 'app-virtual-scrolls',
  imports: [ShipVirtualScrollComponent],
  templateUrl: './virtual-scrolls.component.html',
  styleUrl: './virtual-scrolls.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class VirtualScrollsComponent {
  items = signal<ExampleItem[]>(data);
}
