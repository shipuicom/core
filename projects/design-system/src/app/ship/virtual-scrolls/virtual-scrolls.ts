import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import { ShipVirtualScroll } from '@ship-ui/core/ship-virtual-scroll';
import { ApiReference } from '../../api-reference/api-reference';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicVirtualScroll } from './examples/basic-virtual-scroll/basic-virtual-scroll';

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
  imports: [ShipTabs, ApiReference, PropertyViewer, Previewer, ShipVirtualScroll, BasicVirtualScroll],
  templateUrl: './virtual-scrolls.html',
  styleUrl: './virtual-scrolls.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class VirtualScrolls {
  activeTab = signal('overview');
  items = signal<ExampleItem[]>(data);
}
