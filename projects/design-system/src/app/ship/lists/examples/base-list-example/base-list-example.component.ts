import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ShipCheckbox, ShipIcon, ShipList } from 'ship-ui';

@Component({
  selector: 'base-list-example',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, ShipList, ShipIcon, ShipCheckbox],
  templateUrl: './base-list-example.component.html',
  styleUrls: ['./base-list-example.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseListExampleComponent {
  active = signal(false);
  checkbox1 = new FormControl(false);
  checkbox2 = signal(false);
}
