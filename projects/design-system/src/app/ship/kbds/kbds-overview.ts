import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BasicKbd } from './examples/basic-kbd/basic-kbd';

@Component({
  selector: 'app-kbds-overview',
  imports: [Previewer, BasicKbd],
  templateUrl: './kbds-overview.html',
  styleUrl: './kbds-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class KbdsOverview {}
