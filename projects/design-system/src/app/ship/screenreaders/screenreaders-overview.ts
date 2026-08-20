import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BasicScreenreader } from './examples/basic-screenreader/basic-screenreader';

@Component({
  selector: 'app-screenreaders-overview',
  imports: [Previewer, BasicScreenreader],
  templateUrl: './screenreaders-overview.html',
  styleUrl: './screenreaders-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ScreenreadersOverview {}
