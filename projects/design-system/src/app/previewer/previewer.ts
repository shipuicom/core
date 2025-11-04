import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { ShipCard, ShipIcon, ShipTabs } from 'ship-ui';
import { HighlightFile } from './highlight-file/highlight-file';

@Component({
  selector: 'app-previewer',
  imports: [HighlightFile, ShipTabs, ShipIcon, ShipCard],
  templateUrl: './previewer.html',
  styleUrl: './previewer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Previewer {
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
