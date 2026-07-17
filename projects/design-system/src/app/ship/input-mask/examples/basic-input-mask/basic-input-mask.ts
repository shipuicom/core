import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipFormField } from '@ship-ui/core/ship-form-field';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipInputMask } from '@ship-ui/core/ship-input-mask';

@Component({
  selector: 'app-basic-input-mask',
  standalone: true,
  imports: [ShipFormField, ShipIcon, ShipInputMask],
  templateUrl: './basic-input-mask.html',
  styleUrl: './basic-input-mask.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicInputMask {}
