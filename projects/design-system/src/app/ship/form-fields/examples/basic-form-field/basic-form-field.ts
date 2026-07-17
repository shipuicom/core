import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipFormField } from '@ship-ui/core/ship-form-field';

@Component({
  selector: 'app-basic-form-field',
  standalone: true,
  imports: [ShipFormField],
  templateUrl: './basic-form-field.html',
  styleUrl: './basic-form-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicFormField {}
