import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { ShipCardComponent, ShipIcon, ShipTabsComponent } from '../../../../ship-ui/src/public-api';
import { HighlightFileComponent } from './highlight-file/highlight-file.component';

@Component({
  selector: 'app-previewer',
  imports: [HighlightFileComponent, ShipTabsComponent, ShipIcon, ShipCardComponent],
  templateUrl: './previewer.component.html',
  styleUrl: './previewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewerComponent {
  path = input.required<string>();

  title = input<string>('');
  view = signal('');

  toggleView(newView: string) {
    if (newView === this.view()) {
      this.view.set('');
    } else {
      this.view.set(newView);
    }
  }
}
