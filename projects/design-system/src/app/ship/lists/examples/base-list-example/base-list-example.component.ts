import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ShipCheckboxComponent, ShipIcon, ShipListComponent } from 'ship-ui';

@Component({
  selector: 'base-list-example',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, ShipListComponent, ShipIcon, ShipCheckboxComponent],
  templateUrl: './base-list-example.component.html',
  styleUrls: ['./base-list-example.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseListExampleComponent {
  active = signal(false);
  checkbox1 = new FormControl(false);
  checkbox2 = signal(false);
}
