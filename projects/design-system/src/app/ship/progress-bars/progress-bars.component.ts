import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipAlertComponent } from 'ship-ui';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { BaseProgressBarComponent } from './examples/base-progress-bar/base-progress-bar.component';
import { FlatProgressBarComponent } from './examples/flat-progress-bar/flat-progress-bar.component';
import { IndeterminteProgressBarComponent } from './examples/indeterminte-progress-bar/indeterminte-progress-bar.component';
import { OutlinedProgressBarComponent } from './examples/outlined-progress-bar/outlined-progress-bar.component';
import { RaisedProgressBarComponent } from './examples/raised-progress-bar/raised-progress-bar.component';

@Component({
  selector: 'app-progress-bars',
  imports: [
    ShipAlertComponent,
    PropertyViewerComponent,
    PreviewerComponent,
    BaseProgressBarComponent,
    FlatProgressBarComponent,
    OutlinedProgressBarComponent,
    RaisedProgressBarComponent,
    IndeterminteProgressBarComponent,
  ],
  templateUrl: './progress-bars.component.html',
  styleUrl: './progress-bars.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProgressBarsComponent {}
