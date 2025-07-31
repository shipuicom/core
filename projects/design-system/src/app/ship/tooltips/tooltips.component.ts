import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { BasicTooltipComponent } from './examples/basic-tooltip/basic-tooltip.component';
import { LongTooltipComponent } from './examples/long-tooltip/long-tooltip.component';
import { ScrolledTooltipComponent } from './examples/scrolled-tooltip/scrolled-tooltip.component';
import { TemplateTooltipComponent } from './examples/template-tooltip/template-tooltip.component';
import { ThemedTooltipComponent } from './examples/themed-tooltip/themed-tooltip.component';

@Component({
  selector: 'app-tooltips',
  imports: [
    FormsModule,
    ScrolledTooltipComponent,
    BasicTooltipComponent,
    TemplateTooltipComponent,
    ThemedTooltipComponent,
    LongTooltipComponent,
    PropertyViewerComponent,
    PreviewerComponent,
  ],
  templateUrl: './tooltips.component.html',
  styleUrl: './tooltips.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TooltipsComponent {
  tooltipValue = signal<string>('Hello world');

  clicked() {
    alert('clicked');
  }
}
