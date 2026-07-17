import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import { Highlight } from '../../previewer/highlight/highlight';

@Component({
  selector: 'app-sheets',
  imports: [ShipTabs, FormsModule, ShipIcon, Highlight],
  templateUrl: './sheets.html',
  styleUrl: './sheets.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Sheets {
  activeTab = signal('overview');
  colors = ['', 'primary', 'accent', 'warn', 'error', 'success'];
  variants = ['', 'simple', 'outlined', 'flat', 'raised'];

  dynamicColor = signal<string>('#2f54eb');

  basicCode = `<div class="sh-sheet">
  <sh-icon>circle</sh-icon>
  Content on a sheet
</div>`;
}
