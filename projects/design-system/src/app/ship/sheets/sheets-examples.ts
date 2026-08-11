import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-sheets-examples',
  imports: [FormsModule, ShipIcon],
  templateUrl: './sheets-examples.html',
  styleUrl: './sheets-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SheetsExamples {
  colors = ['', 'primary', 'accent', 'warn', 'error', 'success'];
  variants = ['', 'simple', 'outlined', 'flat', 'raised'];

  dynamicColor = signal<string>('#2f54eb');
}
