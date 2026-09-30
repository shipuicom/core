import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { ShipAccordion } from '@ship-ui/core/ship-accordion';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipFormField } from '@ship-ui/core/ship-form-field';
import { ShipVariant } from '@ship-ui/core';

@Component({
  selector: 'app-sandbox-accordion',
  imports: [ShipAccordion, ShipFormField, ShipButton],
  templateUrl: './sandbox-accordion.html',
  styleUrl: './sandbox-accordion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SandboxAccordion {
  value = model<string>('panel1');
  allowMultiple = input(false);
  variant = input<ShipVariant | null>(null);
}
