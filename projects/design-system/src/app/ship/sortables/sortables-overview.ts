import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Highlight } from '../../previewer/highlight/highlight';
import { Previewer } from '../../previewer/previewer';
import { BaseSortable } from './examples/base-sortable/base-sortable';

@Component({
  selector: 'app-sortables-overview',
  imports: [Previewer, Highlight, BaseSortable],
  templateUrl: './sortables-overview.html',
  styleUrl: './sortables-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SortablesOverview {
  exampleCode = `<sh-list [shSortable]="manager">
  @for (item of items(); track $index) {
    <div item [draggable]="true">
      {{ item.name }}
    </div>
  }
</sh-list>`;
}
