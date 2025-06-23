import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { BaseChipComponent } from './examples/base-chip/base-chip.component';
import { ChipSandboxComponent } from './examples/chip-sandbox/chip-sandbox.component';
import { FlatChipComponent } from './examples/flat-chip/flat-chip.component';
import { OutlinedChipComponent } from './examples/outlined-chip/outlined-chip.component';
import { RaisedChipComponent } from './examples/raised-chip/raised-chip.component';
import { SimpleChipComponent } from './examples/simple-chip/simple-chip.component';

@Component({
  selector: 'app-spk-chips',
  imports: [
    PreviewerComponent,
    PropertyViewerComponent,
    ChipSandboxComponent,
    BaseChipComponent,
    OutlinedChipComponent,
    SimpleChipComponent,
    FlatChipComponent,
    RaisedChipComponent,
  ],
  templateUrl: './spk-chips.component.html',
  styleUrl: './spk-chips.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkChipsComponent {
  view = signal<'example' | 'code'>('example');

  example1 = `<spk-chip>
  <spk-icon>circle</spk-icon>
  Default chip
  <spk-icon suffix>circle</spk-icon>
</spk-chip>`;
}
