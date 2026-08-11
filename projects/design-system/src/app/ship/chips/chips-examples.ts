import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BaseChip } from './examples/base-chip/base-chip';
import { ChipSandbox } from './examples/chip-sandbox/chip-sandbox';
import { FlatChip } from './examples/flat-chip/flat-chip';
import { OutlinedChip } from './examples/outlined-chip/outlined-chip';
import { RaisedChip } from './examples/raised-chip/raised-chip';
import { SimpleChip } from './examples/simple-chip/simple-chip';

@Component({
  selector: 'app-chips-examples',
  imports: [Previewer, ChipSandbox, BaseChip, SimpleChip, OutlinedChip, FlatChip, RaisedChip],
  templateUrl: './chips-examples.html',
  styleUrl: './chips-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ChipsExamples {}
