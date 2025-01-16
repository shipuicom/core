import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleVirtualScrollComponent } from '../../../../../sparkle-ui/src/public-api';

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
  selector: 'app-spk-virtual-scroll',
  imports: [SparkleVirtualScrollComponent],
  templateUrl: './spk-virtual-scroll.component.html',
  styleUrl: './spk-virtual-scroll.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkVirtualScrollComponent {
  items = signal<ExampleItem[]>(data);
}
