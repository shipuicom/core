import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { ButtonPopoverComponent } from './examples/button-popover/button-popover.component';
import { ShButtonPopoverComponent } from './examples/sh-button-popover/sh-button-popover.component';
import { TriggerAttributePopoverComponent } from './examples/trigger-attribute-popover/trigger-attribute-popover.component';

@Component({
  selector: 'app-popovers',
  imports: [
    ButtonPopoverComponent,
    ShButtonPopoverComponent,
    TriggerAttributePopoverComponent,
    PreviewerComponent,
    PropertyViewerComponent,
  ],
  templateUrl: './popovers.component.html',
  styleUrl: './popovers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PopoversComponent {}
