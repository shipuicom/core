import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { BaseCheckboxComponent } from './examples/base-checkbox/base-checkbox.component';
import { CheckboxSandboxComponent } from './examples/checkbox-sandbox.component';
import { FlatCheckboxComponent } from './examples/flat-checkbox/flat-checkbox.component';
import { OutlinedCheckboxComponent } from './examples/outlined-checkbox/outlined-checkbox.component';
import { RaisedCheckboxComponent } from './examples/raised-checkbox/raised-checkbox.component';
import { SimpleCheckboxComponent } from './examples/simple-checkbox/simple-checkbox.component';

@Component({
  selector: 'app-checkboxes',
  imports: [
    PreviewerComponent,
    PropertyViewerComponent,
    BaseCheckboxComponent,
    SimpleCheckboxComponent,
    OutlinedCheckboxComponent,
    FlatCheckboxComponent,
    RaisedCheckboxComponent,
    CheckboxSandboxComponent,
  ],
  templateUrl: './checkboxes.component.html',
  styleUrl: './checkboxes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CheckboxesComponent {}
