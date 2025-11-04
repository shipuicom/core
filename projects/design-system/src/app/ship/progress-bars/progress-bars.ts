import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipAlert } from 'ship-ui';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseProgressBar } from './examples/base-progress-bar/base-progress-bar';
import { FlatProgressBar } from './examples/flat-progress-bar/flat-progress-bar';
import { IndeterminteProgressBar } from './examples/indeterminte-progress-bar/indeterminte-progress-bar';
import { OutlinedProgressBar } from './examples/outlined-progress-bar/outlined-progress-bar';
import { RaisedProgressBar } from './examples/raised-progress-bar/raised-progress-bar';

@Component({
  selector: 'app-progress-bars',
  imports: [
    ShipAlert,
    PropertyViewer,
    Previewer,
    BaseProgressBar,
    FlatProgressBar,
    OutlinedProgressBar,
    RaisedProgressBar,
    IndeterminteProgressBar,
  ],
  templateUrl: './progress-bars.html',
  styleUrl: './progress-bars.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProgressBars {}
