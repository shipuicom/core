import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  SparkleCheckboxComponent,
  SparkleIconComponent,
  SparkleListComponent,
} from '../../../../../sparkle-ui/src/public-api';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { BaseListExampleComponent } from './examples/base-list-example/base-list-example.component';

@Component({
  selector: 'app-spk-list',
  imports: [
    ReactiveFormsModule,
    SparkleListComponent,
    SparkleIconComponent,
    SparkleCheckboxComponent,
    PreviewerComponent,
    BaseListExampleComponent,
    PropertyViewerComponent,
  ],
  templateUrl: './spk-list.component.html',
  styleUrl: './spk-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkListComponent {
  active = signal(false);
  checkbox1 = new FormControl(false);
  checkbox2 = new FormControl(false);
}
