import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { BaseToggleComponent } from './examples/base-toggle/base-toggle.component';
import { FlatToggleComponent } from './examples/flat-toggle/flat-toggle.component';
import { OutlinedToggleComponent } from './examples/outlined-toggle/outlined-toggle.component';
import { RaisedToggleComponent } from './examples/raised-toggle/raised-toggle.component';
import { SimpleToggleComponent } from './examples/simple-toggle/simple-toggle.component';
import { ToggleSandboxComponent } from './examples/toggle-sandbox.component';

@Component({
  selector: 'app-toggles',
  imports: [
    PreviewerComponent,
    PropertyViewerComponent,
    BaseToggleComponent,
    SimpleToggleComponent,
    OutlinedToggleComponent,
    FlatToggleComponent,
    RaisedToggleComponent,
    ToggleSandboxComponent,
  ],
  templateUrl: './toggles.component.html',
  styleUrl: './toggles.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TogglesComponent {}
