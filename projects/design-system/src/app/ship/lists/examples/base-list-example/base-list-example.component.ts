import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ShipCheckbox } from '@ship-ui/core/ship-checkbox';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipList } from '@ship-ui/core/ship-list';

@Component({
  selector: 'base-list-example',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, ShipList, ShipIcon, ShipCheckbox],
  templateUrl: './base-list-example.html',
  styleUrls: ['./base-list-example.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseListExampleComponent {
  active = signal(false);
  checkbox1 = new FormControl(false);
  checkbox2 = signal(false);
}
