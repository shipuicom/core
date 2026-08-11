import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BasicTooltip } from './examples/basic-tooltip/basic-tooltip';
import { LongTooltip } from './examples/long-tooltip/long-tooltip';
import { ScrolledTooltip } from './examples/scrolled-tooltip/scrolled-tooltip';
import { TemplateTooltip } from './examples/template-tooltip/template-tooltip';
import { ThemedTooltip } from './examples/themed-tooltip/themed-tooltip';

@Component({
  selector: 'app-tooltips-examples',
  imports: [Previewer, BasicTooltip, ScrolledTooltip, TemplateTooltip, ThemedTooltip, LongTooltip],
  templateUrl: './tooltips-examples.html',
  styleUrl: './tooltips-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TooltipsExamples {}
