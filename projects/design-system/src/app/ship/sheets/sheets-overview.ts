import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { Highlight } from '../../previewer/highlight/highlight';

@Component({
  selector: 'app-sheets-overview',
  imports: [ShipIcon, Highlight],
  templateUrl: './sheets-overview.html',
  styleUrl: './sheets-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SheetsOverview {
  basicCode = `<div class="sh-sheet">
  <sh-icon>circle</sh-icon>
  Content on a sheet
</div>`;
}
