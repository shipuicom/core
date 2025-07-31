import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ShipCheckboxComponent, ShipIconComponent, ShipListComponent } from '@ship-ui/core';

@Component({
  selector: 'base-list-example',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, ShipListComponent, ShipIconComponent, ShipCheckboxComponent],
  templateUrl: './base-list-example.component.html',
  styleUrls: ['./base-list-example.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseListExampleComponent {
  active = signal(false);
  checkbox1 = new FormControl(false);
  checkbox2 = signal(false);
}
