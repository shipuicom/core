import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicTooltip } from './examples/basic-tooltip/basic-tooltip';
import { LongTooltip } from './examples/long-tooltip/long-tooltip';
import { ScrolledTooltip } from './examples/scrolled-tooltip/scrolled-tooltip';
import { TemplateTooltip } from './examples/template-tooltip/template-tooltip';
import { ThemedTooltip } from './examples/themed-tooltip/themed-tooltip';

@Component({
  selector: 'app-tooltips',
  imports: [
    FormsModule,
    ScrolledTooltip,
    BasicTooltip,
    TemplateTooltip,
    ThemedTooltip,
    LongTooltip,
    PropertyViewer,
    Previewer,
  ],
  templateUrl: './tooltips.html',
  styleUrl: './tooltips.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Tooltips {
  tooltipValue = signal<string>('Hello world');

  clicked() {
    alert('clicked');
  }
}
