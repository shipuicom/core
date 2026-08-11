import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicVirtualScroll } from './examples/basic-virtual-scroll/basic-virtual-scroll';

@Component({
  selector: 'app-virtual-scrolls-overview',
  imports: [Previewer, PropertyViewer, BasicVirtualScroll],
  templateUrl: './virtual-scrolls-overview.html',
  styleUrl: './virtual-scrolls-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class VirtualScrollsOverview {}
