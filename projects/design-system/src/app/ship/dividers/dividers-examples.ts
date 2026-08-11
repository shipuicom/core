import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BaseDivider } from './examples/base-divider/base-divider';
import { TextDivider } from './examples/text-divider/text-divider';

@Component({
  selector: 'app-dividers-examples',
  imports: [Previewer, BaseDivider, TextDivider],
  templateUrl: './dividers-examples.html',
  styleUrl: './dividers-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DividersExamples {}
