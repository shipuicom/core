import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { ButtonPopoverComponent } from './examples/button-popover/button-popover.component';
import { SpkButtonPopoverComponent } from './examples/spk-button-popover/spk-button-popover.component';
import { TriggerAttributePopoverComponent } from './examples/trigger-attribute-popover/trigger-attribute-popover.component';

@Component({
  selector: 'app-spk-popover',
  imports: [
    ButtonPopoverComponent,
    SpkButtonPopoverComponent,
    TriggerAttributePopoverComponent,
    PreviewerComponent,
    PropertyViewerComponent,
  ],
  templateUrl: './spk-popover.component.html',
  styleUrl: './spk-popover.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkPopoverComponent {}
