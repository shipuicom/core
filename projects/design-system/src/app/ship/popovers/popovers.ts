import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { ButtonPopover } from './examples/button-popover/button-popover';
import { ShButtonPopover } from './examples/sh-button-popover/sh-button-popover';
import { TriggerAttributePopover } from './examples/trigger-attribute-popover/trigger-attribute-popover';

@Component({
  selector: 'app-popovers',
  imports: [ButtonPopover, ShButtonPopover, TriggerAttributePopover, Previewer, PropertyViewer],
  templateUrl: './popovers.html',
  styleUrl: './popovers.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Popovers {}
