import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipBlockContactVariant, ShipColor } from '@ship-ui/core';
import { ShipBlockContact } from '@ship-ui/core/ship-block';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipFormField } from '@ship-ui/core/ship-form-field';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-contact-sandbox',
  imports: [ShipBlockContact, ShipButton, ShipFormField, ShipIcon],
  templateUrl: './contact-sandbox.html',
  styleUrl: '../sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSandbox {
  variant = input<ShipBlockContactVariant>('');
  color = input<ShipColor>('primary');
}
