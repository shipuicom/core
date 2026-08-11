import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BasicSpotlightExample } from './examples/basic-spotlight/basic-spotlight';

@Component({
  selector: 'app-spotlight-examples',
  imports: [Previewer, BasicSpotlightExample],
  templateUrl: './spotlight-examples.html',
  styleUrl: './spotlight-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpotlightExamples {}
