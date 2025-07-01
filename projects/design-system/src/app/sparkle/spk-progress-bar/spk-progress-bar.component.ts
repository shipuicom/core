import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleAlertComponent } from '../../../../../sparkle-ui/src/public-api';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { BaseProgressBarComponent } from './examples/base-progress-bar/base-progress-bar.component';
import { FlatProgressBarComponent } from './examples/flat-progress-bar/flat-progress-bar.component';
import { IndeterminteProgressBarComponent } from './examples/indeterminte-progress-bar/indeterminte-progress-bar.component';
import { OutlinedProgressBarComponent } from './examples/outlined-progress-bar/outlined-progress-bar.component';
import { RaisedProgressBarComponent } from './examples/raised-progress-bar/raised-progress-bar.component';

@Component({
  selector: 'app-spk-progress-bar',
  imports: [
    SparkleAlertComponent,
    PropertyViewerComponent,
    PreviewerComponent,
    BaseProgressBarComponent,
    FlatProgressBarComponent,
    OutlinedProgressBarComponent,
    RaisedProgressBarComponent,
    IndeterminteProgressBarComponent,
  ],
  templateUrl: './spk-progress-bar.component.html',
  styleUrl: './spk-progress-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkProgressBarComponent {}
