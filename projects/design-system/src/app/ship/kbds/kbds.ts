import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import { ApiReference } from '../../api-reference/api-reference';
import { Previewer } from '../../previewer/previewer';
import { BasicKbd } from './examples/basic-kbd/basic-kbd';

@Component({
  selector: 'app-kbds',
  imports: [ShipTabs, ApiReference, Previewer, BasicKbd],
  templateUrl: './kbds.html',
  styleUrl: './kbds.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Kbds {
  activeTab = signal('overview');
  view = signal<'example' | 'code'>('example');
}
