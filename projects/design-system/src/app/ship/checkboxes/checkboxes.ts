import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseCheckbox } from './examples/base-checkbox/base-checkbox';
import { CheckboxSandbox } from './examples/checkbox-sandbox';
import { FlatCheckbox } from './examples/flat-checkbox/flat-checkbox';
import { OutlinedCheckbox } from './examples/outlined-checkbox/outlined-checkbox';
import { RaisedCheckbox } from './examples/raised-checkbox/raised-checkbox';
import { SimpleCheckbox } from './examples/simple-checkbox/simple-checkbox';

@Component({
  selector: 'app-checkboxes',
  imports: [
    Previewer,
    PropertyViewer,
    BaseCheckbox,
    SimpleCheckbox,
    OutlinedCheckbox,
    FlatCheckbox,
    RaisedCheckbox,
    CheckboxSandbox,
  ],
  templateUrl: './checkboxes.html',
  styleUrl: './checkboxes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Checkboxes {}
