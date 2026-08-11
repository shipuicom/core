import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { ButtonPopover } from './examples/button-popover/button-popover';
import { CenteredPopover } from './examples/centered-popover/centered-popover';
import { ShButtonPopover } from './examples/sh-button-popover/sh-button-popover';
import { TriggerAttributePopover } from './examples/trigger-attribute-popover/trigger-attribute-popover';

@Component({
  selector: 'app-popovers-examples',
  imports: [Previewer, ButtonPopover, ShButtonPopover, TriggerAttributePopover, CenteredPopover],
  templateUrl: './popovers-examples.html',
  styleUrl: './popovers-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PopoversExamples {}
