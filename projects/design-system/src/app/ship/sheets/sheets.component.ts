import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipIconComponent } from 'ship-ui';

@Component({
  selector: 'app-sheets',
  imports: [FormsModule, ShipIconComponent],
  templateUrl: './sheets.component.html',
  styleUrl: './sheets.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SheetsComponent {
  colors = ['', 'primary', 'accent', 'warn', 'error', 'success'];
  variants = ['', 'simple', 'outlined', 'flat', 'raised'];

  dynamicColor = signal<string>('#2f54eb');
}
