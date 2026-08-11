import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BaseAccordion } from './examples/base-accordion/base-accordion';
import { SandboxAccordion } from './examples/sandbox-accordion/sandbox-accordion';
import { TypeBAccordion } from './examples/type-b-accordion/type-b-accordion';

@Component({
  selector: 'app-accordions-examples',
  imports: [Previewer, SandboxAccordion, BaseAccordion, TypeBAccordion],
  templateUrl: './accordions-examples.html',
  styleUrl: './accordions-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AccordionsExamples {}
