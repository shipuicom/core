import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  AfterDropResponse,
  moveIndex,
  SparkleSortableDirective,
} from '../../../../../sparkle-ui/src/lib/sparkle-sortable/sparkle-sortable.directive';
import { SparkleIconComponent, SparkleListComponent } from '../../../../../sparkle-ui/src/public-api';

const CONTENT_EXAMPLE = [
  {
    id: 'id1',
    header: 'Hello',
    content: 'hello again',
  },

  {
    id: 'id2',
    header: 'Hello',
    content: 'hello again',
  },
  {
    id: 'id3',
    header: 'Hello',
    content: 'hello again',
  },
  {
    id: 'id4',
    header: 'Hello',
    content: 'hello again',
  },
  {
    id: 'id5',
    header: 'Hello',
    content: 'hello again',
  },

  {
    id: 'id6',
    header: 'Hello',
    content: 'hello again',
  },
];

type ItemType = (typeof CONTENT_EXAMPLE)[0];

@Component({
  selector: 'app-spk-sortable',
  standalone: true,
  imports: [SparkleListComponent, SparkleIconComponent, SparkleSortableDirective],
  templateUrl: './spk-sortable.component.html',
  styleUrl: './spk-sortable.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkSortableComponent {
  items = signal(CONTENT_EXAMPLE);

  ngOnInit() {
    setTimeout(() => {
      this.items.update((items) => items.concat([CONTENT_EXAMPLE[0]]));
    }, 800);
  }

  reorder(event: AfterDropResponse) {
    this.items.update((arr) => moveIndex<ItemType>(arr, event));
  }
}
