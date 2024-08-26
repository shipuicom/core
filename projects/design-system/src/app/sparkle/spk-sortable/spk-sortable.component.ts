import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleSortableComponent } from '../../../../../sparkle-ui/src/public-api';

const CONTENT_EXAMPLE = [
  {
    header: 'Hello',
    content: 'hello again',
  },

  {
    header: 'Hello',
    content: 'hello again',
  },

  {
    header: 'Hello',
    content: 'hello again',
  },
];
@Component({
  selector: 'app-spk-sortable',
  standalone: true,
  imports: [SparkleSortableComponent],
  templateUrl: './spk-sortable.component.html',
  styleUrl: './spk-sortable.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkSortableComponent {
  items = signal(CONTENT_EXAMPLE);
}
